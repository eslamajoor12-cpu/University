const express = require('express');
const { ensureAuth } = require('../middleware/auth');
const User = require('../models/User');
const Student = require('../models/Student');
const Professor = require('../models/Professor');
const Course = require('../models/Course');
const router = express.Router();

router.get('/', ensureAuth, async (req, res) => {
  const role = req.user.role;
  if (role === 'admin') {
    const [users, students, professors, courses] = await Promise.all([
      User.find(),
      Student.find().populate('courses'),
      Professor.find(),
      Course.find().populate('professor students')
    ]);
    return res.render('dashboards/admin', { user: req.user, users, students, professors, courses });
  }
  if (role === 'student') {
    const student = await Student.findOne({ user: req.user._id }).populate({ path: 'courses', populate: { path: 'professor' } });
    return res.render('dashboards/student', { user: req.user, student });
  }
  if (role === 'professor') {
    const prof = await Professor.findOne({ user: req.user._id });
    const courses = await Course.find({ professor: prof?._id }).populate('students');
    return res.render('dashboards/professor', { user: req.user, professor: prof, courses });
  }
  res.send('دور غير معروف');
});

module.exports = router;
