import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = express.Router();

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Test email route (remove in production)
router.post('/test-email', async (req, res) => {
    try {
        const testMailOptions = {
            from: process.env.EMAIL_FROM,
            to: req.body.email,
            subject: 'PatientBuddy Email Test',
            html: `
                <h1>Email Configuration Test</h1>
                <p>This is a test email from PatientBuddy.</p>
                <p>If you received this, your email configuration is working correctly!</p>
            `
        };

        await transporter.sendMail(testMailOptions);
        res.json({ message: 'Test email sent successfully' });
    } catch (error) {
        console.error('Email test error:', error);
        res.status(500).json({ 
            error: 'Failed to send test email',
            details: error.message 
        });
    }
});

// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists.' });
        }

        // Auto-generate unique username from email prefix
        let username = email.split('@')[0];
        let counter = 1;
        while (await User.findOne({ username })) {
            username = `${email.split('@')[0]}${counter}`;
            counter++;
        }

    // Create new user (always default to 'user' role).
    // Admin users must be created via the seed script or manually in the database.
    const role = 'user';
    const user = new User({ email, username, password, role });
        await user.save();

        // Generate JWT token
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: user._id, email: user.email, username: user.username, role: user.role } });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
    }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        // Always return the same response whether user exists or not
        // This prevents email enumeration attacks
        if (!user) {
            return res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
        await user.save();

        // Create reset URL
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <p>You requested a password reset</p>
                <p>Click this <a href="${resetUrl}">link</a> to reset your password</p>
                <p>This link will expire in 1 hour</p>
                <p>If you did not request this, please ignore this email</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Reset password route
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { password } = req.body;
        const { token } = req.params;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
        }

        // Update password and clear reset token
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
// Token verification endpoint
router.get('/verify', auth, (req, res) => {
    res.json({ valid: true, user: { id: req.user._id, email: req.user.email, role: req.user.role } });
});

export default router;
