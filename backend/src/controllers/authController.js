const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @route   POST /api/auth/register
 * @desc    Create an account. Password is hashed with bcrypt via the model hook.
 *          Self-registration is limited to 'user' and 'sales' roles —
 *          'admin' can only be granted by an existing admin (prevents privilege escalation).
 * @access  Public
 */
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  const safeRole = role === 'sales' ? 'sales' : 'user'; // admin cannot self-register

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) return res.status(409).json({ message: 'An account with this email already exists' });

  const user = await User.create({ name, email, password, role: safeRole });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
};

/**
 * @route   POST /api/auth/login
 * @desc    Verify credentials with bcrypt.compare and issue a JWT session token.
 * @access  Public
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  // password field has select:false — explicitly include it for comparison
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');

  // Generic message so attackers cannot enumerate valid emails
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (!user.isActive) {
    return res.status(403).json({ message: 'Account deactivated. Contact the administrator.' });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
};

/**
 * @route   GET /api/auth/me
 * @desc    Return the currently authenticated user (validates token on app load)
 * @access  Private
 */
const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { registerUser, loginUser, getMe };
