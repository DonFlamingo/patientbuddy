import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://ndlovulindani70_db_user:DonPatient_01Buddy@patientbuddy-cluster.d5b37wi.mongodb.net/?appName=PatientBuddy-Cluster')
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

async function createAdmin() {
    try {
        // Delete existing admin if exists
        await User.deleteOne({ email: 'admin@patientbuddy.com' });

        // Create admin user
        const admin = new User({
            email: 'admin@patientbuddy.com',
            username: 'admin',
            password: 'admin123',
            role: 'admin'
        });

        await admin.save();
        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        mongoose.connection.close();
    }
}

createAdmin();
