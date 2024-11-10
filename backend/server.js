const express = require('express');
// const cors = require('cors')
const app = express();

app.use(express.json());
// app.use(cors());

let requests = new Set(); // Set to hold incoming requests
let matches = new Map();
let inMatch = new Map();
let sentRequest = new Set();
let results = new Map();
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
  const userData = { UserID: `User${ID}`, distance: greaterValue };
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
  const { UserID } = req.body;
  if (UserID == null) {
    return res.status(400).json({ error: "UserID is required" });
  }

  // Check if userId is already in the requests array
  if (requests.has(UserID)) {
    return res.json({ message: "Waiting for someone to join" });
  } else if(!inMatch.has(UserID)) {
    // Add the request to the list
    requests.add(UserID);
    console.log(`Request received from user: ${UserID}`);

    // Check if there are two requests to create a match
    if (requests.size >= 2) {
      // Create a match
      let ID;

      do {
        ID = Math.floor(Math.random() * 1000); // Generates a number between 0 and 999
      } while (matches.has(ID)); // Keep generating if ID is already taken

      let user2;
      let i = 0;
      for (const value of requests) {
        if(i == 1) {
          break;
        }
        user2 = value;
        i = i+1;
      }

      // Add the unique ID to the list of existing IDs
      const match = { user1: { id: UserID, submitted: false, dist: -1 }, user2: { id: user2, submitted: false, dist: -1 } };
      matches.set(ID, match);
      inMatch.set(UserID, ID);
      inMatch.set(match.user2.id, ID);
      console.log(`Match created between user ${match.user1.id} and user ${match.user2.id}`);

      // Send the match response
      res.json({ message: "Match started", MatchID: ID });
      sentRequest.add(UserID);

      // Clear the requests list
      requests.delete(UserID);
      requests.delete(match.user2.id);
    } else {
      // If only one request, respond with waiting message
      res.json({ message: "Waiting for another request to create a match" });
    }
  } else if(inMatch.has(UserID) && !sentRequest.has(UserID)) {
    res.json({ message: "Match started", MatchID: inMatch.get(UserID) });
    sentRequest.add(UserID);
  }
});

app.post('/submit', (req, res) => {
  const { UserID, MatchID, dist } = req.body;
  if (UserID == null) {
    return res.status(400).json({ error: "UserID is required" });
  }

  if(MatchID == null) {
    return res.status(400).json({ error: "MatchID is required" });
  }

  if(dist == null) {
    return res.status(400).json({ error: "Distance is required" });
  }

  const match = matches.get(MatchID);
  if(UserID == match.user1.id) {
    match.user1.submitted = true;
    match.user1.dist = dist;
  } else {
    match.user2.submitted = true;
    match.user2.dist = dist;
  }

  if(match.user1.submitted && match.user2.submitted) {
    console.log("Match decided.");
    results.set(MatchID, { 
      winner: (match.user1.dist > match.user2.dist ? match.user1.id : match.user2.id),
      dist: (match.user1.dist > match.user2.dist ? match.user1.dist : match.user2.dist) * 1000
    });
  }

  console.log(results.get(MatchID));

  res.send("resolved");
  inMatch.delete(match.user1.id);
  inMatch.delete(match.user2.id);
  sentRequest.delete(match.user1.id);
  sentRequest.delete(match.user2.id);
})

// Leaderboard route
app.get('/leaderboard', (req, res) => {
  res.json({ leaderboard: TopFive });
});

app.post('/register', (req, res) => {
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
// server.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});