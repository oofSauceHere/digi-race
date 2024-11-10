const express = require('express');
const app = express();

// Middleware to parse JSON request body
app.use(express.json());

let requests = []; // Array to hold incoming requests

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Compare and Matchmaking API!');
});

// Route to compare two values
app.post('/compare', (req, res) => {
  const { UserOneDistance, UserTwoDistance } = req.body;

  // Check if both values are provided and are numbers
  if (typeof UserOneDistance !== 'number' || typeof UserTwoDistance !== 'number') {
    return res.status(400).json({ error: 'Both UserOneDistance and UserTwoDistance must be numbers.' });
  }

  // Compare the two values and return the greater one
  const greaterValue = UserOneDistance > UserTwoDistance ? UserOneDistance : UserTwoDistance;
  res.json({ greaterValue });
});

// Route to add a matchmaking request
app.post('/request', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  // Add the request to the list
  requests.push(userId);
  console.log(`Request received from user: ${userId}`);

  // Check if there are two requests to create a match
  if (requests.length >= 2) {
    // Create a match
    const match = { user1: requests[0], user2: requests[1] };
    console.log(`Match created between user ${match.user1} and user ${match.user2}`);

    // Send the match response
    res.json({ message: "Match created", match });

    // Clear the requests list
    requests = [];
  } else {
    // If only one request, respond with waiting message
    res.json({ message: "Waiting for another request to create a match" });
  }
});

// Start the server
const PORT = process.env.PORT || 12972;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
