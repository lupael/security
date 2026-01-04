const express = require('express');
const router = express.Router();
const db = require('../models');
const { runWebScan } = require('../jobs/webScanner');
const { runNetworkScan } = require('../jobs/networkScanner');
const { isAuthenticated } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

/**
 * POST /api/scans
 * Starts a new scan. It determines whether to run a web or network scan
 * based on the 'scanType' property in the request body.
 */
router.post('/', isAuthenticated, async (req, res) => {
    const { target, scanType, snmpCommunity, credentialId } = req.body;
    const userId = req.user.id;

    if (!target || !scanType) {
        return res.status(400).json({ error: 'Target and scanType are required.' });
    }

    try {
        // Create a new scan record in the database
        const scan = await db.Scan.create({
            user_id: userId,
            target: target,
            scan_type: scanType,
            status: 'queued',
            snmp_community: scanType === 'network' ? snmpCommunity : null,
            credential_id: scanType === 'network' ? credentialId : null,
        });

        const io = req.app.get('socketio');

        // Asynchronously trigger the correct scanner job
        if (scanType === 'web') {
            runWebScan(scan.id, io, userId);
        } else if (scanType === 'network') {
            runNetworkScan(scan.id, io, userId);
        } else {
            // Should not happen if validation is correct, but good to have
            await scan.update({ status: 'failed' });
            return res.status(400).json({ error: 'Invalid scanType specified.' });
        }

        res.status(201).json(scan);
    } catch (error) {
        console.error('Failed to start scan:', error);
        res.status(500).json({ error: 'Internal server error while starting scan.' });
    }
});

/**
 * GET /api/scans
 * Retrieves all historical scans for the authenticated user.
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const scans = await db.Scan.findAll({
            where: { user_id: req.user.id },
            order: [['createdAt', 'DESC']],
            // Optionally include findings if needed for a summary view
            // include: [{ model: db.Finding, as: 'findings' }] 
        });
        res.json(scans);
    } catch (error) {
        console.error('Failed to retrieve scans:', error);
        res.status(500).json({ error: 'Internal server error while fetching scans.' });
    }
});

/**
 * GET /api/scans/:id/export/:format
 * Exports the scan report as PDF or CSV.
 */
router.get('/:id/export/:format', isAuthenticated, reportController.exportReport);

module.exports = router;