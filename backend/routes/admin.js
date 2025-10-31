import express from 'express';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import adminAuth from '../middleware/admin.js';

const router = express.Router();

// Get all users (admin only)
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('email username role createdAt').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Update user role (admin only)
router.put('/users/:userId', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin".' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, runValidators: true }
        ).select('email username role createdAt');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Get all conversations (admin only)
router.get('/conversations', adminAuth, async (req, res) => {
    try {
        const conversations = await Conversation.find()
            .populate('userId', 'email username')
            .select('threadId userId messages createdAt')
            .sort({ createdAt: -1 });
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

export default router;
