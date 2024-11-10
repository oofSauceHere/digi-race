// Function to handle Profile button click
function showProfile() {
    alert("Profile button clicked! Display user profile information here.");
  }
  
  // Function to handle Match button click
  function startMatch() {
    alert("Match button clicked! Initiate a new running match.");
  }
  
  // Function to handle Chat button click
  function openChat() {
    alert("Chat button clicked! Open the chat feature here.");
  }
  
  // Function to compare results between two users
  function compareResults() {
    const user1Distance = parseFloat(document.getElementById("user1-distance").value);
    const user1Time = parseFloat(document.getElementById("user1-time").value);
    const user2Distance = parseFloat(document.getElementById("user2-distance").value);
    const user2Time = parseFloat(document.getElementById("user2-time").value);
  
    // Calculate speeds (distance/time)
    const user1Speed = user1Distance / user1Time;
    const user2Speed = user2Distance / user2Time;
  
    // Determine the winner based on speed
    let resultText = "";
    if (user1Speed > user2Speed) {
      resultText = "User 1 wins with a faster speed!";
    } else if (user2Speed > user1Speed) {
      resultText = "User 2 wins with a faster speed!";
    } else {
      resultText = "It's a tie!";
    }
  
    // Display result
    document.getElementById("competition-result").textContent = resultText;
  }

  // Sample leaderboard data
let leaderboard = [
  { name: "User1", wins: 3, distance: 30 },
  { name: "User2", wins: 2, distance: 25 },
  { name: "User3", wins: 5, distance: 40 },
  { name: "You", wins: 4, distance: 32 },
];

// Function to update leaderboard display
function renderLeaderboard() {
  const leaderboardList = document.getElementById("leaderboard-list");
  leaderboardList.innerHTML = ""; // Clear existing items

  // Sort leaderboard by wins (highest first)
  leaderboard.sort((a, b) => b.wins - a.wins);

  // Render each entry
  leaderboard.forEach(user => {
    const listItem = document.createElement("li");
    listItem.textContent = `${user.name} - Wins: ${user.wins}, Distance: ${user.distance} km`;
    leaderboardList.appendChild(listItem);
  });
}

// Function to update leaderboard when a user wins
function updateWin(winnerName) {
  const user = leaderboard.find(user => user.name === winnerName);
  if (user) {
    user.wins += 1;
    user.distance += 10; // Example distance increment, adjust as needed
  } else {
    leaderboard.push({ name: winnerName, wins: 1, distance: 10 });
  }

  // Save updated leaderboard to localStorage
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
  renderLeaderboard();
}

// Load leaderboard from localStorage on page load
function loadLeaderboard() {
  const savedData = localStorage.getItem("leaderboard");
  if (savedData) {
    leaderboard = JSON.parse(savedData);
  }
  renderLeaderboard();
}

// Call this on page load
loadLeaderboard();

  