
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({ 
  username:{
    type: String,
    unique: true,
  },
  email: String,
  password: String,
  role: {
    type: String,
    default: 'admin',
  },
});

module.exports = mongoose.model('Users', userSchema);
