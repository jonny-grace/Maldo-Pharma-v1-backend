const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const userModel = require("../models/user.model");
const doctorModel = require("../models/doctor.model");
const pharmacyModel = require("../models/pharmacy.model");
const patientModel = require("../models/patient.model");
const apointmentModel = require("../models/apointment.model");
const prescriptionModel = require("../models/prescription.model");
const medicineModel = require("../models/medicine.model");

const acceptedPharma = require("../models/acceptedPharma");
const pharmaModel = require("../models/pharma.model");
const pharmacyAccept = require("../models/pharmacyAccept");


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

//Registration for Patients
router.post("/register/patient", authenticateReception, async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      username,
      age,
      phoneNumber,
      email,
      gender,
      subCity,
      weight,
      region,
      town,
      woreda,
      houseNumber,
      allergies
    } = req.body;

    // Check if the username already exists
    const existingUsername = await userModel.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    // Check if the email already exists
    const existingEmail = await userModel.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email is already taken" });
    }

    // Find the highest patientId in the collection
    const highestPatient = await patientModel
      .findOne({}, { patientId: 1 })
      .sort({ patientId: -1 });
    let nextPatientId = 1;
    if (highestPatient) {
      const highestPatientId = highestPatient.patientId;
      const currentNumber = parseInt(highestPatientId.split("-")[1]);
      if (!isNaN(currentNumber)) {
        nextPatientId = currentNumber + 1;
      }
    }

    // Generate the new patientId with the desired format
    const formattedPatientId = `PID-${nextPatientId.toString().padStart(4, "0")}`;

    // Create a new user account for the patient
    const password = formattedPatientId; // Use email as the default password
    const hashedPassword = await bcrypt.hash(password, 10);// Use email as the default password

    const role = "patient";
    const user = new userModel({
      username,
      email,
      role,
      password:hashedPassword
    });

    // Save the user in the users table
    await user.save();

    // Create a new patient
    const patient = new patientModel({
      userId: user._id,
      firstname,
      lastname,
      patientId: formattedPatientId,
      phoneNumber,
      age,
      email,
      gender,
      subCity,
      weight,
      region,
      town,
      woreda,
      houseNumber,
      allergies
    });

    // Save the patient in the patients table
    await patient.save();

    return res.status(200).json({ message: "Patient registered successfully", patient });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});
