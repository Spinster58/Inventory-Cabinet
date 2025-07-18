// notifications.js - Unified Notification System
let notifications = JSON.parse(localStorage.getItem('notifications')) || [];

function showNotification(message, isWarning = false) {
  const now = new Date();
  const notification = {
    message,
    isWarning,
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: now.getTime()
  };
  
  // Keep only the 100 most recent notifications
  notifications.unshift(notification);
  if (notifications.length > 100) {
    notifications = notifications.slice(0, 100);
  }
  
  localStorage.setItem('notifications', JSON.stringify(notifications));
  updateNotificationBadge();
  showToastNotification(message, isWarning);
}

function showToastNotification(message, isWarning = false) {
  const toast = document.createElement('div');
  toast.className = `notification-toast ${isWarning ? 'warning' : ''}`;
  toast.innerHTML = `
    <div class="toast-message">${message}</div>
    <div class="toast-progress"></div>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }, 10);
}

function updateNotificationBadge() {
  const badges = document.querySelectorAll('.notification-bell .badge');
  badges.forEach(badge => {
    const unreadCount = notifications.length;
    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
  });
}

function renderNotifications() {
  const containers = document.querySelectorAll('.notification-content');
  containers.forEach(container => {
    container.innerHTML = notifications.length > 0 
      ? notifications.map((notif, index) => `
          <div class="notification-card ${notif.isWarning ? 'warning' : ''}" 
               onclick="handleNotificationClick(${index})">
            <div class="notification-message">${notif.message}</div>
            <div class="notification-meta">
              <span class="notification-time">${notif.time}</span>
              <span class="notification-date">${notif.date}</span>
            </div>
          </div>
        `).join('')
      : '<div class="empty-notifications">No new notifications</div>';
  });
}

function handleNotificationClick(index) {
  notifications.splice(index, 1);
  localStorage.setItem('notifications', JSON.stringify(notifications));
  renderNotifications();
  updateNotificationBadge();
}

function toggleNotificationCenter() {
  const centers = document.querySelectorAll('.notification-center');
  centers.forEach(center => {
    center.style.display = center.style.display === 'block' ? 'none' : 'block';
    if (center.style.display === 'block') {
      renderNotifications();
    }
  });
}

function clearAllNotifications() {
  notifications = [];
  localStorage.setItem('notifications', JSON.stringify(notifications));
  renderNotifications();
  updateNotificationBadge();
  showToastNotification('All notifications cleared');
}

// Initialize notification system
function initNotificationSystem() {
  // Initialize bell
  const bell = document.querySelector('.notification-bell');
  if (bell) {
    bell.onclick = toggleNotificationCenter;
    updateNotificationBadge();
  }
  
  // Close notification center when clicking outside
  document.addEventListener('click', function(event) {
    const center = document.querySelector('.notification-center');
    const bell = document.querySelector('.notification-bell');
    
    if (center && center.style.display === 'block' && 
        !center.contains(event.target) && 
        !bell.contains(event.target)) {
      center.style.display = 'none';
    }
  });
}

// Make functions available globally
window.showNotification = showNotification;
window.toggleNotificationCenter = toggleNotificationCenter;
window.handleNotificationClick = handleNotificationClick;
window.clearAllNotifications = clearAllNotifications;
window.updateNotificationBadge = updateNotificationBadge;
window.renderNotifications = renderNotifications;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initNotificationSystem);