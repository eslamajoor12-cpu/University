const express = require('express');
const { ensureAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Student = require('../models/Student');
const Professor = require('../models/Professor');
const Course = require('../models/Course');
const router = express.Router();

router.use(ensureAdmin);

// Create Course
router.post('/courses', async (req, res) => {
  const { code, name, professorId } = req.body;
  const course = await Course.create({ code, name, professor: professorId || null });
  res.redirect('/dashboard');
});

// Assign professor to course
router.post('/courses/:id/assign-professor', async (req, res) => {
  await Course.findByIdAndUpdate(req.params.id, { professor: req.body.professorId || null });
  res.redirect('/dashboard');
});

// Enroll student to course
router.post('/courses/:id/enroll', async (req, res) => {
  const { studentId } = req.body;
  const course = await Course.findById(req.params.id);
  const student = await Student.findById(studentId);
  if (!course || !student) return res.status(400).send('لم يتم العثور على الكورس أو الطالب');
  if (!course.students.includes(student._id)) course.students.push(student._id);
  if (!student.courses.includes(course._id)) student.courses.push(course._id);
  await course.save();
  await student.save();
  res.redirect('/dashboard');
});

// Basic deletes
router.post('/courses/:id/delete', async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  await Student.updateMany({}, { $pull: { courses: req.params.id } });
  res.redirect('/dashboard');
});

router.post('/users/:id/delete', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.redirect('/dashboard');
  if (user.role === 'student') {
    const student = await Student.findOne({ user: user._id });
    if (student) {
      await Course.updateMany({}, { $pull: { students: student._id } });
      await Student.findByIdAndDelete(student._id);
    }
  } else if (user.role === 'professor') {
    const prof = await Professor.findOne({ user: user._id });
    if (prof) {
      await Course.updateMany({ professor: prof._id }, { $unset: { professor: "" } });
      await Professor.findByIdAndDelete(prof._id);
    }
  }
  await User.findByIdAndDelete(user._id);
  res.redirect('/dashboard');
});

module.exports = router;
