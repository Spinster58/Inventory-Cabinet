// stock_in.js
function getData() {
  const data = localStorage.getItem('stockData');
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveData(data) {
  localStorage.setItem('stockData', JSON.stringify(data));
  window.dispatchEvent(new Event('stockDataChanged'));
  localStorage.setItem('stockDataUpdated', Date.now());
}

function getCurrentDateTime() {
  const now = new Date();
  return {
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

// Activity logging function
function logAdminActivity(action, username, type) {
  const activity = {
    action,
    username,
    type,
    timestamp: new Date().toISOString()
  };
  
  const activities = JSON.parse(localStorage.getItem('adminActivities') || '[]');
  activities.push(activity);
  localStorage.setItem('adminActivities', JSON.stringify(activities));
}

function addStock() {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // 1. Check if user is logged in
    if (!currentUser) {
      window.location.href = 'login.html';
      return false;
    }
    
    // 2. Explicit admin check with console debug
    if (currentUser.role !== 'admin') {
      console.error('Access denied for user:', currentUser.username, 'Role:', currentUser.role);
      
      // Force show notification with longer display time
      const notificationMessage = '⛔ Access Denied: Only administrators can add stock';
      const tempToast = document.createElement('div');
      tempToast.className = 'notification-toast warning force-show';
      tempToast.innerHTML = `
        <div class="toast-message">${notificationMessage}</div>
        <div class="toast-progress" style="animation-duration: 5s;"></div>
      `;
      document.body.appendChild(tempToast);
      
      setTimeout(() => {
        tempToast.classList.add('show');
        setTimeout(() => {
          tempToast.classList.remove('show');
          setTimeout(() => tempToast.remove(), 500);
        }, 5000); // Show for 5 seconds
      }, 10);
      
      return false;
    }

    const item = document.getElementById("item").value.trim();
    const normalizedItem = item.toLowerCase();
    const qty = parseFloat(document.getElementById("qty").value.trim());
    const price = parseFloat(document.getElementById("price").value.trim());
    const supplier = document.getElementById("supplier").value.trim();
    const receiver = document.getElementById("receiver").value.trim();
    const note = document.getElementById("note").value.trim();

    if (!item || !qty || !price || !supplier || !receiver) {
      showNotification('Please fill all required fields', true);
      return false;
    }

    if (qty <= 0 || price <= 0) {
      showNotification('Quantity and price must be positive numbers', true);
      return false;
    }

    const { date, time } = getCurrentDateTime();
    const data = getData();
    
    const newEntry = {
      type: "in",
      item: normalizedItem,  // Store lowercase version for consistency
      displayItem: item,        // Store original for display
      qty,
      price,
      totalPrice: qty * price,
      supplier,
      receiver,
      note,
      date,
      time
    };
    
    data.push(newEntry);
    saveData(data);
    
    // Log the activity
    logAdminActivity(
      `${qty} ${item} from ${supplier}`,
      currentUser.username,
      'stock-in'
    );
    
    showNotification(`${receiver} received ${qty} ${item} from ${supplier}`);
    clearForm();
    loadData();
    return true;
    
  } catch (error) {
    console.error('Error in addStock:', error);
    showNotification('An error occurred while processing your request', true);
    return false;
  }
}

function calculateTotal() {
  const qty = parseFloat(document.getElementById("qty").value) || 0;
  const price = parseFloat(document.getElementById("price").value) || 0;
  const total = qty * price;
  document.getElementById("total-price").value = total.toFixed(2);
}

function clearForm() {
  document.getElementById("item").value = "";
  document.getElementById("qty").value = "";
  document.getElementById("price").value = "";
  document.getElementById("total-price").value = "";
  document.getElementById("supplier").value = "";
  document.getElementById("receiver").value = "";
  document.getElementById("note").value = "";
}

function loadData() {
  const keyword = document.getElementById("search").value.toLowerCase();
  const data = getData();
  const tbody = document.querySelector("#stock-table tbody");
  tbody.innerHTML = "";

  const filteredData = data.filter(entry => {
    if (entry.type !== "in") return false;
    const searchStr = `${entry.item} ${entry.qty} ${entry.supplier} ${entry.receiver} ${entry.note} ${entry.date} ${entry.time}`.toLowerCase();
    return searchStr.includes(keyword);
  });

  if (filteredData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">No stock in records found</td>
      </tr>
    `;
    return;
  }

  filteredData.forEach((entry, i) => {
    const actualIndex = data.findIndex(e => 
      e.type === "in" && 
      e.item.toLowerCase() === entry.item.toLowerCase() && 
      e.qty === entry.qty && 
      e.date === entry.date && 
      e.time === entry.time
    );
    
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.displayItem || entry.item}</td>  <!-- Use displayItem if available -->
      <td>${entry.qty}</td>
      <td>${entry.price.toFixed(2)}</td>
      <td>${entry.totalPrice.toFixed(2)}</td>
      <td>${entry.supplier}</td>
      <td>${entry.receiver}</td>
      <td>${entry.note || '-'}</td>
      <td class="date-column">${entry.date}</td>
      <td class="time-column">${entry.time}</td>
      <td>
        <button class="action-btn" onclick="editStock(${actualIndex})"><i class="fas fa-edit"></i></button>
        <button class="action-btn" onclick="deleteStock(${actualIndex})"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function deleteStock(index) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    showNotification('User not authenticated', true);
    return;
  }

  if (!confirm("Are you sure you want to delete this entry?")) return;
  const data = getData();
  
  if (data[index] && data[index].type === "in") {
    const deletedItem = data[index];
    data.splice(index, 1);
    saveData(data);
    
    // Log the delete activity
    logAdminActivity(
      `deleted stock in: ${deletedItem.qty} ${deletedItem.displayItem || deletedItem.item}`,
      currentUser.username,
      'delete'
    );
    
    showNotification(`Deleted stock in: ${deletedItem.qty} ${deletedItem.displayItem || deletedItem.item}`);
    loadData();
  }
}

function editStock(index) {
  const data = getData();
  const entry = data[index];
  if (!entry || entry.type !== "in") return;

  // Use displayItem if available, otherwise use item
  document.getElementById("item").value = entry.displayItem || entry.item;
  document.getElementById("qty").value = entry.qty;
  document.getElementById("price").value = entry.price;
  document.getElementById("total-price").value = entry.totalPrice;
  document.getElementById("supplier").value = entry.supplier;
  document.getElementById("receiver").value = entry.receiver;
  document.getElementById("note").value = entry.note || '';

  const fab = document.querySelector('.fab');
  fab.innerHTML = '<i class="fas fa-save"></i>';
  fab.onclick = function() {
    addStock();
    fab.innerHTML = '<i class="fas fa-plus"></i>';
    fab.onclick = addStock;
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  // Redirect if not logged in
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  // Deny access if not admin
  if (currentUser.role !== 'admin') {
    const notificationMessage = '⛔ Access Denied: Only administrators can access Stock In';
    const tempToast = document.createElement('div');
    tempToast.className = 'notification-toast warning force-show';
    tempToast.innerHTML = `
      <div class="toast-message">${notificationMessage}</div>
      <div class="toast-progress" style="animation-duration: 5s;"></div>
    `;
    document.body.appendChild(tempToast);

    setTimeout(() => {
      tempToast.classList.add('show');
      setTimeout(() => {
        tempToast.classList.remove('show');
        setTimeout(() => tempToast.remove(), 500);
      }, 5000);
    }, 10);

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 5500);
    return;
  }

  // Admin-only listeners
  document.getElementById("qty").addEventListener("input", calculateTotal);
  document.getElementById("price").addEventListener("input", calculateTotal);
  loadData();
});

document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('stock-in-container');
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