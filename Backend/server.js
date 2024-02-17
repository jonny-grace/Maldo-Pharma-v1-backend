// Server-side code
const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const http = require('http');
const socketIO = require('socket.io');
const { getNearbyPharmacies } = require('./utils/getnearphamra');
const socketIoHelper = require('./utils/io');
const pharmacyAccept = require('./models/pharmacyAccept');
const acceptedPharma = require('./models/acceptedPharma');
const prescriptionModel = require('./models/prescription.model');

app.use(cors());
const secretKey = 'your_secret_key';

const server = http.createServer(app);
const io = socketIoHelper.initialize(server);

const pharmacySocketMap = {};
// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('registerPharmacy', (pharmacyId) => {
    const socketId = socket.id;
    pharmacySocketMap[pharmacyId] = socketId;
    console.log(`Pharmacy ${pharmacyId} registered with socketId: ${socketId}`);
  });

  socket.on('newPrescription', async (data) => {
    console.log('Received new prescription:', data);
    // Handle the received prescription data as needed
const selectedPharmacies=[]
    try {
      const nearPharma = await getNearbyPharmacies([9.0115842, 38.7670148]);
      // console.log('The nearest pharmacy is:', nearPharma);
       // Broadcast the new prescription only to nearby pharmacies
      nearPharma.forEach(async (pharmacy) => {
        selectedPharmacies.push(pharmacy.userId);


        
        // try{
          const pharmacydata = new pharmacyAccept({
            pharmacyId:pharmacy.userId,
            prescriptionId:data.prescription._id,
            status:'open'
          });
         await pharmacydata.save();
          console.log(data)
        
        // } catch(error){
        //   console.error('An error occured while inserting data in to acceptedpharmacy',error)
        // }
      });
      const dataresponse= {
        prescription: data,
        pharmaciesId:selectedPharmacies
      }
      io.emit('newPrescription', dataresponse);
    } catch (error) {  
      console.error('An error occurred while getting nearby pharmacies:', error);
    }
  });

  socket.on("acceptPharmacy", async ({ prescriptionId, token }) => {
    try {
      // Decode the token to retrieve the pharmacy ID
      const decoded = jwt.verify(token, secretKey);
      const pharmacyId = decoded.userId;
      const selectedPharmacies = [];
      const nearPharma = await getNearbyPharmacies([12.345678, 45.678901]);
      
      nearPharma.forEach(async (pharmacy) => {
        selectedPharmacies.push(pharmacy.userId);
      });
      
      // Find the prescription and check the response counter
      const prescription = await prescriptionModel.findOne({ _id: prescriptionId });
      const responseCounter = prescription.responseCounter;
      
      if (responseCounter < 3) {
        // Insert into the acceptedpharma table
        await acceptedPharma.create({ prescriptionId, pharmacyId });
        
        // Increment the response counter by one
        prescription.responseCounter = responseCounter + 1;
        if(prescription)
        await prescription.save();
        
        // Perform any necessary operations with the prescriptionId, pharmacyId, and token
        console.log("Prescription ID:", prescriptionId);
        console.log("Pharmacy ID:", pharmacyId);
        
        // Emit a success response to the client
        socket.emit("acceptPharmacyResponse", { success: true, message: "Accepted pharmacy successfully." });
        
        const numberleft= 3 - responseCounter;
        // Broadcast the event to selected pharmacies except the current pharmacy
        socket.broadcast.emit("prescriptionAccepted", { numberleft });
        
        // Filter sockets for selected pharmacies except the current pharmacy
        const selectedSockets = Object.values(io.sockets.sockets).filter(
          (sock) => selectedPharmacies.includes(sock.userId) && sock.userId !== pharmacyId
        );
        
        // Emit the event to selected sockets
        selectedSockets.forEach((sock) => {
          sock.emit("prescriptionAccepted", { prescriptionId });
        });
      } else {
        // Emit a failure response to the client
        socket.emit("acceptPharmacyResponse", { success: false, message: "Already received three responses." });
        console.log("already got three")
      }
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

app.use(express.static("public"));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
require('./config/database');

app.use(bodyParser.json());

app.use('/user', require('./routes/users.routes'));
app.use('/login', require('./routes/auth/login.routes'));
app.use('/admin', require('./routes/admin.routes'));
app.use('/reception', require('./routes/reception.routes'));
app.use('/pharmacy', require('./routes/pharmacy.routes'));
app.use('/doctor', require('./routes/doctor.routes'));

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log('Server started on port 3000');
});

module.exports =  io ;
