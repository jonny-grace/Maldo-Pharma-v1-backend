const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../../models/user.model");
const pharmacyModel = require("../../models/pharmacy.model");
const pharmaModel = require("../../models/pharma.model");
const maldoReceptionModel = require("../../models/maldoReception.model");
const doctorModel = require("../../models/doctor.model");
const adminModel = require("../../models/admin.model");

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
router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
 
    // Check if the user exists
    const user = await userModel.findOne({ username });
    let status='';

    
   if(user.role==='pharmacy'){
    const pharmacy=await pharmaModel.findOne({userId:user._id});
     status=pharmacy.status ? pharmacy.status:'';
   }

   if(user.role==='reception'){
    const reception=await maldoReceptionModel.findOne({userId:user._id});
     status=reception.status ? reception.status:'';
   }

   if(user.role==='doctor'){
    const doctor=await doctorModel.findOne({userId:user._id});
     status=doctor.status ? doctor.status:'';
   }
   
    if (!user) {
      return res.status(401).json({ message: 'Invalid username' });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const role=user.role;
    const userId=user._id;
    // Generate a JWT token
    const token = jwt.sign({ username,role,userId }, secretKey);
const userData={
    firstName:user.firstname,lastname:user.lastname, role:user.role, userId:userId,status:status
}
    return res.status(200).json({ token,userData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred' });
  }
});






router.post("/logout", verifyToken, (req, res) => {
  res.json({ message: "Logout successful" });
});
module.exports = router;
