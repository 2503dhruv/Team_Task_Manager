const express = require('express');
const Task = require('../models/Task');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get tasks for a specific project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId }).populate('assignedTo', 'name');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a task (Admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task status (Members can update status)
router.put('/:id', auth, async (req, res) => {
  try {
    // For MVP, we'll allow any logged-in user to update the status of any task
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;