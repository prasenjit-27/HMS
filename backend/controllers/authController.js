import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import { generateToken } from '../utils/jwt.js';
import { sendOTPEmail, generateOTP } from '../utils/email.js';

export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (!['doctor', 'patient'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const user = await User.create({ name, email, password, role, otp, otpExpiry });
    if (role === 'patient') {
      await Patient.create({ userId: user._id });
    }
    await sendOTPEmail(email, otp, name);
    res.status(201).json({ success: true, message: 'Account created. Check your email for OTP verification.', userId: user._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Already verified' });
    if (!user.otp || user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.otpExpiry < new Date()) return res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' });
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    const token = generateToken(user._id, user.role);
    res.json({ success: true, message: 'Email verified successfully', token, user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Already verified' });
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOTPEmail(user.email, otp, user.name);
    res.json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email first', userId: user._id, needsVerification: true });
    }
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();
    const token = generateToken(user._id, user.role);
    let profileData = null;
    if (user.role === 'doctor') {
      profileData = await Doctor.findOne({ userId: user._id });
    } else if (user.role === 'patient') {
      profileData = await Patient.findOne({ userId: user._id });
    }
    res.json({ success: true, message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified }, profileData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeen: new Date() });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = req.user;
    let profileData = null;
    if (user.role === 'doctor') profileData = await Doctor.findOne({ userId: user._id });
    else if (user.role === 'patient') profileData = await Patient.findOne({ userId: user._id });
    const unreadCount = user.notifications.filter(n => !n.read).length;
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified, isOnline: user.isOnline, notifications: user.notifications.slice(-10).reverse(), unreadNotifications: unreadCount }, profileData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
