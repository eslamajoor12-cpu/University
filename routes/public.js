const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Professor = require('../models/Professor');
const Course = require('../models/Course');

router.get('/', async (req, res) => {
  const [students, professors, courses] = await Promise.all([
    Student.find().populate('courses'),
    Professor.find(),
    Course.find().populate('professor')
  ]);
  res.render('index', { user: req.user, students, professors, courses, error: null });
});

module.exports = router;
