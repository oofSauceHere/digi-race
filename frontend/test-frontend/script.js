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
  