import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const existing = await User.findOne({ email: 'admin@mediconnect.com' });
    if (existing) {
      console.log('Admin already exists: admin@mediconnect.com');
      process.exit(0);
    }
    await User.create({
      name: 'System Admin',
      email: 'admin@mediconnect.com',
      password: 'Admin@123',
      role: 'admin',
      isVerified: true
    });
    console.log('Admin created successfully');
    console.log('Email: admin@mediconnect.com');
    console.log('Password: Admin@123');
    process.exit(0);
  } catch (error) {
    console.error('Seeder error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
