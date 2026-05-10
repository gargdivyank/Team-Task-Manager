import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

function publicUser(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    createdAt: doc.createdAt,
  };
}

export const listUsers = catchAsync(async (req, res) => {
  const users = await User.find().select('name email role createdAt').sort({ name: 1 });
  res.json({
    status: 'success',
    data: users.map(publicUser),
  });
});

export const getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ status: 'success', data: publicUser(user) });
});

export const updateProfile = catchAsync(async (req, res) => {
  const { name, email } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) {
    const exists = await User.findOne({
      email,
      _id: { $ne: req.user._id },
    });
    if (exists) {
      throw new AppError('Email already in use', 409);
    }
    updates.email = email;
  }
  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ status: 'success', data: publicUser(user) });
});

export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) {
    throw new AppError('Current password is incorrect', 400);
  }
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  res.json({ status: 'success', message: 'Password updated' });
});
