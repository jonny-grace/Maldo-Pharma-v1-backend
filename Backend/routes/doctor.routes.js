const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const userModel = require("../models/user.model");
const doctorModel = require("../models/doctor.model");
const pharmacyModel = require("../models/pharmacy.model");
const patientModel = require("../models/patient.model");
const apointmentModel = require("../models/apointment.model");
const { default: mongoose } = require("mongoose");
const prescriptionModel = require("../models/prescription.model");
const medicineModel = require("../models/medicine.model");
const pharmaModel = require("../models/pharma.model");
const { getIO } = require('../utils/io'); 
const io = getIO();
const secretKey = "your_secret_key";
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

// Get single Patient
router.get("/patient/:id", async (req, res) => {
  try {
    const modifiedId = new RegExp(req.params.id, "i");
    const patient = await patientModel.findOne({ patientId: modifiedId });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/patientforprescription/:id", async (req, res) => {
  try {
    // Retrieve the token from the request headers
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, secretKey);

    // Check if the decoded email belongs to a user with the admin role
    const userId = decoded.userId;

    // Find the user detail from the doctors table using the userId
    const doctorDetail = await doctorModel.findOne({ userId: userId });
    console.log(userId)

    // Find the patient using the provided patientId
    const patient = await patientModel.findOne({ patientId: req.params.id });

    res.json({ doctorDetail, patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all assigned apointments
router.get("/appointments", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, secretKey);
    const username = decoded.username;
    // Get the doctor
    const doctor = await userModel.findOne({ username });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const doctorId = doctor._id;

    // Find all appointments for this doctor
    const appointments = await apointmentModel.find({
      doctorId,
      healed: false,
    });
    const doctorDetail = await doctorModel.findOne({ userId: doctorId });

    // Prepare response array
    const appointmentsDetails = [];

    for (const appointment of appointments) {
      const { patientId } = appointment;

      // Find patient
      const patient = await patientModel.findOne({ patientId: patientId });

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Extract required fields
      const patientDetails = {
        firstname: patient.firstname,
        lastname: patient.lastname,
        age: patient.age,
        address: patient.address,
        patientId,
      };

      // Create appointment object
      const appointmentData = {
        doctor: {
          firstName: doctorDetail.firstname,
          lastName: doctorDetail.lastname,
          doctorId,
        },
        patient: patientDetails,
        apointmentId: appointment._id,
      };

      // Add to response array
      appointmentsDetails.push(appointmentData);
    }

    res.json(appointmentsDetails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Get single Patient
router.get("/appointment/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const apointment = await apointmentModel.findOne({ _id: id });
    const patientId = apointment.patientId;
    const doctorId = apointment.doctorId;
    const patient = await patientModel.findOne(
      { patientId },
      { firstname: 1, lastname: 1, age: 1, patientId: 1 }
    );
    const doctor = await doctorModel.findOne(
      { userId: doctorId },
      { firstname: 1, lastname: 1, speciality: 1 }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    if (!doctor) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const apointmentData = {
      patient,
      doctor,
    };
    res.json(apointmentData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/create/prescription", async (req, res) => {
  try {
    const {
      patientId,
      pfirstname,
      plastname,
      dfirstname,
      dlastname,
      patientAge,
      medicines,
      apointmentId,
    } = req.body;

    // Concatenate patient full name
    const patientFullName = pfirstname + " " + plastname;

    // Concatenate doctor full name
    const doctorFullName = dfirstname + " " + dlastname;

    // Get the current time 
    const currentTime = new Date();

    // Calculate the end time (current time + 10 minutes)
    const endTime = new Date(currentTime.getTime() + 5 * 60000); 
    // Create a new Prescription instance

     // Create a new Prescription instance
     const prescription = new prescriptionModel({
      apointmentId,
      patientId,
      patientFullName,
      doctorFullName,
      patientAge,
      status: "assigned",
      currentTime,
      endTime, 
      timerStatus: "active",
    });


    // Save the prescription to the database
    await prescription.save();

     // Calculate the remaining time in milliseconds
     const remainingTime = endTime.getTime() - currentTime.getTime();
console.log(remainingTime);
     // Set the timeout for the prescription
     const timer = setTimeout(async () => {
       // Update the prescription's timerStatus to "deactivate"
       await prescriptionModel.findByIdAndUpdate(prescription._id, {
         timerStatus: "deactivate",
       }); 
        console.log('end time')
 
       // Emit a socket event indicating that the time is up
       // Make sure you have access to the socket object here
       io.emit("timerFinished", { prescriptionId: prescription._id });
     }, remainingTime);
  
     // Save the timeout reference in the prescription object for future use (e.g., to clear the timeout)
     prescription.timer = timer;
    // Save the timeout reference in the prescription object for future use (e.g., to clear the timeout)
    prescription.timer = timer;


    // Create an array to store the medicine IDs
    const medicineIds = [];

    // Loop through the medicines array and save each medicine to the Medicine table
    for (const medicine of medicines) {
      const { name, description } = medicine;

      // Create a new Medicine instance
      const medicineObj = new medicineModel({
        prescriptionId: prescription._id, // Set the prescription ID
        name,
        description,
      });

      // Save the medicine to the database
      await medicineObj.save();
    }

    await patientModel.updateOne(
      { patientId: patientId },
      { healed: true, apointment_active: true }
    );

    res.json({ message: "Prescription created successfully",prescription:prescription });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



async function authenticateDoctor(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, secretKey);

    // Check if the decoded email belongs to a user with the admin role
    const username = decoded.username;
    const user = await userModel.findOne({ username });
    if (!user || user.role !== "doctor") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error(error);
    return res.status(403).json({ message: "Forbidden" });
  }
}

router.post("/logout", verifyToken, (req, res) => {
  res.json({ message: "Logout successful" });
});
module.exports = router;
