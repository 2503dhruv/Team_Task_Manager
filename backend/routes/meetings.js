const express = require('express');
const Meeting = require('../models/Meeting');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const meetings = await Meeting.find().populate('createdBy', 'name').populate('participants', 'name');
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const newMeeting = new Meeting({ ...req.body, createdBy: req.user._id });
    await newMeeting.save();
    res.status(201).json(newMeeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const updatedMeeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedMeeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meeting removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;