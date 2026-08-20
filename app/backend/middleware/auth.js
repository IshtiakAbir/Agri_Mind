/**
 * =============================================================================
 * Module: Authentication Middleware
 * Authorship: Full-Stack Web Team (agrimind-main)
 * Component: /app/backend/middleware/auth.js
 * Description: JWT token verification and user role extraction
 * =============================================================================
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'agrimind_super_secret_jwt_key_2026';

module.exports = function (req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ success: false, message: 'No authorization token provided. Access denied.' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user || decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token is invalid or has expired.' });
  }
};
