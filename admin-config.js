// admin-config.js - Admin Configuration System

// Initialize admin users if none exist
function initAdminConfig() {
  if (!localStorage.getItem('adminUsers')) {
    // Default admin users (can be modified later)
    const adminUsers = ['admin'];
    localStorage.setItem('adminUsers', JSON.stringify(adminUsers));
  }
}

/**
 * Checks if a user is admin
 * @param {string} username 
 * @returns {boolean}
 */
function isUserAdmin(username) {
  const adminUsers = JSON.parse(localStorage.getItem('adminUsers')) || [];
  return adminUsers.includes(username);
}

/**
 * Adds a user to admin list
 * @param {string} username 
 * @returns {boolean} - True if successful
 */
function addAdminUser(username) {
  const adminUsers = JSON.parse(localStorage.getItem('adminUsers')) || [];
  if (!adminUsers.includes(username)) {
    adminUsers.push(username);
    localStorage.setItem('adminUsers', JSON.stringify(adminUsers));
    return true;
  }
  return false;
}

/**
 * Removes a user from admin list
 * @param {string} username 
 * @returns {boolean} - True if successful
 */
function removeAdminUser(username) {
  let adminUsers = JSON.parse(localStorage.getItem('adminUsers')) || [];
  const initialLength = adminUsers.length;
  adminUsers = adminUsers.filter(u => u !== username);
  localStorage.setItem('adminUsers', JSON.stringify(adminUsers));
  return adminUsers.length !== initialLength;
}

// Initialize when loaded
document.addEventListener('DOMContentLoaded', initAdminConfig);

// Expose to global scope
window.adminConfig = {
  isUserAdmin,
  addAdminUser,
  removeAdminUser,
  getAdminUsers: () => JSON.parse(localStorage.getItem('adminUsers')) || []
};

document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('activityLogContainer');
  if (container) {
    container.addEventListener('scroll', function() {
      if (this.scrollTop > 0) {
        this.classList.add('scrolled');
      } else {
        this.classList.remove('scrolled');
      }
    });
  }
});