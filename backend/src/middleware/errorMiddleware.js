/**
 * Centralized Error Handling Middleware
 * Ensures uniform JSON error response and suppresses internal stack traces in non-dev environments.
 */
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  // Log error details to console
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, {
    status,
    message,
    code: err.code || null,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  res.status(status).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

/**
 * 404 Not Found fallback handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
}
