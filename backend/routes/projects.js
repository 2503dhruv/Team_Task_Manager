const express = require('express');
const Project = require('../models/Project');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all projects (Any logged-in user)
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find().populate('createdBy', 'name');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a project (Admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = new Project({ name, description, createdBy: req.user.userId });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;