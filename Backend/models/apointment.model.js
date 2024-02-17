const mongoose = require('mongoose');

const apointmentSchema = new mongoose.Schema({
  patientId: {
    type: String,
    ref: 'Patient',
  },
  doctorId: {
    type: String,
    ref: 'Doctor',
  },
  apointment_active: {
    type: Boolean,
    default: true,
  },
  healed: {
    type: Boolean,
    default: false,
  },
  
  apointmentDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Apointment', apointmentSchema);