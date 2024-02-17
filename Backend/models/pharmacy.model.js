const mongoose = require('mongoose');


const pharmacySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    firstname: String,
    lastname: String,
    pharmacyName:String,
    address:String,
    Licence_no:String,
    phoneNumber:String,
    
    email: {
      type: String,

      unique: true,
    },
  });

  module.exports = mongoose.model('Pharmacy', pharmacySchema);
  
  