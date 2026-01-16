const express = require('express');
const router = express.Router();
const {
    getAuditLogs,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    logAction,
} = require('../database/db');

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

// GET audit logs
router.get('/audit-logs', (req, res) => {
    const { action, user, limit = 100 } = req.query;
    const filters = {};

    if (action) filters.action = action;
    if (user) filters.user_email = user;

    const logs = getAuditLogs(parseInt(limit), filters);
    res.json(logs);
});

// GET all users
router.get('/users', (req, res) => {
    const users = getAllUsers();
    res.json(users);
});

// POST create user
router.post('/users', requireAdmin, (req, res) => {
    const { email, name, password, role, department } = req.body;

    if (!email || !name || !password) {
        return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    try {
        const id = createUser(email, name, password, role || 'clinician', department || '');
        logAction(req.user?.id, req.user?.email, 'User Created', `Created user: ${email}`, null, req.ip);
        res.status(201).json({ success: true, id });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PATCH update user
router.patch('/users/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { name, role, department } = req.body;

    try {
        updateUser(parseInt(id), { name, role, department });
        logAction(req.user?.id, req.user?.email, 'User Updated', `Updated user ID: ${id}`, null, req.ip);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE user
router.delete('/users/:id', requireAdmin, (req, res) => {
    const { id } = req.params;

    if (parseInt(id) === req.user?.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    try {
        deleteUser(parseInt(id));
        logAction(req.user?.id, req.user?.email, 'User Deleted', `Deleted user ID: ${id}`, null, req.ip);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// GET system stats
router.get('/stats', (req, res) => {
    const users = getAllUsers();
    const logs = getAuditLogs(1000);

    const stats = {
        totalUsers: users.length,
        adminCount: users.filter(u => u.role === 'admin').length,
        clinicianCount: users.filter(u => u.role === 'clinician').length,
        totalActions: logs.length,
        loginCount: logs.filter(l => l.action === 'Login').length,
        predictionCount: logs.filter(l => l.action === 'Predict').length,
    };

    res.json(stats);
});

module.exports = router;
