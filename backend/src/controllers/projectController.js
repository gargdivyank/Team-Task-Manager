import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { Comment } from '../models/Comment.js';
import { User } from '../models/User.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import { canAccessProject } from '../services/access.js';
import { logActivity } from '../services/activityService.js';

function assertDateOrder(start, end) {
  if (new Date(end) < new Date(start)) {
    throw new AppError('Project end date cannot be before start date', 400);
  }
}

async function projectProgress(projectId) {
  const totals = await Task.aggregate([
    { $match: { projectId: projectId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
        },
      },
    },
  ]);
  if (!totals.length || totals[0].total === 0) return { totalTasks: 0, completedTasks: 0, percent: 0 };
  const total = totals[0].total;
  const completed = totals[0].completed;
  return {
    totalTasks: total,
    completedTasks: completed,
    percent: Math.round((completed / total) * 100),
  };
}

/** Projects visible to member: creator or explicit member */
function projectFilterForRole(userId, role) {
  if (role === 'admin') return {};
  return {
    $or: [{ createdBy: userId }, { members: userId }],
  };
}

export const listProjects = catchAsync(async (req, res) => {
  const filter = projectFilterForRole(req.user._id, req.user.role);
  const projects = await Project.find(filter)
    .populate('createdBy', 'name email')
    .populate('members', 'name email role')
    .sort({ createdAt: -1 });

  const withProgress = await Promise.all(
    projects.map(async (p) => {
      const prog = await projectProgress(p._id);
      const doc = p.toObject();
      return { ...doc, progress: prog };
    })
  );

  res.json({ status: 'success', data: withProgress });
});

export const getProject = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('members', 'name email role');
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  if (!canAccessProject(req.user, project)) {
    throw new AppError('You do not have access to this project', 403);
  }
  const progress = await projectProgress(project._id);
  res.json({
    status: 'success',
    data: {
      ...project.toObject(),
      progress,
    },
  });
});

export const createProject = catchAsync(async (req, res) => {
  const { title, description, status, startDate, endDate } = req.body;
  assertDateOrder(startDate, endDate);
  const members = [];
  const project = await Project.create({
    title,
    description: description ?? '',
    status: status || 'Not Started',
    startDate,
    endDate,
    createdBy: req.user._id,
    members,
  });
  await logActivity({
    actorId: req.user._id,
    action: 'project_created',
    entityType: 'Project',
    entityId: project._id,
    summary: `Created project "${project.title}"`,
    projectId: project._id,
  });
  await project.populate([
    { path: 'createdBy', select: 'name email' },
    { path: 'members', select: 'name email role' },
  ]);
  res.status(201).json({ status: 'success', data: project });
});

export const updateProject = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  const { title, description, status, startDate, endDate } = req.body;
  const nextStart = startDate !== undefined ? startDate : project.startDate;
  const nextEnd = endDate !== undefined ? endDate : project.endDate;
  assertDateOrder(nextStart, nextEnd);
  if (title !== undefined) project.title = title;
  if (description !== undefined) project.description = description;
  if (status !== undefined) project.status = status;
  if (startDate !== undefined) project.startDate = startDate;
  if (endDate !== undefined) project.endDate = endDate;
  await project.save();
  await logActivity({
    actorId: req.user._id,
    action: 'project_updated',
    entityType: 'Project',
    entityId: project._id,
    summary: `Updated project "${project.title}"`,
    projectId: project._id,
  });
  await project.populate([
    { path: 'createdBy', select: 'name email' },
    { path: 'members', select: 'name email role' },
  ]);
  res.json({ status: 'success', data: project });
});

export const deleteProject = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  const title = project.title;
  const taskIds = await Task.find({ projectId: project._id }).distinct('_id');
  await Comment.deleteMany({ taskId: { $in: taskIds } });
  await Task.deleteMany({ projectId: project._id });
  await project.deleteOne();
  await logActivity({
    actorId: req.user._id,
    action: 'project_deleted',
    entityType: 'Project',
    entityId: project._id,
    summary: `Deleted project "${title}"`,
  });
  res.status(204).send();
});

export const addMember = catchAsync(async (req, res) => {
  const { userId } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (project.createdBy.equals(user._id)) {
    throw new AppError('Project creator is already a member', 400);
  }
  const already = project.members.some((m) => m.equals(user._id));
  if (already) {
    throw new AppError('User is already a member', 409);
  }
  project.members.push(user._id);
  await project.save();
  await logActivity({
    actorId: req.user._id,
    action: 'member_added',
    entityType: 'Project',
    entityId: project._id,
    summary: `Added ${user.name} to project`,
    projectId: project._id,
  });
  await project.populate([
    { path: 'createdBy', select: 'name email' },
    { path: 'members', select: 'name email role' },
  ]);
  res.json({ status: 'success', data: project });
});

export const removeMember = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  if (project.createdBy.toString() === userId) {
    throw new AppError('Cannot remove project creator from members list', 400);
  }
  project.members = project.members.filter((m) => m.toString() !== userId);
  await project.save();
  await logActivity({
    actorId: req.user._id,
    action: 'member_removed',
    entityType: 'Project',
    entityId: project._id,
    summary: `Removed member from project`,
    projectId: project._id,
  });
  await project.populate([
    { path: 'createdBy', select: 'name email' },
    { path: 'members', select: 'name email role' },
  ]);
  res.json({ status: 'success', data: project });
});

export { projectProgress };
