const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
  },
  firstname: String,
  lastname: String,
  patientId: {
    type: String,
    unique: true, // Make the email field optional
  },
  phoneNumber: String,
  gender: String,
  weight:String,
  region:String,
  town:String,
  subCity:String,
  woreda:String,
  houseNumber:String,
  allergies:String,
  email: {
    type: String,
    required: false, // Make the email field optional
  },
  
  age:String,
  
  dateOfRegistration: {
    type: Date,
    default: Date.now, // Add a default value of the current date and time
  },
  apointment_active: {
    type: Boolean,
    default: false,
  },
  healed: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Patient', patientSchema);