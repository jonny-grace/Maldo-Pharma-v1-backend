const socketIO = require('socket.io');

let io = null;

exports.initialize = (server) => {
  io = socketIO(server, {
    cors: {
      origin: "*", // Adjust according to your needs
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true
    }
  });
  return io;
};

exports.getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};