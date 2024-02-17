const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  
  prescriptionId:String,
  name: String,
  description: String,
  price:{
    type: Number,
    default:0
  },
  availablity:{
    type: Boolean,
    default:false
  }
  

  
});

module.exports = mongoose.model('Medicine', medicineSchema);