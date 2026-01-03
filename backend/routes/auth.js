const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db.User.create({
            username,
            email,
            password_hash: hashedPassword,
        });

        res.status(201).json({ message: 'User created successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;
