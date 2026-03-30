import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import { sendNotificationEmail } from '../utils/email.js';

export const getAllDoctors = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.status = status;
    const doctors = await Doctor.find(filter).populate('userId', 'name email isVerified createdAt isOnline');
    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveDoctor = async (req, res) => {
  try {
    const { doctorId, action, reason } = req.body;
    const doctor = await Doctor.findById(doctorId).populate('userId', 'name email');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    doctor.status = action === 'approve' ? 'approved' : 'rejected';
    if (action === 'reject') doctor.rejectionReason = reason;
    await doctor.save();
    const message = action === 'approve'
      ? 'Congratulations! Your doctor profile has been approved. You can now receive consultation requests.'
      : `Your doctor profile was not approved. Reason: ${reason || 'Does not meet our criteria.'}`;
    await User.findByIdAndUpdate(doctor.userId._id, {
      $push: { notifications: { message, type: action === 'approve' ? 'success' : 'error' } }
    });
    try {
      await sendNotificationEmail(doctor.userId.email, `Profile ${action === 'approve' ? 'Approved' : 'Rejected'}`, message);
    } catch (e) {}
    res.json({ success: true, message: `Doctor ${action}d successfully`, doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password -otp').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const [totalDoctors, pendingDoctors, approvedDoctors, totalPatients, totalAppointments, activeAppointments] = await Promise.all([
      Doctor.countDocuments(),
      Doctor.countDocuments({ status: 'pending' }),
      Doctor.countDocuments({ status: 'approved' }),
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'accepted' })
    ]);
    res.json({ success: true, stats: { totalDoctors, pendingDoctors, approvedDoctors, totalPatients, totalAppointments, activeAppointments } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin' });
    await User.findByIdAndDelete(req.params.id);
    if (user.role === 'doctor') await Doctor.findOneAndDelete({ userId: req.params.id });
    if (user.role === 'patient') await Patient.findOneAndDelete({ userId: req.params.id });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
