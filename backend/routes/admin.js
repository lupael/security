const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const db = require('../models');

// @route   GET api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', [auth, admin], async (req, res) => {
    try {
        const users = await db.User.findAll({ attributes: { exclude: ['password_hash'] } });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// @route   DELETE api/admin/users/:id
// @desc    Delete a user
// @access  Admin
router.delete('/users/:id', [auth, admin], async (req, res) => {
    try {
        const userId = req.params.id;
        await db.User.destroy({ where: { id: userId } });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// @route   GET api/admin/scans
// @desc    Get all scans
// @access  Admin
router.get('/scans', [auth, admin], async (req, res) => {
    try {
        const scans = await db.Scan.findAll({ include: [db.User] });
        res.json(scans);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// @route   GET api/admin/logs
// @desc    Get all logs
// @access  Admin
router.get('/logs', [auth, admin], async (req, res) => {
    try {
        const logs = await db.Log.findAll({ include: [db.User] });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;
