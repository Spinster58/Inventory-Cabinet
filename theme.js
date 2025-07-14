// Theme Toggle Function
function toggleTheme() {
  const body = document.body;
  body.classList.toggle('dark-mode');
  
  const themeBtn = document.querySelector('.theme-toggle');
  const isDarkMode = body.classList.contains('dark-mode');
  
  themeBtn.textContent = isDarkMode ? '☀️' : '🌙';
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

// Initialize Theme
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const body = document.body;
  const themeBtn = document.querySelector('.theme-toggle');
  
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeBtn.textContent = '☀️';
  } else {
    body.classList.remove('dark-mode');
    themeBtn.textContent = '🌙';
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initTheme);