// Get all Patients
router.get("/patients", async (req, res) => {
  try {
    const patients = await patientModel.find();

    const patientsWithAppointment = await Promise.all(
      patients.map(async (patient) => {
        const appointment = await apointmentModel.findOne({
          patientId: patient.patientId,
          apointment_active: true,
        });
        // return (appointment);

        if (appointment) {
          return {
            ...patient.toObject(),
            hasAppointment: appointment.apointment_active,
          };
        } else {
          return {
            ...patient.toObject(),
            hasAppointment: false,
          };
        }
      })
    );

    res.json({ patients: patientsWithAppointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Get single Patient
router.get("/patient/:id", async (req, res) => {
  try {
    const patient = await patientModel.findOne({ patientId: req.params.id });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//Get all Doctors
router.get("/doctors", async (req, res) => {
  try {
    const doctorId = await userModel.find(
      { role: "doctor" },
      { firstname: 1, lastname: 1, _id: 1 }
    );
    const doctors = await doctorModel.find(
      { userId: doctorId },
      { firstname: 1, lastname: 1, speciality: 1, userId: 1 }
    );
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//Get single Doctor
router.get("/doctor/:id", async (req, res) => {
  try {
    const doctors = await userModel.findOne(
      { role: "doctor", _id: req.params.id },
      { firstname: 1, lastname: 1, _id: 1 }
    );
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//Create appoinyment
router.post("/create/appointment", async (req, res) => {
  try {
    const { PID, doctorId } = req.body;

    console.log(doctorId);
    const doctor = await doctorModel.findOne({ userId: doctorId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check if the patient with the provided PID is available
    const patient = await patientModel.findOne({ patientId: PID });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Assuming you have an appointmentModel for creating appointments
    const appointment = await apointmentModel.create({
      patientId: PID,
      doctorId,
    });

    res.send({ message: "successfully appointed", doctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//update the status us the prescription to completed after print
router.put("/prescription/:prescriptionId", async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { status } = req.body;

    // Update the prescription status
    const updatedPrescription = await prescriptionModel.findByIdAndUpdate(
      prescriptionId,
      { status },
      { new: true }
    );

    res.json({
      message: "Prescription status updated successfully",
      prescription: updatedPrescription,
    });
  } catch (error) {
    console.error("Error updating prescription status:", error);
    res
      .status(500)
      .json({
        error: "An error occurred while updating the prescription status",
      });
  }
});
// get Prescriptions
// Get all Patients
router.get("/prescriptions", async (req, res) => {
  try {
    const prescriptions = await prescriptionModel.find();
    // Create an array to store the updated prescriptions with medicines
    const updatedPrescriptions = [];

    // Loop through each prescription
    for (const prescription of prescriptions) {
      // Get the prescription ID
      const prescriptionId = prescription._id;

      // Find the medicines associated with the prescription using the prescriptionId
      const medicines = await medicineModel.find({ prescriptionId });

      // Create an array to store the medicine details
      const medicineDetails = [];

      // Loop through each medicine
      for (const medicine of medicines) {
        // Extract the relevant medicine details
        const { name, description, price, availablity } = medicine;
        // Add the medicine details to the medicineDetails array
        medicineDetails.push({ name, description, price, availablity });
      }

      // Create a new object with the prescription data and the medicine details
      const updatedPrescription = {
        PID: prescription.patientId,
        prescriptionId: prescription._id,
        patientName: prescription.patientFullName,
        doctorName: prescription.doctorFullName,
        age: prescription.patientAge,
        medicines: medicineDetails,
        pharmacy: prescription.pharmacyName,
        status: prescription.status,
        counter: prescription.responseCounter,
        timerStatus:prescription.timerStatus,
      };

      // Push the updated prescription object to the array
      updatedPrescriptions.push(updatedPrescription);
    }

    res.json(updatedPrescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Get single Priscription
router.get("/print/:Prid", async (req, res) => {
  const prescriptionId = req.params.Prid;
  try {
    const prescription = await prescriptionModel.findById(prescriptionId);
    // const prescriptionId= prescription._id;
    const medicines = await medicineModel.find({ prescriptionId });

    // Create an array to store the medicine details
    const medicineDetails = [];

    // Loop through each medicine
    for (const medicine of medicines) {
      // Extract the relevant medicine details
      const { name, description } = medicine;
      // Add the medicine details to the medicineDetails array
      medicineDetails.push({ name, description });
    }

    const updatedPrescription = {
      patientId: prescription.patientId,
      prescriptionId: prescription._id,

      patientFullName: prescription.patientFullName,
      doctorFullName: prescription.doctorFullName,
      age: prescription.age,
      medicines: medicineDetails,
    };

    res.json(updatedPrescription);
    await apointmentModel.updateOne(
      { _id: prescription.apointmentId },
      { apointment_active: false }
    );
    await prescriptionModel.updateOne(
      { _id: prescription._id },
      { status: "completed" }
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/confirm/:Prid", async (req, res) => {
  const prescriptionId = req.params.Prid;
  try {
    const prescription = await prescriptionModel.findOne({
      _id: prescriptionId,
      status: "confirmedByPharmacy",
    });
    // const prescriptionId= prescription._id;
    const medicines = await medicineModel.find({ prescriptionId });

    // Create an array to store the medicine details
    const medicineDetails = [];

    // Loop through each medicine
    for (const medicine of medicines) {
      // Extract the relevant medicine details
      const { name, description, price } = medicine;
      // Add the medicine details to the medicineDetails array
      medicineDetails.push({ name, description, price });
    }

    const updatedPrescription = {
      patientId: prescription.patientId,
      prescriptionId: prescription._id,

      patientFullName: prescription.patientFullName,
      doctorFullName: prescription.doctorFullName,
      age: prescription.age,
      medicines: medicineDetails,
      paymentStatus: "Paid",
    };

    res.json(updatedPrescription);
    await apointmentModel.updateOne(
      { _id: prescription.apointmentId },
      { apointment_active: false }
    );
    await prescriptionModel.updateOne(
      { _id: prescription._id },
      { status: "completed" }
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single Priscription
router.get("/prescription/:Prid", async (req, res) => {
  const prescriptionId = req.params.Prid;
  const prescription = await prescriptionModel.findById(prescriptionId);

  try {
    const prescriptionResponses = await acceptedPharma.find({ prescriptionId });

    const responseWithPharmacyName = await Promise.all(
      prescriptionResponses.map(async (response) => {
        let pharmacyName;
        const pharmacyAcceptPr = await pharmacyAccept.findOne({
          pharmacyId: response.pharmacyId,
          prescriptionId: response.prescriptionId,
        });
        const status = pharmacyAcceptPr.status;
        if (status === "waiting" || status === "accepted") {
          const pharmacy = await pharmaModel.findOne({
            userId: response.pharmacyId,
          });
          pharmacyName = pharmacy ? pharmacy.pharmacyName : null;
        }
        return {
          ...response.toObject(),
          pharmacyName,
        };
      })
    );

    res.json({
      pharmacyresponse: responseWithPharmacyName,
      prescription: prescription,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/pharmacySelectedByPatient/:prescriptionId", async (req, res) => {
  const prescriptionId = req.params.prescriptionId;
  //find the pharmacyresponse from the pharmacyaccept table and change its response in to accepted
  const pharmaData = req.body;
  const { pharmacyId, pharmaciesIds,patientId } = pharmaData;

  try {
    const pharmacyResponse = await pharmacyAccept.findOneAndUpdate(
      { prescriptionId, pharmacyId },
      { status: "accepted" },
      { new: true }
    );
   const updatePatient =await  patientModel.findOneAndUpdate(
    {patientId},
    {healed:false}
   );

   if(!updatePatient){
    return res.status(404).json({error:"Pharmacy response not found"});
   }
    if (!pharmacyResponse) {
      // Pharmacy response not found, handle the error accordingly
      return res.status(404).json({ error: "Pharmacy response not found" });
    }

    // Find the pharmacy name from the pharmacies table using the pharmacyId
    const pharmacyData = await pharmaModel.findOne({ userId: pharmacyId });
    const pharmacyName = pharmacyData ? pharmacyData.pharmacyName : "";

    // Update the prescription table with the pharmacyName
    await prescriptionModel.findOneAndUpdate(
      { _id: prescriptionId },
      { pharmacyName, status: "accepted" },
      { new: true }
    );
    //find the medicines

    const pharmaResponseData = await acceptedPharma
      .findOne({ prescriptionId, pharmacyId })
      .select("medicines");
    const medicineData = pharmaResponseData.medicines;

    // Update medicines in the "medicines" table

    medicineData.map(async (acceptedMedicine) => {
      const { name, price, availablity } = acceptedMedicine;
      await medicineModel.findOneAndUpdate(
        { prescriptionId, name },
        { price, availablity },
        { new: true }
      );
    });

    // Update the status of other pharmacies in the pharmacyAccept table
    await pharmacyAccept.updateMany(
      { prescriptionId, pharmacyId: { $in: pharmaciesIds } },
      { status: "canceled" }
    );

    // Send socket notification to the accepted pharmacy
    io.emit("AcceptedPharmacy", {
      pharmacyId,
      prescriptionId,
    });

    // Send socket notification to the rejected pharmacies
    pharmaciesIds.forEach((rejectedPharmacyId) => {
      io.emit("rejectedPharmacy", {
         pharmaciesIds,
        prescriptionId,
      });
    });

    // Pharmacy response found and status updated successfully
    res.json(pharmaResponseData.medicines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//send prescription to patient
router.get("/reject/:Prid", async (req, res) => {
  const prescriptionId = req.params.Prid;
  try {
    const prescription = await prescriptionModel.findById(prescriptionId);

    await prescriptionModel.updateOne(
      { _id: prescriptionId },
      { status: "canceled" }
    );
    res.json({ message: "the order rejected by the patient", prescription });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/prescriptionn/:Prid", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, secretKey);
  const pharmacyId = decoded.userId;

  const pharmacyData = await pharmaModel.findOne({ userId: pharmacyId });
  const pharmacyName = pharmacyData ? pharmacyData.pharmacyName : "";
  console.log(pharmacyName);
  const prescriptionId = req.params.Prid;
  console.log(prescriptionId)
  

  try {
    const prescription = await prescriptionModel.findOne({
      _id: prescriptionId,
    
      status: "accepted",
    });
    const patient = await patientModel.findOne({patientId:prescription.patientId});
    // const prescriptionId= prescription._id;
    const medicines = await medicineModel.find({ prescriptionId });

    // Create an array to store the medicine details

    const updatedPrescription = {
      prescription,
      medicines,
      patient
    };
    res.json(updatedPrescription);
    // await apointmentModel.updateOne({ _id: prescription.apointmentId }, { apointment_active: false });
    // await prescriptionModel.updateOne({ _id: prescription._id }, { status: 'completed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
async function authenticateReception(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, secretKey);

    // Check if the decoded email belongs to a user with the admin role
    const username = decoded.username;
    const user = await userModel.findOne({ username });
    if (!user || user.role !== "reception") {
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
