import { body, param, query } from 'express-validator';
import { validationResult } from 'express-validator';
import { TASK_PRIORITIES, TASK_STATUSES } from '../models/Task.js';
import { PROJECT_STATUSES } from '../models/Project.js';

export function collectValidationErrors(req, res, next) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errs.array().map((e) => ({
        path: e.path,
        msg: e.msg,
      })),
    });
  }
  next();
}

/** Strong password: 8+, upper, lower, digit, special */
export const signupRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
    .withMessage(
      'Password must include uppercase, lowercase, number, and special character'
    ),
];

export const loginRules = [
  body('email').trim().notEmpty().isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

export const updateProfileRules = [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
];

export const passwordChangeRules = [
  body('currentPassword').notEmpty(),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
    .withMessage(
      'New password must be at least 8 characters with upper, lower, number, special'
    ),
];

export const projectCreateRules = [
  body('title').trim().notEmpty(),
  body('description').optional().isString(),
  body('status').optional().isIn(PROJECT_STATUSES),
  body('startDate').isISO8601().toDate(),
  body('endDate').isISO8601().toDate(),
];

export const projectUpdateRules = [
  body('title').optional().trim().notEmpty(),
  body('description').optional().isString(),
  body('status').optional().isIn(PROJECT_STATUSES),
  body('startDate').optional().isISO8601().toDate(),
  body('endDate').optional().isISO8601().toDate(),
];

export const memberBodyRules = [body('userId').notEmpty().isMongoId()];

export const taskCreateRules = [
  body('title').trim().notEmpty(),
  body('description').optional().isString(),
  body('projectId').isMongoId(),
  body('assignedTo').isMongoId(),
  body('priority').optional().isIn(TASK_PRIORITIES),
  body('status').optional().isIn(TASK_STATUSES),
  body('dueDate').isISO8601().toDate(),
];

export const taskUpdateRules = [
  body('title').optional().trim().notEmpty(),
  body('description').optional().isString(),
  body('assignedTo').optional().isMongoId(),
  body('priority').optional().isIn(TASK_PRIORITIES),
  body('status').optional().isIn(TASK_STATUSES),
  body('dueDate').optional().isISO8601().toDate(),
];

export const taskStatusPatchRules = [body('status').isIn(TASK_STATUSES)];

export const commentRules = [
  body('message').trim().notEmpty().isLength({ max: 5000 }).withMessage('Message is required'),
];

export const taskListQueryRules = [
  query('status').optional().isIn(TASK_STATUSES),
  query('priority').optional().isIn(TASK_PRIORITIES),
  query('assignedTo').optional().isMongoId(),
  query('projectId').optional().isMongoId(),
  query('dueBefore').optional().isISO8601(),
  query('dueAfter').optional().isISO8601(),
  query('overdue').optional().isIn(['true', 'false', '1', '0']),
];

export const mongoIdParam = (name = 'id') => [param(name).isMongoId()];
