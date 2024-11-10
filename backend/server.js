const express = require('express');
const app = express();

// Middleware to parse JSON request body
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('');
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

// Start the server
const PORT = process.env.PORT || 12971;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
