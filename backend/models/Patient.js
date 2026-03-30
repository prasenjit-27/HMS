import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodGroup: { type: String },
  phone: { type: String },
  address: { type: String },
  medicalHistory: [{ type: String }],
  allergies: [{ type: String }]
}, { timestamps: true });

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
