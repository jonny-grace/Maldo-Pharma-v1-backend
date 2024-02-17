const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const userModel = require("../models/user.model");
const doctorModel = require("../models/doctor.model");
const maldoReceptionModel = require("../models/maldoReception.model");
const pharmacyModel = require("../models/pharmacy.model");
const pharmaModel = require("../models/pharma.model");
const patientModel = require("../models/patient.model");

const { getIO } = require('../utils/io'); 

const io = getIO();
// Middleware to verify the JWT token
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), "secretkey");
    req.user = decoded;
    res.send(req.user);
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const secretKey = 'your_secret_key';
//User login route


//Registration for doctors
router.post('/register/doctor', authenticateAdmin, async (req, res) => {
  try {
    const { firstname, lastname, username, speciality, phoneNumber, email,gender,age } = req.body;

    // Validate input
    if (!firstname || !lastname || !username || !speciality || !phoneNumber || !email || !gender || !age) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create a new user account for the doctor
    const password = email; 
    const hashedPassword = await bcrypt.hash(password, 10);// Use email as the default password
    const role = 'doctor';
    const user = new userModel({
     
      username,
      email,
      role,
      password:hashedPassword,
    });

    // Save the user in the users table
    await user.save();

    // Create a new doctor
    const doctor = new doctorModel({
      userId: user._id,
      speciality,
      firstname:`Dr. ${firstname}`,
      lastname,
      phoneNumber,
      email,
      gender,
      age,

    });

    // Save the doctor in the doctors table
    await doctor.save();

    return res.status(200).json({ message: 'Doctor registered successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred' });
  }
});


//Registration for reception
router.post('/register/reception', authenticateAdmin, async (req, res) => {
  try {
    const { firstname, lastname, username, phoneNumber, email,age,gender } = req.body;

    // Validate input
    if (!firstname || !lastname || !username || !phoneNumber || !email || !age || !gender) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create a new user account for the doctor
    const password = email;
    const hashedPassword = await bcrypt.hash(password, 10); // Use email as the default password
    const role = 'reception';
    const user = new userModel({
     
      username,
      email,
      role,
      password:hashedPassword,
    });

    // Save the user in the users table
    await user.save();

    // Create a new doctor
    const reception = new maldoReceptionModel({
      userId: user._id,
      firstname,
      lastname,
      email,
      phoneNumber,
      age,
      gender,
      
    });

    // Save the doctor in the doctors table
    await reception.save();

    return res.status(200).json({ message: 'Reception registered successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred' });
  }
});



  

//Pharmacy Registration
router.post('/register/pharmacy', authenticateAdmin, async (req, res) => {
  try {
    const { firstname, lastname, pharmacyName, address, Licence_no, username, phoneNumber, password, email,location } = req.body;

    // Validate input
    if (!firstname || !lastname || !username  ||!pharmacyName  ||!address ||!password  ||!Licence_no  || !phoneNumber || !email || !location) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);// Use email as the default password

    // Create a new user account for the doctor
     // Use email as the default password
    const role = 'pharmacy';
    const user = new userModel({
     
      username,
      email,
      role,
      password:hashedPassword,
    });

    // Save the user in the users table
    await user.save();

    // Create a new doctor
    const pharmacy = new pharmacyModel({
      userId: user._id,
      firstname,
      lastname,
      email,
      pharmacyName,
      phoneNumber,
      address,
      Licence_no,
      location,
    });

    // Save the doctor in the doctors table
    await pharmacy.save();

    return res.status(200).json({ message: 'Pharmacy registered successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred' });
  }
});


