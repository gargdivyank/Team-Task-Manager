import { Router } from 'express';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/requireRole.js';
import {
  projectCreateRules,
  projectUpdateRules,
  memberBodyRules,
  mongoIdParam,
  collectValidationErrors,
} from '../validators/validators.js';

const router = Router();

router.use(authenticate);

router.get('/', listProjects);
router.post(
  '/',
  requireRoles('admin'),
  projectCreateRules,
  collectValidationErrors,
  createProject
);

router.get('/:id', mongoIdParam('id'), collectValidationErrors, getProject);

router.put(
  '/:id',
  requireRoles('admin'),
  mongoIdParam('id'),
  projectUpdateRules,
  collectValidationErrors,
  updateProject
);

router.delete(
  '/:id',
  requireRoles('admin'),
  mongoIdParam('id'),
  collectValidationErrors,
  deleteProject
);

router.post(
  '/:id/members',
  requireRoles('admin'),
  mongoIdParam('id'),
  memberBodyRules,
  collectValidationErrors,
  addMember
);

router.delete(
  '/:id/members/:userId',
  requireRoles('admin'),
  mongoIdParam('id'),
  mongoIdParam('userId'),
  collectValidationErrors,
  removeMember
);

export default router;
