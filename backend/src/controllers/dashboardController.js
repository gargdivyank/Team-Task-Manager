import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { Activity } from '../models/Activity.js';
import { catchAsync } from '../utils/catchAsync.js';
import { projectProgress } from './projectController.js';

function projectFilter(user) {
  if (user.role === 'admin') return {};
  return { $or: [{ createdBy: user._id }, { members: user._id }] };
}

export const getDashboard = catchAsync(async (req, res) => {
  const filter = projectFilter(req.user);
  const totalProjects = await Project.countDocuments(filter);

  const projectIds =
    req.user.role === 'admin'
      ? await Project.find().distinct('_id')
      : await Project.find(filter).distinct('_id');

  const tasksBase = Task.find({ projectId: { $in: projectIds } });

  const [
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
    myAssigned,
  ] = await Promise.all([
    Task.countDocuments({ projectId: { $in: projectIds } }),
    Task.countDocuments({ projectId: { $in: projectIds }, status: 'Completed' }),
    Task.countDocuments({
      projectId: { $in: projectIds },
      status: 'To Do',
    }),
    Task.countDocuments({
      projectId: { $in: projectIds },
      status: 'In Progress',
    }),
    Task.countDocuments({
      projectId: { $in: projectIds },
      dueDate: { $lt: new Date() },
      status: { $ne: 'Completed' },
    }),
    Task.countDocuments({
      projectId: { $in: projectIds },
      assignedTo: req.user._id,
    }),
  ]);

  const projects = await Project.find(filter)
    .select('title status')
    .sort({ updatedAt: -1 })
    .limit(50);

  const projectWise = await Promise.all(
    projects.map(async (p) => {
      const prog = await projectProgress(p._id);
      return {
        projectId: p._id,
        title: p.title,
        status: p.status,
        progress: prog,
      };
    })
  );

  const recentActivity = await Activity.find({
    $or: [{ projectId: { $in: projectIds } }, { actorId: req.user._id }],
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('actorId', 'name email');

  res.json({
    status: 'success',
    data: {
      totals: {
        totalProjects,
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        tasksAssignedToMe: myAssigned,
      },
      projectWiseProgress: projectWise,
      recentActivity,
    },
  });
});
