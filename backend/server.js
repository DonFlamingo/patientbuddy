import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import OpenAI from 'openai';
import bodyParser from 'body-parser';
import auth from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import Conversation from './models/Conversation.js';

// Load environment variables from the .env file
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Initialize Express app and middleware
const app = express();
// The fix: Add the exposedHeaders option to the CORS configuration
app.use(cors({
    exposedHeaders: ['X-Thread-Id'],
}));
app.use(bodyParser.json());

// Auth routes
app.use('/api/auth', authRoutes);

// Conversation history routes
app.get('/api/conversations', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const conversations = await Conversation.find({ userId }).select('threadId messages createdAt').sort({ createdAt: -1 });
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

app.get('/api/conversations/:threadId', auth, async (req, res) => {
    try {
        const { threadId } = req.params;
        const userId = req.user._id;
        const conversation = await Conversation.findOne({ threadId, userId });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        res.json(conversation);
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
});

// Initialize the OpenAI client with the API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// This is the ID of the Assistant you created on platform.openai.com
const ASSISTANT_ID = process.env.ASSISTANT_ID;

// The /api/chat endpoint is where the core logic resides
app.post('/api/chat', auth, async (req, res) => {
    try {
        const { threadId, message } = req.body;
        const userId = req.user._id;
        let currentThreadId = threadId;
        let conversation;

        // If no threadId is provided, create a new one for a new conversation
        if (!currentThreadId) {
            const thread = await openai.beta.threads.create();
            currentThreadId = thread.id;
            // Create new conversation in DB
            conversation = new Conversation({
                userId,
                threadId: currentThreadId,
                messages: []
            });
        } else {
            // Find existing conversation
            conversation = await Conversation.findOne({ threadId: currentThreadId, userId });
            if (!conversation) {
                return res.status(404).json({ error: 'Conversation not found.' });
            }
        }

        // Add the user's message to the thread
        await openai.beta.threads.messages.create(
            currentThreadId,
            {
                role: "user",
                content: message,
            }
        );

        // Save user message to DB
        conversation.messages.push({
            role: 'user',
            content: message
        });

        // Run the Assistant and stream the response
        const stream = openai.beta.threads.runs.createAndStream(
            currentThreadId,
            {
                assistant_id: ASSISTANT_ID,
            }
        );

        // Set the response headers to indicate streaming and pass the threadId
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('X-Thread-Id', currentThreadId); // Pass threadId back to the frontend

        let assistantMessage = '';

        // Iterate through the stream of events and write each chunk to the response
        for await (const event of stream) {
            if (event.event === 'thread.message.delta') {
                if (event.data.delta.content && event.data.delta.content[0].text) {
                    const chunk = event.data.delta.content[0].text.value;
                    res.write(chunk);
                    assistantMessage += chunk;
                }
            }
        }

        // Save assistant message to DB
        conversation.messages.push({
            role: 'assistant',
            content: assistantMessage
        });

        await conversation.save();

        // End the response once the stream is complete
        res.end();

    } catch (error) {
        console.error('Error during chat processing:', error);
        res.status(500).send('Internal Server Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port http://142.93.195.191:${PORT}`);
});
