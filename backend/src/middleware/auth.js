import jwt from 'jsonwebtoken';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import { User } from '../models/User.js';

/**
 * Verifies Bearer JWT and attaches the user document to `req.user`.
 */
export const authenticate = catchAsync(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('Authorization token required', 401);
  }
  const token = header.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
  const user = await User.findById(payload.sub);
  if (!user) {
    throw new AppError('User no longer exists', 401);
  }
  req.user = user;
  next();
});

/** Ensures JWT secret is configured at bootstrap. */
export function assertJwtConfigured() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }
}
