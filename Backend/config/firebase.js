const admin = require('firebase-admin');
const serviceAccount = require('./maldo-e-pharma-firebase.json'); // Replace with the actual path to your service account key file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;