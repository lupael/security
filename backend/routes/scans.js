const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../models');

const { runScan } = require('../jobs/scanner');

// @route   POST api/scans
// @desc    Start a new scan
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { target } = req.body;
        const userId = req.user.id;

        const newScan = await db.Scan.create({
            target,
            user_id: userId,
            status: 'pending',
        });

        // Trigger the scan job asynchronously
        const io = req.app.get('io');
        runScan(newScan.id, io, userId);

        res.status(201).json(newScan);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// @route   GET api/scans
// @desc    Get all scans for a user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const scans = await db.Scan.findAll({ where: { user_id: userId }, order: [['createdAt', 'DESC']] });
        res.json(scans);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// @route   GET api/scans/:id
// @desc    Get a specific scan report
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const scanId = req.params.id;
        const userId = req.user.id;

        const scan = await db.Scan.findOne({
            where: { id: scanId, user_id: userId },
            include: [
                {
                    model: db.Finding,
                },
            ],
        });

        if (!scan) {
            return res.status(404).json({ message: 'Scan not found' });
        }

        res.json(scan);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;
