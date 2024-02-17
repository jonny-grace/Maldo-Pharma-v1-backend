const mongoose = require('mongoose');

const pharmaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status:{
    type:String,
    default:'inactive'
  },
  firstname: String,
  lastname: String,
  pharmacyName: {
    type:String,
    default:'__'
  },
  city: String,
  licence_no: String,
  phoneNumber: String,
  password: String,
  email: {
    type: String,
    unique: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },  
    coordinates: {
      type: [Number],
      required: true,
    },
  },
});
// Create a 2dsphere index on the location field
pharmaSchema.index({ location: '2dsphere' });


module.exports = mongoose.model('Pharma', pharmaSchema);