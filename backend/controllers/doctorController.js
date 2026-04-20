const DoctorProfile = require('../models/DoctorProfile');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
exports.getProfile = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ userId: req.user._id })
      .populate('userId', 'name email profileImage');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const { specialization, experience, qualifications, bio, phone, consultationFee, availability } = req.body;
    const updateData = {};
    if (specialization) updateData.specialization = specialization;
    if (experience !== undefined) updateData.experience = experience;
    if (qualifications !== undefined) updateData.qualifications = qualifications;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (consultationFee !== undefined) updateData.consultationFee = consultationFee;
    if (availability) updateData.availability = availability;
    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email profileImage');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: profile,
    });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};
exports.getConsultations = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { doctorId: req.user._id };
    if (status) filter.status = status;
    const consultations = await Consultation.find(filter)
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: consultations });
  } catch (error) {
    console.error('Get doctor consultations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch consultations.' });
  }
};
exports.acceptConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findOne({
      _id: req.params.id,
      doctorId: req.user._id,
      status: 'pending',
    });
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found or already processed.' });
    }
    consultation.status = 'accepted';
    await consultation.save();
    res.status(200).json({
      success: true,
      message: 'Consultation accepted.',
      data: consultation,
    });
  } catch (error) {
    console.error('Accept consultation error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept consultation.' });
  }
};
exports.rejectConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findOne({
      _id: req.params.id,
      doctorId: req.user._id,
      status: 'pending',
    });
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found or already processed.' });
    }
    consultation.status = 'rejected';
    await consultation.save();
    res.status(200).json({
      success: true,
      message: 'Consultation rejected.',
      data: consultation,
    });
  } catch (error) {
    console.error('Reject consultation error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject consultation.' });
  }
};
exports.closeConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findOne({
      _id: req.params.id,
      doctorId: req.user._id,
      status: 'accepted',
    });
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Active consultation not found.' });
    }
    consultation.status = 'closed';
    consultation.closedAt = new Date();
    await consultation.save();
    const io = req.app.get('io');
    if (io) {
      io.to(`consultation_${consultation._id}`).emit('consultation_closed', {
        consultationId: consultation._id,
      });
    }
    res.status(200).json({
      success: true,
      message: 'Consultation closed.',
      data: consultation,
    });
  } catch (error) {
    console.error('Close consultation error:', error);
    res.status(500).json({ success: false, message: 'Failed to close consultation.' });
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
      message: 'Professional profile image updated.',
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error('Update doctor profile image error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile image.' });
  }
};
