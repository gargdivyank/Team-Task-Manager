import { AppError } from '../utils/AppError.js';

/**
 * Requires one of the given roles on `req.user` (must run after authenticate).
 */
export function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission for this action', 403));
    }
    next();
  };
}
