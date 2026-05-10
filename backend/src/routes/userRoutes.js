import { Router } from 'express';
import {
  listUsers,
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/requireRole.js';
import {
  updateProfileRules,
  passwordChangeRules,
  collectValidationErrors,
} from '../validators/validators.js';

const router = Router();

router.use(authenticate);

router.get('/me', getProfile);
router.put('/me', updateProfileRules, collectValidationErrors, updateProfile);
router.patch(
  '/me/password',
  passwordChangeRules,
  collectValidationErrors,
  changePassword
);

router.get('/', requireRoles('admin'), listUsers);

export default router;
