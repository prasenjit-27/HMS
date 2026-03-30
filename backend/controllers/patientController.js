import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';

export const updatePatientProfile = async (req, res) => {
  try {
    const { age, gender, bloodGroup, phone, address, medicalHistory, allergies } = req.body;
    const patient = await Patient.findOneAndUpdate(
      { userId: req.user._id },
      { age: parseInt(age), gender, bloodGroup, phone, address, medicalHistory: medicalHistory ? JSON.parse(medicalHistory) : [], allergies: allergies ? JSON.parse(allergies) : [] },
      { new: true, upsert: true }
    );
    res.json({ success: true, message: 'Profile updated', patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    res.json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendConsultationRequest = async (req, res) => {
  try {
    const { doctorId, problem, problemCategory } = req.body;
    if (!doctorId || !problem) return res.status(400).json({ success: false, message: 'Doctor and problem are required' });
    const doctor = await Doctor.findOne({ userId: doctorId, status: 'approved' });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found or not approved' });
    const existing = await Appointment.findOne({ patientId: req.user._id, doctorId, status: { $in: ['pending', 'accepted'] } });
    if (existing) return res.status(400).json({ success: false, message: 'You already have an active request with this doctor' });
    const appointment = await Appointment.create({ patientId: req.user._id, doctorId, problem, problemCategory });
    const doctorUser = await User.findById(doctorId);
    await User.findByIdAndUpdate(doctorId, {
      $push: { notifications: { message: `New consultation request from ${req.user.name}: ${problem}`, type: 'info' } }
    });
    res.status(201).json({ success: true, message: 'Request sent successfully', appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id })
      .populate('doctorId', 'name email isOnline')
      .sort({ createdAt: -1 });
    const enriched = await Promise.all(appointments.map(async (a) => {
      const doctorProfile = await Doctor.findOne({ userId: a.doctorId?._id });
      return { ...a.toJSON(), doctorProfile };
    }));
    res.json({ success: true, appointments: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rateDoctor = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (appointment.status !== 'closed') return res.status(400).json({ success: false, message: 'Can only rate closed consultations' });
    if (appointment.isRated) return res.status(400).json({ success: false, message: 'Already rated' });
    appointment.rating = rating;
    appointment.ratingComment = comment;
    appointment.isRated = true;
    await appointment.save();
    const doctor = await Doctor.findOne({ userId: appointment.doctorId });
    doctor.totalRatings = (doctor.totalRatings || 0) + rating;
    doctor.ratingCount = (doctor.ratingCount || 0) + 1;
    doctor.rating = doctor.totalRatings / doctor.ratingCount;
    await doctor.save();
    res.json({ success: true, message: 'Rating submitted', appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { 'notifications.$[].read': true } });
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
