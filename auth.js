// auth.js
const users = [
  {
    username: "admin",
    password: "1234" // Note: In production, never store plain text passwords
  },
  {
    username: "user",
    password: "abcd"
  }
];

function handleLogin() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const errorElement = document.getElementById("error");

  // Clear previous errors
  errorElement.textContent = "";

  // Basic validation
  if (!username || !password) {
    errorElement.textContent = "Please enter both username and password.";
    return;
  }

  // Find user
  const user = users.find(u => u.username === username && u.password === password);
  console.log("User found:", user); // Debugging log
  console.log("localStorage before:", localStorage.getItem('isAuthenticated')); // Debugging log

  if (user) {
    // Set authentication flag
    localStorage.setItem('isAuthenticated', 'true');
    console.log("localStorage after:", localStorage.getItem('isAuthenticated')); // Debugging log
    // Redirect to dashboard
    window.location.href = "dashboard.html";
  } else {
    errorElement.textContent = "Invalid username or password.";
  }
}

// Add event listeners for Enter key
document.getElementById('password').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    handleLogin();
  }
});