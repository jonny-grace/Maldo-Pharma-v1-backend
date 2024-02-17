const mongoose = require('mongoose');

const statisticsSchema = new mongoose.Schema({
totalBlogs:String,
totalServices:String,
});


module.exports = mongoose.model('statistics', statisticsSchema);

