/**
 * Wraps async route handlers to forward errors to the global error middleware.
 */
export function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
