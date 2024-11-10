require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const compression = require('compression');
const Joi = require('joi');

// Set up express app and server
const app = express();
app.use(compression()); // Enable compression for static files
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB connection with updated options (no deprecated options)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// User schema and model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  },
  totalDistance: { type: Number, default: 0 },
});

const User = mongoose.model('User', UserSchema);

// Haversine formula to calculate distance between two coordinates (in km)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Socket.io setup
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('startRace', async (userId) => {
    try {
      const user = await User.findById(userId);
      if (!user) return socket.emit('error', { message: 'User not found' });

      socket.emit('raceStarted', { message: 'Race Started!', user });

      let startTime = Date.now();
      let endTime = startTime + 30000; // 30 seconds

      const interval = setInterval(async () => {
        if (Date.now() >= endTime) {
          clearInterval(interval);
          return socket.emit('raceEnded', { message: 'Race Ended!' });
        }
        try {
          const newLocation = await getUserLocation(userId); // Replace with GPS integration
          const distance = haversine(user.location.lat, user.location.lon, newLocation.lat, newLocation.lon);
          user.location = newLocation;
          user.totalDistance += distance;
          await user.save();
          socket.emit('raceStatus', { distanceCovered: user.totalDistance });
        } catch (updateError) {
          console.error("Location update error:", updateError);
          socket.emit('error', { message: 'Location update failed' });
        }
      }, 2000); // Update every 2 seconds
    } catch (err) {
      console.error("Race start error:", err);
      socket.emit('error', { message: 'Race could not start' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Mock function to simulate real-time location update
async function getUserLocation(userId) {
  // In a real app, fetch location from the user's device
  return { lat: Math.random() * 180 - 90, lon: Math.random() * 360 - 180 };
}

// Validation function with Joi
function validateUser(userData) {
  const schema = Joi.object({
    username: Joi.string().required(),
    location: Joi.object({
      lat: Joi.number().required(),
      lon: Joi.number().required()
    }).required(),
    totalDistance: Joi.number().min(0)
  });
  return schema.validate(userData);
}

// Serve static files with compression
app.use(express.static('public'));

// Define the port and start the server
const PORT = process.env.PORT || 3001; // Change to any available port if 3000 is occupied
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
