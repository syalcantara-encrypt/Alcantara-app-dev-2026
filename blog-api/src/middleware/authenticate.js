const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Verifies the JWT Bearer token sent in the Authorization header.
 * Attaches user payload to req.user if valid.
 */
module.exports = (req, res, next) => {
  // Extract Authorization header or default to empty string
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  // Ensure scheme is Bearer and token exists
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  let payload;
  try {
    // Verify access token using shared JWT_SECRET from environment
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Guard: Reject refresh tokens if used as access tokens on API routes
  if (payload.type === 'refresh') {
    return res.status(401).json({ error: 'Refresh tokens are not allowed here' });
  }

  // Attach decoded payload info (id, username, role) to request object
  req.user = { id: payload.id, username: payload.username, role: payload.role };

  // Pass control to the next middleware or controller
  next();
};