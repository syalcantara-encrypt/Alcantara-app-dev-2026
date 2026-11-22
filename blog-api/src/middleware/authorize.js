/**
 * Authorization Middleware (Higher-Order Function)
 * Checks if the authenticated user's role matches any allowed role for the route.
 * @param {...string} allowedRoles - List of roles permitted to access (e.g., 'author', 'admin')
 */
module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    // Verify user is authenticated and possesses one of the allowed roles
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    
    // User is authorized, proceed to controller logic
    next();
  };
};