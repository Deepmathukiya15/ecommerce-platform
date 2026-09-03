const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Pull the JWT out of whichever transport delivered it, in priority order:
 *   1. `Authorization: Bearer <jwt>` (standard)
 *   2. `X-Auth-Token` custom header   (some tunnel/preview proxies strip Authorization)
 *   3. `shopkart_token` first-party cookie (proxies that strip headers, browsers that send cookies)
 *   4. `?token=` query param — LAST RESORT, dev/preview only. Preview tunnels can strip
 *      auth headers AND block cookies; the frontend only appends this after a 401 retry.
 */
const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.split(' ')[1];

  const custom = req.headers['x-auth-token'];
  if (typeof custom === 'string' && custom) return custom;

  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)shopkart_token=([^;]+)/);
    if (match) return match[1];
  }

  if (process.env.NODE_ENV !== 'production' && typeof req.query.token === 'string' && req.query.token) {
    return req.query.token;
  }

  return null;
};

/**
 * `protect` — requires a valid JWT (see extractToken for accepted transports).
 * Attaches the authenticated user document to req.user.
 */
const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token provided. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Not authorized — user no longer exists' });
    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated. Contact the administrator.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized — token invalid or expired. Please log in again.' });
  }
};

/**
 * `authorize(...roles)` — REAL backend role enforcement.
 * A restricted action returns 403 for users without the required role,
 * regardless of what the frontend shows or hides.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Forbidden — the '${req.user.role}' role does not have permission to perform this action`,
    });
  }
  next();
};

/**
 * `optionalProtect` — attaches req.user when a valid token is present,
 * but never rejects the request (used for public routes with role-aware extras).
 */
const optionalProtect = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) req.user = user;
  } catch (_) {
    /* invalid token on an optional-auth route is ignored */
  }
  next();
};

module.exports = { protect, authorize, optionalProtect };
