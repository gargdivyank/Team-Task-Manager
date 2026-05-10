import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/token.js';
import { logActivity } from '../services/activityService.js';

export const signup = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: 'member',
  });
  const token = signToken(user._id);
  await logActivity({
    actorId: user._id,
    action: 'user_signup',
    entityType: 'User',
    entityId: user._id,
    summary: `${user.name} signed up`,
  });
  res.status(201).json({
    status: 'success',
    data: {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid email or password', 401);
  }
  const token = signToken(user._id);
  await logActivity({
    actorId: user._id,
    action: 'user_login',
    entityType: 'User',
    entityId: user._id,
    summary: `${user.name} logged in`,
  });
  res.json({
    status: 'success',
    data: {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});
