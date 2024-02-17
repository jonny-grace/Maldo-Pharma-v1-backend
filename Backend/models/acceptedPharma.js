const mongoose = require('mongoose');
const medicineModel = require('./medicine.model');

const pharmacyAcceptSchema = new mongoose.Schema({
  pharmacyId: String,
  prescriptionId: String,
  medicines: [medicineModel.schema] // Assuming medicineModel is a valid Mongoose model
});

module.exports = mongoose.model('acceptedPharma', pharmacyAcceptSchema);