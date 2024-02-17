const mongoose = require('mongoose');

const pharmacyAccept = new mongoose.Schema({
  pharmacyId: String,
  prescriptionId: String,
  status: String
});

module.exports = mongoose.model('pharmacyAccept', pharmacyAccept);