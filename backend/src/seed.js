import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from './config/db.js';
import { User } from './models/User.js';
import { Project } from './models/Project.js';
import { Task } from './models/Task.js';
import { Comment } from './models/Comment.js';
import { Activity } from './models/Activity.js';

/**
 * Clears collections and inserts demo users, a project, tasks, and a comment.
 * Run after MongoDB is up: npm run seed
 */
async function seed() {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET must be set (see .env.example)');
    process.exit(1);
  }
  await connectDb();

  await Comment.deleteMany({});
  await Task.deleteMany({});
  await Activity.deleteMany({});
  await Project.deleteMany({});
  await User.deleteMany({});

  const adminHash = await bcrypt.hash('Admin123!', 12);
  const memberHash = await bcrypt.hash('Member123!', 12);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@company.com',
    password: adminHash,
    role: 'admin',
  });

  const member = await User.create({
    name: 'Member User',
    email: 'member@company.com',
    password: memberHash,
    role: 'member',
  });

  const secondMember = await User.create({
    name: 'Alex Developer',
    email: 'alex@company.com',
    password: memberHash,
    role: 'member',
  });

  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  const end = new Date();
  end.setMonth(end.getMonth() + 6);

  const project = await Project.create({
    title: 'Marketing website relaunch',
    description: 'New brand site with CMS integration and analytics.',
    status: 'In Progress',
    startDate: start,
    endDate: end,
    createdBy: admin._id,
    members: [member._id, secondMember._id],
  });

  const t1Due = new Date(start);
  t1Due.setDate(t1Due.getDate() + 14);

  const t2Due = new Date();
  t2Due.setDate(t2Due.getDate() + 3);

  const t3Due = new Date(start);
  t3Due.setDate(t3Due.getDate() + 45);

  const task1 = await Task.create({
    title: 'Content audit',
    description: 'Inventory legacy pages.',
    projectId: project._id,
    assignedTo: member._id,
    createdBy: admin._id,
    priority: 'High',
    status: 'Completed',
    dueDate: t1Due,
  });

  const task2 = await Task.create({
    title: 'Wireframes',
    description: 'Approve key templates.',
    projectId: project._id,
    assignedTo: member._id,
    createdBy: admin._id,
    priority: 'Medium',
    status: 'In Progress',
    dueDate: t2Due,
  });

  const task3 = await Task.create({
    title: 'Staging deployment',
    description: 'Automate nightly builds.',
    projectId: project._id,
    assignedTo: secondMember._id,
    createdBy: admin._id,
    priority: 'Low',
    status: 'Review',
    dueDate: t3Due,
  });

  await Task.create({
    title: 'Accessibility review',
    description: 'WCAG spot checks.',
    projectId: project._id,
    assignedTo: secondMember._id,
    createdBy: admin._id,
    priority: 'High',
    status: 'To Do',
    dueDate: t3Due,
  });

  await Comment.create({
    taskId: task2._id,
    userId: member._id,
    message: 'Started mobile layouts — on track for Friday.',
  });

  console.log('Seed complete.');
  console.log('  Admin:   admin@company.com   / Admin123!');
  console.log('  Member:  member@company.com  / Member123!');
  console.log('  Member:  alex@company.com    / Member123!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
