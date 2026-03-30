import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Chat from '../models/Chat.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createDoctorProfile = async (req, res) => {
  try {
    const existing = await Doctor.findOne({ userId: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'Profile already exists' });
    const { specialization, experience, qualifications, bio, consultationFee, availableDays, availableHours } = req.body;
    const profilePhoto = req.file ? `/uploads/profiles/${req.file.filename}` : '';
    const doctor = await Doctor.create({
      userId: req.user._id, specialization, experience: parseInt(experience),
      qualifications, bio, consultationFee: parseFloat(consultationFee) || 0,
      profilePhoto, availableDays: availableDays ? JSON.parse(availableDays) : [], availableHours
    });
    res.status(201).json({ success: true, message: 'Profile created. Awaiting admin approval.', doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDoctorProfile = async (req, res) => {
  try {
    const { specialization, experience, qualifications, bio, consultationFee, availableDays, availableHours } = req.body;
    const updateData = { specialization, experience: parseInt(experience), qualifications, bio, consultationFee: parseFloat(consultationFee) || 0, availableHours };
    if (availableDays) updateData.availableDays = JSON.parse(availableDays);
    if (req.file) updateData.profilePhoto = `/uploads/profiles/${req.file.filename}`;
    const doctor = await Doctor.findOneAndUpdate({ userId: req.user._id }, updateData, { new: true });
    res.json({ success: true, message: 'Profile updated', doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllApprovedDoctors = async (req, res) => {
  try {
    const { specialization, search, minRating, maxFee } = req.query;
    let doctorFilter = { status: 'approved' };
    if (specialization && specialization !== 'all') doctorFilter.specialization = specialization;
    if (maxFee) doctorFilter.consultationFee = { $lte: parseFloat(maxFee) };
    if (minRating) doctorFilter.rating = { $gte: parseFloat(minRating) };
    let doctors = await Doctor.find(doctorFilter).populate('userId', 'name email isOnline lastSeen');
    if (search) {
      const s = search.toLowerCase();
      doctors = doctors.filter(d => d.userId?.name?.toLowerCase().includes(s) || d.specialization?.toLowerCase().includes(s));
    }
    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email isOnline lastSeen');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDoctorRequests = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    const appointments = await Appointment.find({ doctorId: req.user._id }).populate('patientId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const respondToRequest = async (req, res) => {
  try {
    const { appointmentId, action, rejectionReason } = req.body;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appointment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (action === 'accept') {
      appointment.status = 'accepted';
      appointment.chatEnabled = true;
      await Chat.create({ appointmentId: appointment._id, participants: [appointment.patientId, appointment.doctorId], messages: [] });
      await User.findByIdAndUpdate(appointment.patientId, {
        $push: { notifications: { message: `Dr. ${req.user.name} accepted your consultation request.`, type: 'success' } }
      });
    } else if (action === 'reject') {
      appointment.status = 'rejected';
      appointment.rejectionReason = rejectionReason;
      await User.findByIdAndUpdate(appointment.patientId, {
        $push: { notifications: { message: `Your consultation request was declined. Reason: ${rejectionReason || 'Not specified'}`, type: 'warning' } }
      });
    }
    await appointment.save();
    res.json({ success: true, message: `Request ${action}ed`, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const closeConsultation = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    appointment.status = 'closed';
    appointment.chatEnabled = false;
    appointment.closedAt = new Date();
    await appointment.save();
    await Chat.findOneAndUpdate({ appointmentId }, { isActive: false, closedAt: new Date(), closedBy: req.user._id });
    await User.findByIdAndUpdate(appointment.patientId, {
      $push: { notifications: { message: 'Your consultation has been closed. Please rate your experience.', type: 'info' } }
    });
    res.json({ success: true, message: 'Consultation closed', appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
