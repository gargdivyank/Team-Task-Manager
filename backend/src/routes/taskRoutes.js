import { Router } from 'express';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  patchTaskStatus,
  deleteTask,
  addComment,
  listComments,
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/requireRole.js';
import {
  taskCreateRules,
  taskUpdateRules,
  taskStatusPatchRules,
  commentRules,
  taskListQueryRules,
  mongoIdParam,
  collectValidationErrors,
} from '../validators/validators.js';

const router = Router();

router.use(authenticate);

router.get('/', taskListQueryRules, collectValidationErrors, listTasks);

router.post(
  '/',
  requireRoles('admin'),
  taskCreateRules,
  collectValidationErrors,
  createTask
);

router.get(
  '/:id/comments',
  mongoIdParam('id'),
  collectValidationErrors,
  listComments
);

router.post(
  '/:id/comments',
  mongoIdParam('id'),
  commentRules,
  collectValidationErrors,
  addComment
);

router.put(
  '/:id',
  requireRoles('admin'),
  mongoIdParam('id'),
  taskUpdateRules,
  collectValidationErrors,
  updateTask
);

router.patch(
  '/:id/status',
  mongoIdParam('id'),
  taskStatusPatchRules,
  collectValidationErrors,
  patchTaskStatus
);

router.delete(
  '/:id',
  requireRoles('admin'),
  mongoIdParam('id'),
  collectValidationErrors,
  deleteTask
);

router.get('/:id', mongoIdParam('id'), collectValidationErrors, getTask);

export default router;
