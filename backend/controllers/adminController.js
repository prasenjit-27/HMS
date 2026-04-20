const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
exports.getPendingDoctors = async (req, res) => {
  try {
    const profiles = await DoctorProfile.find({ status: 'pending' })
      .populate('userId', 'name email profileImage createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: profiles });
  } catch (error) {
    console.error('Get pending doctors error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending doctors.' });
  }
};
exports.approveDoctor = async (req, res) => {
  try {
    const profile = await DoctorProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }
    profile.status = 'approved';
    await profile.save();
    await User.findByIdAndUpdate(profile.userId, { isApproved: true });
    res.status(200).json({
      success: true,
      message: 'Doctor approved successfully.',
      data: profile,
    });
  } catch (error) {
    console.error('Approve doctor error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve doctor.' });
  }
};
exports.rejectDoctor = async (req, res) => {
  try {
    const profile = await DoctorProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }
    profile.status = 'rejected';
    await profile.save();
    await User.findByIdAndUpdate(profile.userId, { isApproved: false });
    res.status(200).json({
      success: true,
      message: 'Doctor rejected.',
      data: profile,
    });
  } catch (error) {
    console.error('Reject doctor error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject doctor.' });
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role && ['patient', 'doctor', 'admin'].includes(role)) {
      filter.role = role;
    }
    const users = await User.find(filter)
      .select('-otp -otpExpiry')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin users.' });
    }
    // Actually delete permanently
    await User.findByIdAndDelete(req.params.id);
    
    // Delete related profiles
    if (user.role === 'patient') {
      const PatientProfile = require('./patientController').PatientProfile || require('../models/PatientProfile');
      await PatientProfile.findOneAndDelete({ userId: user._id });
    } else if (user.role === 'doctor') {
      const DoctorProfile = require('../models/DoctorProfile');
      await DoctorProfile.findOneAndDelete({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      message: 'User permanently deleted from the database.',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
};
exports.getStats = async (req, res) => {
  try {
    const [totalPatients, totalDoctors, pendingDoctors, approvedDoctors] = await Promise.all([
      User.countDocuments({ role: 'patient', isActive: true }),
      User.countDocuments({ role: 'doctor', isActive: true }),
      DoctorProfile.countDocuments({ status: 'pending' }),
      DoctorProfile.countDocuments({ status: 'approved' }),
    ]);
    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        pendingDoctors,
        approvedDoctors,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};
