const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

// Set up express app and server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB (replace with your actual connection string)
mongoose.connect('mongodb://localhost:27017/raceapp', { useNewUrlParser: true, useUnifiedTopology: true });

const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  location: {
    lat: Number,
    lon: Number
  },
  totalDistance: Number,
}));

// Haversine formula to calculate distance between two coordinates (in km)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Socket.io setup
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('startRace', async (userId) => {
    // Fetch user data when race starts
    const user = await User.findById(userId);
    socket.emit('raceStarted', { message: 'Race Started!', user });
    
    // Track location for 30 seconds
    let startTime = Date.now();
    let endTime = startTime + 30000; // 30 seconds

    const interval = setInterval(async () => {
      if (Date.now() >= endTime) {
        clearInterval(interval);
        // End race and send result
        socket.emit('raceEnded', { message: 'Race Ended!' });
        return;
      }
      // Update user location and calculate distance
      const newLocation = await getUserLocation(userId); // mock function to get new location
      const distance = haversine(user.location.lat, user.location.lon, newLocation.lat, newLocation.lon);
      user.location = newLocation;
      user.totalDistance += distance;
      await user.save();
      
      // Send updated race status to user
      socket.emit('raceStatus', { distanceCovered: user.totalDistance });
    }, 1000); // Update every second
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Mock function to simulate real-time location update
async function getUserLocation(userId) {
  // In real app, fetch location from the user's device
  return { lat: Math.random() * 180 - 90, lon: Math.random() * 360 - 180 }; // Random lat/lon
}

// Serve static files (for the frontend)
app.use(express.static('public'));

// Start the server
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
