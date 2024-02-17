const pharmaModel = require("../models/pharma.model");

async function getNearbyPharmacies(maldoLocation=[9.0115842, 38.7670148]) {
    try {
      const pharmacies = await pharmaModel.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: maldoLocation
            },
            $maxDistance: 3000 // In meters
          }
        }
       }).maxTimeMS(20000);
  
      if(pharmacies){
        return pharmacies;
      } else {
        return pharmacies;  
      }
      
    }   catch (error) {
        console.error("MongoDB error:", error.message); // Log the detailed error message
        throw new Error('Failed to retrieve nearby pharmacies');
      }
  }
  
  module.exports = {
    getNearbyPharmacies
  };