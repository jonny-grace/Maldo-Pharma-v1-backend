const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const userModel = require("../models/user.model");
const adminModel = require("../models/admin.model");
const Joi = require('joi');

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
const userSchema = Joi.object({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber:Joi.string().required()
  });

// Define a route to create an admin account
router.post('/', async (req, res) => {
    const { error } = userSchema.validate(req.body);
  
    if (error) {
      console.error('Validation error:', error.details[0].message);
      res.status(400).send('Bad Request');
      return;
    }
  
    const { firstname, lastname,username, phoneNumber, email } = req.body;
  
    // Create a new user object with role='admin'
    const password = email; // Use email as the default password
    const role = 'admin';
    const user = new userModel({
     
      username,
      email,
      role,
      password,
    });

    // Save the user in the users table
    await user.save();

     

    // Create a new doctor
    const admin = new adminModel({
      userId: user._id,
      firstname,
      lastname,
      phoneNumber,
      email,
     
    });

    // Save the doctor in the doctors table
    await admin.save();

    return res.status(200).json({ message: 'Admin registered successfully' });

  });
  
  //Registration for reception
router.post('/register/admin', async (req, res) => {
  try {
    const { firstname, lastname, username, phoneNumber, email,age,location,password } = req.body;

    // Validate input
    if (!firstname || !lastname || !username || !phoneNumber || !email || !age || !location || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create a new user account for the doctor
    // const password = email;
    const hashedPassword = await bcrypt.hash(password, 10); // Use email as the default password
    const role = 'admin';
    const user = new userModel({
     
      username,
      email,
      role,
      password:hashedPassword,
    });

    // Save the user in the users table
    await user.save();

    // Create a new doctor
    const admin = new adminModel({
      userId: user._id,
      firstname,
      lastname,
      email,
      phoneNumber,
      age,
    password, 
      location
      
    });

    // Save the doctor in the doctors table
    await admin.save();

    return res.status(200).json({ message: 'Reception registered successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred' });
  }
});

router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      
      // Fetch users credentials from MongoDB
      const user = await userModel.findOne({ email });
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create a token with jwt
      const token = jwt.sign({ email: user.email }, "secretkey");

      res.json({ token });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.post("/logout", verifyToken, (req, res) => {
  res.json({ message: "Logout successful" });
});
module.exports = router;
