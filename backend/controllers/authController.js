const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const generateOtp = require('../utils/generateOtp');
const { sendOtpEmail } = require('../utils/sendEmail');
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};
exports.register = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email || !role || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required.',
      });
    }
    if (!['patient', 'doctor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "patient" or "doctor".',
      });
    }
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user && user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login instead.',
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 
    if (user && !user.isVerified) {
      user.name = name;
      user.role = role;
      user.password = hashedPassword;
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        role,
        password: hashedPassword,
        otp,
        otpExpiry,
      });
    }
    await sendOtpEmail(email, otp, name);
    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify.',
      data: { email, role },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed.',
    });
  }
};
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.',
      });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP.',
      });
    }
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();
    if (user.role === 'patient') {
      const existingProfile = await PatientProfile.findOne({ userId: user._id });
      if (!existingProfile) {
        await PatientProfile.create({ userId: user._id });
      }
    } else if (user.role === 'doctor') {
      const existingProfile = await DoctorProfile.findOne({ userId: user._id });
      if (!existingProfile) {
        await DoctorProfile.create({
          userId: user._id,
          specialization: 'General',
          experience: 0,
        });
      }
    }
    const token = generateToken(user);
    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          isApproved: user.isApproved,
        },
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed.',
    });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email.',
      });
    }
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account not verified. Please register again.',
      });
    }
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Contact admin.',
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }
    const token = generateToken(user);
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          isApproved: user.isApproved,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed.',
    });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOtpEmail(email, otp, user.name);
    res.status(200).json({ success: true, message: 'Password reset OTP sent to email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request.' });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP or user.' });
    }
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpiry = null;
    await user.save();
    res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};
exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    let profile = null;
    if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ userId: user._id });
    } else if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ userId: user._id });
    }
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          isApproved: user.isApproved,
          isVerified: user.isVerified,
        },
        profile,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data.',
    });
  }
};
