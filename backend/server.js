const express = require('express');
const app = express();

app.use(express.json());

let requests = []; // Array to hold incoming requests
let TopFive = []; // Array to hold Top 5 users with the highest distances
let existingUserIDs = []; // Array to store unique UserIDs

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Compare and Matchmaking API!');
});

// Route to compare two values
app.post('/compare', (req, res) => {
  const { UserOneDistance, UserOneID, UserTwoDistance, UserTwoID} = req.body;

  // Check if both values are provided and are numbers
  if (typeof UserOneDistance !== 'number' || typeof UserTwoDistance !== 'number') {
    return res.status(400).json({ error: 'Both UserOneDistance and UserTwoDistance must be numbers.' });
  }

  // Compare the two values and return the greater one
  const greaterValue = UserOneDistance > UserTwoDistance ? UserOneDistance : UserTwoDistance;

  let ID;

  if (UserOneDistance > UserTwoDistance)
  {
    ID = UserOneID;
  }
  else
  {
    ID = UserTwoID;
  }

  // Add the greater distance to the TopFive leaderboard
  const userData = { userId: `User${ID}`, distance: greaterValue };
  TopFive.push(userData);

  // Sort and keep only the top 5 distances
  TopFive.sort((a, b) => b.distance - a.distance);
  if (TopFive.length > 5) {
    TopFive.pop(); // Remove the lowest entry if there are more than 5
  }

  res.json({ greaterValue, leaderboard: TopFive });
});

// Route to add a matchmaking request
app.post('/request', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  // Check if userId is already in the requests array
  if (requests.includes(userId)) {
    return res.json({ message: "Waiting for someone to join" });
  } else {
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
  }
});

// Leaderboard route
app.get('/leaderboard', (req, res) => {
  res.json({ leaderboard: TopFive });
});

app.get('/register', (req, res) => {
  let ID;

  do {
    ID = Math.floor(Math.random() * 1000); // Generates a number between 0 and 999
  } while (existingUserIDs.includes(ID)); // Keep generating if ID is already taken

  // Add the unique ID to the list of existing IDs
  existingUserIDs.push(ID);

  res.json({ UserID: ID });
});

// Start the server
const PORT = process.env.PORT || 12990;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
