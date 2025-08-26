const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Attach user (if token exists)
exports.attachUser = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    req.user = user;
  } catch (e) {
    // ignore
  }
  next();
};

exports.ensureAuth = (req, res, next) => {
  if (!req.user) return res.redirect('/auth/login');
  next();
};

exports.ensureRole = (role) => (req, res, next) => {
  if (!req.user) return res.redirect('/auth/login');
  if (req.user.role !== role) return res.status(403).send('غير مصرح');
  next();
};

exports.ensureAdmin = (req, res, next) => {
  if (!req.user) return res.redirect('/auth/login');
  if (req.user.role !== 'admin') return res.status(403).send('غير مصرح (أدمن فقط)');
  next();
};