router.post('/register/pharma', async (req, res) => {
  try {
    const { firstname, lastname, pharmacyName, city, licence_no, username, phoneNumber, email,location } = req.body;
    
    // Validate input
    if (!firstname || !lastname || !username  ||!pharmacyName  ||!city  ||!licence_no  || !phoneNumber || !location || !email) {
      return res.status(400).json({ message: 'All fields are required',"yours":req.body });
    }

    // Validate username is not already taken
    const existingUser = await userModel.findOne({username,role:'pharmacy'});
    if(existingUser) {
      return res.status(400).json({message: 'Username already taken'});
    }

    // Validate email is not already registered
    const existingEmail = await userModel.findOne({email}); 
    if(existingEmail) {
      return res.status(400).json({message: 'Email already registered'});
    }
    // Create a new user account for the doctor
    const password = email;
    const hashedPassword = await bcrypt.hash(password, 10); // Use email as the default password

     // Use email as the default password
    const role = 'pharmacy';
    const user = new userModel({
     
      username,
      email,
      role,
      password:hashedPassword,
    });

    // Save the user in the users table
    await user.save();

    // Create a new doctor
    const pharmacy = new pharmaModel({
      userId: user._id,
      firstname,
      lastname,
      email,
      pharmacyName,
      phoneNumber,
      city,
      licence_no,
      location
    });

    // Save the doctor in the doctors table
    await pharmacy.save();
    io.emit('registerPharmacy', pharmacy._id);
    // return res.status(200).json({ pharmacy:req.body});

    return res.status(200).json({ message: 'Pharmacy registered successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred' });
  }
});

//get all pharmacies 
router.get('/pharmacies', async (req, res) => {
  try {
    const pharmacies = await pharmaModel.find();
    return res.status(200).json(pharmacies);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred' });
  }
});
// get all receptions from reception table
router.get('/receptions', async (req, res) => {
  try {
    const receptions = await maldoReceptionModel.find();
    return res.status(200).json(receptions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred' });
  }
});
//here lets get all doctors from doctors table
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await doctorModel.find();
    return res.status(200).json(doctors);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred' });
  }
});

// lets change the reception status using its userId and the status from req.body 
router.put('/reception/status/:userId', async (req, res) => {
  // console.log(req.body);
  try {
    const { status } = req.body;
    const { userId } = req.params;
    const reception = await maldoReceptionModel.findOne({ userId });
    if (!reception) {
      return res.status(404).json({ message: 'Reception not found' });
    }
    reception.status = status;
    await reception.save();
    return res.status(200).json({ message: 'Reception status updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred' });
  }
});

// lets change the doctors status using its userId and the status from req.body
router.put('/doctor/status/:userId', async (req, res) => {
  // console.log(req.body);
  try {
    const { status } = req.body;
    const { userId } = req.params;
    const doctor = await doctorModel.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    doctor.status = status;
    await doctor.save();
    return res.status(200).json({ message: 'Doctor status updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred' });
  }
});

// lets change the pharmacy status using its userId and the status from req.body 
router.put('/pharmacy/status/:userId', async (req, res) => {
  // console.log(req.body);
  try {
    const { status } = req.body;
    const { userId } = req.params;
    const pharmacy = await pharmaModel.findOne({ userId });
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }
    pharmacy.status = status;
    await pharmacy.save();
    return res.status(200).json({ message: 'Pharmacy status updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred' });
  }
});

//lets create a route which gets number of all patients from patients table  number of all doctors from doctors table number of active amd inactive pharmacies from pharmas table
router.get('/statistics', async (req, res) => {
  try {
    const patients = await patientModel.countDocuments();
    const doctors = await doctorModel.countDocuments();
    const pharmacies = await pharmaModel.countDocuments();
    const activePharma = await pharmaModel.countDocuments({ status: 'active' });
    const inactivePharma = await pharmaModel.countDocuments({ status: 'inactive' });
    return res.status(200).json({
      patients,
      doctors,
      pharmacies,
      activePharma,
      inactivePharma
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred' });
  }
});
// Middleware for authenticating the admin
async function authenticateAdmin(req, res, next) {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, secretKey);

    // Check if the decoded email belongs to a user with the admin role
    const username = decoded.username;
    const role=decoded.role;
    const user = await userModel.findOne({ username });
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error(error);
    return res.status(403).json({ message: 'Forbidden' });
  }
}





router.post("/logout", verifyToken, (req, res) => {
  res.json({ message: "Logout successful" });
});
module.exports = router;
