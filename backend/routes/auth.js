const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
    findUserByEmail,
    findUserById,
    validatePassword,
    updatePassword,
    setResetToken,
    findByResetToken,
    clearResetToken,
    logAction,
    createSession,
    findSession,
    deleteSession,
    deleteUserSessions,
} = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'ctg-insight-secret-key-2025';
const TOKEN_EXPIRY = '24h';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const session = findSession(token);

        if (!session) {
            return res.status(401).json({ error: 'Session expired or invalid' });
        }

        req.user = decoded;
        req.token = token;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// POST login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = findUserByEmail(email);

    if (!user) {
        logAction(null, email, 'Login Failed', 'User not found', null, req.ip);
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (!validatePassword(user, password)) {
        logAction(user.id, email, 'Login Failed', 'Invalid password', null, req.ip);
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
    );

    // Store session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    createSession(user.id, token, expiresAt);

    // Log successful login
    logAction(user.id, user.email, 'Login', 'Successful authentication', null, req.ip);

    res.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
        },
        token,
    });
});

// POST logout
router.post('/logout', authenticateToken, (req, res) => {
    deleteSession(req.token);
    logAction(req.user.id, req.user.email, 'Logout', 'User logged out', null, req.ip);
    res.json({ success: true, message: 'Logged out successfully' });
});

// GET profile
router.get('/profile', authenticateToken, (req, res) => {
    const user = findUserById(req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
});

// POST forgot password - request reset
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const user = findUserByEmail(email);

    if (!user) {
        // Don't reveal if email exists or not
        return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    setResetToken(email, resetToken, expiresAt);

    // In production, send email here. For now, log to console
    console.log(`\n========================================`);
    console.log(`PASSWORD RESET REQUEST`);
    console.log(`Email: ${email}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(`Reset URL: http://localhost:5173/reset-password?token=${resetToken}`);
    console.log(`========================================\n`);

    logAction(user.id, email, 'Password Reset Request', 'Reset token generated', null, req.ip);

    res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
});

// POST reset password - with token
router.post('/reset-password', (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = findByResetToken(token);

    if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    updatePassword(user.id, newPassword);
    clearResetToken(user.id);
    deleteUserSessions(user.id); // Invalidate all existing sessions

    logAction(user.id, user.email, 'Password Reset', 'Password changed via reset token', null, req.ip);

    res.json({ success: true, message: 'Password has been reset successfully' });
});

// POST change password - authenticated user
router.post('/change-password', authenticateToken, (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = findUserByEmail(req.user.email);

    if (!validatePassword(user, currentPassword)) {
        return res.status(401).json({ error: 'Current password is incorrect' });
    }

    updatePassword(user.id, newPassword);
    logAction(user.id, user.email, 'Password Change', 'Password changed by user', null, req.ip);

    res.json({ success: true, message: 'Password changed successfully' });
});

// Export middleware for use in other routes
router.authenticateToken = authenticateToken;

module.exports = router;
