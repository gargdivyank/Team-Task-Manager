import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { Comment } from '../models/Comment.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import { canAccessProject, projectMemberIds } from '../services/access.js';
import { logActivity } from '../services/activityService.js';

async function loadProject(projectId) {
  return Project.findById(projectId).populate([
    { path: 'createdBy', select: 'name email' },
    { path: 'members', select: 'name email role' },
  ]);
}

async function ensureProjectAccess(user, projectId) {
  const project = await loadProject(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  if (!canAccessProject(user, project)) {
    throw new AppError('You do not have access to this project', 403);
  }
  return project;
}

function assertDueAfterProjectStart(dueDate, project) {
  const due = new Date(dueDate);
  const start = new Date(project.startDate);
  if (due < start) {
    throw new AppError('Task due date cannot be before the project start date', 400);
  }
}

function assertAssigneeMember(project, assigneeId) {
  const allowed = projectMemberIds(project);
  const id = assigneeId.toString();
  if (!allowed.includes(id)) {
    throw new AppError('Assigned user must be a member of the project', 400);
  }
}

async function accessibleProjectIds(user) {
  if (user.role === 'admin') {
    return Project.find().distinct('_id');
  }
  return Project.find({
    $or: [{ createdBy: user._id }, { members: user._id }],
  }).distinct('_id');
}

export const listTasks = catchAsync(async (req, res) => {
  const {
    status,
    priority,
    assignedTo,
    projectId,
    dueBefore,
    dueAfter,
    overdue,
  } = req.query;

  const ids = await accessibleProjectIds(req.user);
  const filter = { projectId: { $in: ids } };

  if (projectId) {
    await ensureProjectAccess(req.user, projectId);
    filter.projectId = projectId;
  }
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;

  const overdueFlag =
    overdue === true || overdue === 'true' || overdue === '1';

  if (overdueFlag) {
    filter.dueDate = { $lt: new Date() };
    filter.status = { $ne: 'Completed' };
  } else {
    if (dueBefore || dueAfter) {
      filter.dueDate = {};
      if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
      if (dueAfter) filter.dueDate.$gte = new Date(dueAfter);
    }
  }

  const tasks = await Task.find(filter)
    .populate('projectId', 'title status startDate')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1, createdAt: -1 });

  res.json({ status: 'success', data: tasks });
});

async function fetchTask(user, taskId) {
  const task = await Task.findById(taskId)
    .populate('projectId')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

  if (!task) {
    throw new AppError('Task not found', 404);
  }
  const project = await loadProject(task.projectId._id);
  if (!canAccessProject(user, project)) {
    throw new AppError('You do not have access to this task', 403);
  }
  return { task, project };
}

export const getTask = catchAsync(async (req, res) => {
  const { task } = await fetchTask(req.user, req.params.id);
  res.json({ status: 'success', data: task });
});

export const createTask = catchAsync(async (req, res) => {
  const { title, description, projectId, assignedTo, priority, status, dueDate } =
    req.body;

  const project = await ensureProjectAccess(req.user, projectId);
  assertDueAfterProjectStart(dueDate, project);
  assertAssigneeMember(project, assignedTo);

  const task = await Task.create({
    title,
    description: description ?? '',
    projectId,
    assignedTo,
    createdBy: req.user._id,
    priority: priority ?? 'Medium',
    status: status ?? 'To Do',
    dueDate,
  });

  await logActivity({
    actorId: req.user._id,
    action: 'task_created',
    entityType: 'Task',
    entityId: task._id,
    summary: `Created task "${task.title}"`,
    projectId,
  });

  await task.populate([
    { path: 'projectId', select: 'title status startDate' },
    { path: 'assignedTo', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
  ]);
  res.status(201).json({ status: 'success', data: task });
});

export const updateTask = catchAsync(async (req, res) => {
  const { task, project } = await fetchTask(req.user, req.params.id);
  const { title, description, assignedTo, priority, status, dueDate } = req.body;

  if (assignedTo) {
    const projForAssignee = assignedTo.equals(task.assignedTo)
      ? project
      : await loadProject(project._id);
    assertAssigneeMember(projForAssignee, assignedTo);
  }

  const nextDue = dueDate !== undefined ? dueDate : task.dueDate;
  assertDueAfterProjectStart(nextDue, project);

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (assignedTo !== undefined) task.assignedTo = assignedTo;
  if (priority !== undefined) task.priority = priority;
  if (status !== undefined) task.status = status;
  if (dueDate !== undefined) task.dueDate = dueDate;

  await task.save();
  await logActivity({
    actorId: req.user._id,
    action: 'task_updated',
    entityType: 'Task',
    entityId: task._id,
    summary: `Updated task "${task.title}"`,
    projectId: project._id,
  });

  await task.populate([
    { path: 'projectId', select: 'title status startDate' },
    { path: 'assignedTo', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
  ]);
  res.json({ status: 'success', data: task });
});

export const patchTaskStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const { task, project } = await fetchTask(req.user, req.params.id);

  const assigneeId = task.assignedTo._id ?? task.assignedTo;
  if (assigneeId.toString() !== req.user._id.toString()) {
    throw new AppError('You can only update status for tasks assigned to you', 403);
  }

  task.status = status;
  await task.save();
  await logActivity({
    actorId: req.user._id,
    action: 'task_status_updated',
    entityType: 'Task',
    entityId: task._id,
    summary: `Status → ${status}`,
    projectId: project._id,
  });

  await task.populate([
    { path: 'projectId', select: 'title status startDate' },
    { path: 'assignedTo', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
  ]);
  res.json({ status: 'success', data: task });
});

export const deleteTask = catchAsync(async (req, res) => {
  const { task } = await fetchTask(req.user, req.params.id);
  const pid = task.projectId._id || task.projectId;
  await Comment.deleteMany({ taskId: task._id });
  await task.deleteOne();
  await logActivity({
    actorId: req.user._id,
    action: 'task_deleted',
    entityType: 'Task',
    entityId: task._id,
    summary: `Deleted task "${task.title}"`,
    projectId: pid,
  });
  res.status(204).send();
});

export const addComment = catchAsync(async (req, res) => {
  const { message } = req.body;
  const { task, project } = await fetchTask(req.user, req.params.id);

  const comment = await Comment.create({
    taskId: task._id,
    userId: req.user._id,
    message,
  });
  await logActivity({
    actorId: req.user._id,
    action: 'comment_added',
    entityType: 'Comment',
    entityId: comment._id,
    summary: 'Comment added on task',
    projectId: project._id,
  });
  await comment.populate('userId', 'name email');
  res.status(201).json({ status: 'success', data: comment });
});

export const listComments = catchAsync(async (req, res) => {
  const { task } = await fetchTask(req.user, req.params.id);
  const comments = await Comment.find({ taskId: task._id })
    .populate('userId', 'name email')
    .sort({ createdAt: 1 });
  res.json({ status: 'success', data: comments });
});
