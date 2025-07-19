// stock_out.js
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

let allItems = [];

function populateItemDropdown() {
  const data = getData();
  allItems = [...new Set(data
    .filter(entry => entry.type === "in")
    .map(entry => entry.item)
  )].sort();
  
  filterItems();
}

function filterItems() {
  const searchTerm = document.getElementById('itemSearch').value.toLowerCase();
  const dropdownItems = document.getElementById('dropdownItems');
  dropdownItems.innerHTML = '';
  
  const filteredItems = allItems.filter(item => 
    item.toLowerCase().includes(searchTerm)
  );
  
  if (filteredItems.length === 0) {
    dropdownItems.innerHTML = '<div class="empty-dropdown">No items found</div>';
    return;
  }
  
  filteredItems.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'dropdown-item';
    
    const availableStock = calculateCurrentStock(item);
    
    itemElement.innerHTML = `
      <span>${item}</span>
      <span class="stock-count">${availableStock} available</span>
    `;
    
    itemElement.onclick = function() {
      selectItem(item);
    };
    dropdownItems.appendChild(itemElement);
  });
}

function selectItem(item) {
  document.getElementById('selectedItem').textContent = item;
  document.getElementById('item').value = item;
  closeDropdown();
  document.getElementById('qty').focus();
}

function toggleDropdown() {
  const dropdown = document.getElementById('itemDropdown');
  if (dropdown.style.display === 'block') {
    closeDropdown();
  } else {
    populateItemDropdown();
    dropdown.style.display = 'block';
    document.getElementById('itemSearch').focus();
  }
}

function closeDropdown() {
  document.getElementById('itemDropdown').style.display = 'none';
}

document.addEventListener('click', function(event) {
  const dropdown = document.getElementById('itemDropdown');
  const header = document.getElementById('itemDropdownHeader');
  if (!header.contains(event.target)) {
    closeDropdown();
  }
});

function addStockOut() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    showNotification('User not authenticated', true);
    return;
  }

  const item = document.getElementById('item').value.trim();
  const qty = parseInt(document.getElementById('qty').value.trim());
  const person = document.getElementById('person').value.trim();
  const reason = document.getElementById('reason').value.trim();

  if (!item || !qty || !person) {
    showNotification('Please fill all required fields', true);
    return;
  }

  if (qty <= 0) {
    showNotification('Quantity must be a positive number', true);
    return;
  }

  const availableStock = calculateCurrentStock(item);
  if (qty > availableStock) {
    alert(`Cannot stock out ${qty} ${item} - only ${availableStock} available`);
    return;
  }

  const { date, time } = getCurrentDateTime();
  const data = getData();
  
  const newEntry = {
    type: "out",
    item,
    qty,
    person,
    reason,
    date,
    time
  };
  
  data.push(newEntry);
  saveData(data);
  
  // Log the activity
  logAdminActivity(
    `${qty} ${item} to ${person}${reason ? ' (' + reason + ')' : ''}`,
    currentUser.username,
    'stock-out'
  );
  
  showNotification(`${person} took ${qty} ${item}${reason ? ' (' + reason + ')' : ''}`);
  
  const newStock = availableStock - qty;
  if (newStock < 5) {
    showNotification(`Warning: Low stock for ${item} (${newStock} remaining)`, true);
  }
  
  clearForm();
  loadData();
}

function calculateCurrentStock(itemName) {
  const data = getData();
  return data.reduce((total, entry) => {
    if (entry.item === itemName) {
      return total + (entry.type === 'in' ? entry.qty : -entry.qty);
    }
    return total;
  }, 0);
}

function clearForm() {
  document.getElementById('selectedItem').textContent = 'Select item';
  document.getElementById('item').value = '';
  document.getElementById('qty').value = '';
  document.getElementById('person').value = '';
  document.getElementById('reason').value = '';
}

function loadData() {
  const keyword = document.getElementById('search').value.toLowerCase();
  const data = getData();
  const tbody = document.querySelector('#stock-table tbody');
  tbody.innerHTML = '';

  const filteredData = data.filter(entry => {
    if (entry.type !== "out") return false;
    const searchStr = `${entry.item} ${entry.qty} ${entry.person} ${entry.reason} ${entry.date} ${entry.time}`.toLowerCase();
    return searchStr.includes(keyword);
  });

  if (filteredData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No stock out records found</td>
      </tr>
    `;
    return;
  }

  filteredData.forEach((entry, i) => {
    const actualIndex = data.findIndex(e => 
      e.type === "out" && 
      e.item === entry.item && 
      e.qty === entry.qty && 
      e.date === entry.date && 
      e.time === entry.time
    );
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.item}</td>
      <td>${entry.qty}</td>
      <td>${entry.person}</td>
      <td>${entry.reason || '-'}</td>
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
  
  if (data[index] && data[index].type === "out") {
    const deletedItem = data[index];
    data.splice(index, 1);
    saveData(data);
    
    // Log the delete activity
    logAdminActivity(
      `deleted stock out: ${deletedItem.qty} ${deletedItem.item}`,
      currentUser.username,
      'delete'
    );
    
    showNotification(`Deleted stock out: ${deletedItem.qty} ${deletedItem.item}`);
    loadData();
  }
}

function editStock(index) {
  const data = getData();
  const entry = data[index];
  if (!entry || entry.type !== "out") return;

  document.getElementById('selectedItem').textContent = entry.item;
  document.getElementById('item').value = entry.item;
  document.getElementById('qty').value = entry.qty;
  document.getElementById('person').value = entry.person;
  document.getElementById('reason').value = entry.reason || '';

  const fab = document.querySelector('.fab');
  fab.innerHTML = '<i class="fas fa-save"></i>';
  fab.onclick = function() {
    addStockOut();
    fab.innerHTML = '<i class="fas fa-plus"></i>';
    fab.onclick = addStockOut;
  };
}

document.addEventListener('DOMContentLoaded', function() {
  loadData();
  populateItemDropdown();
  
  window.addEventListener('stockDataChanged', function() {
    populateItemDropdown();
    loadData();
  });
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