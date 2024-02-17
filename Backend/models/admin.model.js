const { string } = require('joi');
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
      },
      status:{
        type:String,
        default:'active'
      },
    firstname: String,
    lastname:String,
  email: String, 
  phoneNumber:String,
  username:String,
  password: String,
  age:Number,
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
  module.exports = mongoose.model('Admin', adminSchema);
  