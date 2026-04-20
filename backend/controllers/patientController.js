const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
exports.getProfile = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ userId: req.user._id })
      .populate('userId', 'name email');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const { age, gender, phone, bloodGroup, medicalHistory } = req.body;
    const updateData = {};
    if (age !== undefined) updateData.age = age;
    if (gender !== undefined) updateData.gender = gender;
    if (phone !== undefined) updateData.phone = phone;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    if (medicalHistory !== undefined) updateData.medicalHistory = medicalHistory;
    const profile = await PatientProfile.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: profile,
    });
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};
exports.updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded.' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: req.file.path },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully.',
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error('Update profile image error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile image.' });
  }
};
exports.getDoctors = async (req, res) => {
  try {
    const { specialization, search } = req.query;
    const filter = { status: 'approved' };
    if (specialization) {
      filter.specialization = { $regex: specialization, $options: 'i' };
    }
    let profiles = await DoctorProfile.find(filter)
      .populate('userId', 'name email')
      .sort({ experience: -1 });
    if (search) {
      const searchLower = search.toLowerCase();
      profiles = profiles.filter(p =>
        p.userId && p.userId.name.toLowerCase().includes(searchLower)
      );
    }
    res.status(200).json({ success: true, data: profiles });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctors.' });
  }
};
exports.getDoctorById = async (req, res) => {
  try {
    const profile = await DoctorProfile.findById(req.params.id)
      .populate('userId', 'name email');
    if (!profile || profile.status !== 'approved') {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('Get doctor by id error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctor.' });
  }
};
exports.requestConsultation = async (req, res) => {
  try {
    const { doctorId, symptoms, description } = req.body;
    if (!doctorId || !symptoms) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and symptoms are required.',
      });
    }
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isApproved: true });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found or not approved.' });
    }
    const existingConsultation = await Consultation.findOne({
      patientId: req.user._id,
      doctorId,
      status: { $in: ['pending', 'accepted'] },
    });
    if (existingConsultation) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active consultation with this doctor.',
      });
    }
    const consultation = await Consultation.create({
      patientId: req.user._id,
      doctorId,
      symptoms,
      description: description || '',
    });
    res.status(201).json({
      success: true,
      message: 'Consultation request sent.',
      data: consultation,
    });
  } catch (error) {
    console.error('Request consultation error:', error);
    res.status(500).json({ success: false, message: 'Failed to request consultation.' });
  }
};
exports.getConsultations = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { patientId: req.user._id };
    if (status) filter.status = status;
    const consultations = await Consultation.find(filter)
      .populate('doctorId', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: consultations });
  } catch (error) {
    console.error('Get patient consultations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch consultations.' });
  }
};
