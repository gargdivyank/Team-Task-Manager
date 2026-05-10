import { Router } from 'express';
import { signup, login } from '../controllers/authController.js';
import {
  signupRules,
  loginRules,
  collectValidationErrors,
} from '../validators/validators.js';

const router = Router();

router.post('/signup', signupRules, collectValidationErrors, signup);
router.post('/login', loginRules, collectValidationErrors, login);
router.post('/logout', (_req, res) => {
  res.status(204).send();
});

export default router;
