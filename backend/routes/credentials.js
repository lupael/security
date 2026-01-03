const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../models');

// @route   POST api/credentials
// @desc    Create a new credential
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { name, type, username, secret } = req.body;
        const userId = req.user.id;

        const newCredential = await db.Credential.create({
            name,
            type,
            username,
            secret,
            user_id: userId,
        });

        res.status(201).json(newCredential);
    } catch (error) {
        console.error("Error creating credential:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET api/credentials
// @desc    Get all credentials for a user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const credentials = await db.Credential.findAll({ where: { user_id: userId } });
        res.json(credentials);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// @route   GET api/credentials/:id
// @desc    Get a specific credential
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const credentialId = req.params.id;
        const userId = req.user.id;

        const credential = await db.Credential.findOne({
            where: { id: credentialId, user_id: userId },
        });

        if (!credential) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        res.json(credential);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// @route   PUT api/credentials/:id
// @desc    Update a credential
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const credentialId = req.params.id;
        const userId = req.user.id;
        const { name, type, username, secret } = req.body;

        const credential = await db.Credential.findOne({
            where: { id: credentialId, user_id: userId },
        });

        if (!credential) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        credential.name = name;
        credential.type = type;
        credential.username = username;
        credential.secret = secret;

        await credential.save();

        res.json(credential);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// @route   DELETE api/credentials/:id
// @desc    Delete a credential
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const credentialId = req.params.id;
        const userId = req.user.id;

        const credential = await db.Credential.findOne({
            where: { id: credentialId, user_id: userId },
        });

        if (!credential) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        await credential.destroy();

        res.json({ message: 'Credential deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;
