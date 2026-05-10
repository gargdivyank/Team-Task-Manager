import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

/**
 * Centralized error middleware: Mongo duplicate key, validation, JWT, AppError.
 */
export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || 500;

  // Mongoose validation
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: messages,
    });
  }

  // Duplicate key (unique email etc.)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      status: 'error',
      message: `${field} already exists`,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  console.error(err);
  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
