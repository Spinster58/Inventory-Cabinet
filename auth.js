// auth.js - Authentication System

// Initialize auth object directly on window
window.auth = {
  /**
   * Initializes default users if none exist
   */
  initUsers: function() {
    try {
      const users = JSON.parse(localStorage.getItem('users')) || [];
      
      // Add admin user if not exists
      if (!users.some(u => u.username === 'admin')) {
        users.push({
          username: 'admin',
          password: 'admin123',
          role: 'admin',
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('users', JSON.stringify(users));
      }
    } catch (error) {
      console.error('Failed to initialize users:', error);
    }
  },

  /**
   * Authenticates a user
   */
  login: function(username, password) {
    try {
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (!user) return false;
      
      if (user.password === password) {
        const { password: _, ...userWithoutPassword } = user;
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  },

  /**
   * Registers a new user
   */
  register: function(username, password, role = 'user') {
    try {
      if (!username || !password) return false;
      if (password.length < 8) return false;
      
      const users = JSON.parse(localStorage.getItem('users')) || [];
      
      if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return false;
      }
      
      const newUser = {
        username,
        password,
        role,
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  },

  /**
   * Get current logged in user
   */
  getCurrentUser: function() {
    try {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  /**
   * Check if current user is admin
   */
  isAdmin: function() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  },

  /**
   * Get all users (admin only)
   */
  getAllUsers: function() {
    if (!this.isAdmin()) return [];
    try {
      return JSON.parse(localStorage.getItem('users')) || [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  /**
   * ADMIN-ONLY: Reset a user's password
   */
  adminResetPassword: function(username, newPassword) {
    if (!this.isAdmin()) return false;
    
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) return false;
    
    users[userIndex].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    return true;
  },

  /**
   * Remove a user (admin only)
   */
  removeUser: function(username) {
    if (!this.isAdmin()) return false;
    
    const users = this.getAllUsers();
    const updatedUsers = users.filter(u => u.username !== username);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    return true;
  },

  /**
   * Logout current user
   */
  logout: function() {
    localStorage.removeItem('currentUser');
  }
};