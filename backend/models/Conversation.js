import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    threadId: {
        type: String,
        required: true,
        unique: true
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
