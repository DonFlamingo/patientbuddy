import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/patientbuddy';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@patientbuddy.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPass123!';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      let changed = false;
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        changed = true;
      }
      // Always reset password to the provided ADMIN_PASSWORD for testing convenience
      existing.password = ADMIN_PASSWORD;
      if (!existing.username) {
        existing.username = ADMIN_USERNAME;
      }
      await existing.save();
      console.log(`Updated existing user ${ADMIN_EMAIL} to role=admin and reset password (from ADMIN_PASSWORD env)`);
      process.exit(0);
    }

    const user = new User({
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      role: 'admin'
    });

    await user.save();
    console.log(`Created admin user: ${ADMIN_EMAIL} with password from ADMIN_PASSWORD env var`);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
}

run();
