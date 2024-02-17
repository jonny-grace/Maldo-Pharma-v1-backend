const mongoose = require('mongoose');


const doctorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
      },
      status:{
        type:String,
        default:'inactive'
      },
    firstname: String,
    lastname: String,
    speciality: String,
    phoneNumber:String,
    username:String,
    gender:String,
    age:Number,
    email: {
      type: String,
    
    },
  });
  module.exports = mongoose.model('Doctor', doctorSchema);
  
  