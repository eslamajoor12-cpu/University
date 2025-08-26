const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Professor = require('../models/Professor');
const router = express.Router();

router.get('/login', (req, res) => res.render('login', { error: null }));
router.get('/register', (req, res) => res.render('register', { error: null }));

router.post('/register',
  body('email').isEmail().withMessage('بريد إلكتروني غير صالح'),
  body('password').isLength({ min: 6 }).withMessage('كلمة السر 6 أحرف على الأقل'),
  body('role').isIn(['student','professor','admin']).withMessage('دور غير صالح'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('register', { error: errors.array()[0].msg });
    }
    try {
      const { email, password, role, name, studentId, department } = req.body;
      const user = await User.create({ email, password, role });

      if (role === 'student') {
        await Student.create({ user: user._id, name: name || email.split('@')[0], studentId: studentId || ('S' + user._id.toString().slice(-6)) });
      } else if (role === 'professor') {
        await Professor.create({ user: user._id, name: name || email.split('@')[0], department: department || 'General' });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true });
      res.redirect('/dashboard');
    } catch (e) {
      res.status(400).render('register', { error: e.message.includes('duplicate') ? 'البريد مستخدم من قبل' : e.message });
    }
  }
);

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).render('login', { error: 'بيانات الدخول غير صحيحة' });
  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(400).render('login', { error: 'بيانات الدخول غير صحيحة' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true });
  res.redirect('/dashboard');
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;
