const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const ContactForm = require("../models/contact.model");

router.post(
  "/",
  [
    body("email").isEmail(),
    body("phone").isMobilePhone(),
    body("message").notEmpty(),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Save the form data to MongoDB
      const contactFormData = new ContactForm(req.body);
      await contactFormData.save();

      // Send email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "johnlemma9@gmail.com",
          pass: "GraceArgens1.ASLA",
        },
      });

      const mailOptions = {
        from: req.body.email,
        to: "johnlemma9@gmail.com",
        subject: "New Contact Form Submission",
        text: `
          Email: ${req.body.email}
          Phone: ${req.body.phone}
          Message: ${req.body.message}
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }
        res.json({ message: "Form submitted successfully", info });
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
