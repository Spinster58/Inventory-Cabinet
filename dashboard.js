// dashboard.js
let chart;

function loadDashboard() {
  const data = JSON.parse(localStorage.getItem('stockData')) || [];
  let totalIn = 0, totalOut = 0;
  const stockLevels = {};
  const recentIn = [];
  const recentOut = [];

  // Calculate totals and stock levels
  data.forEach(entry => {
    const qty = parseFloat(entry.qty) || 0;
    const item = entry.item;

    if (entry.type === "in") {
      totalIn += qty;
      recentIn.push(entry);
      stockLevels[item] = (stockLevels[item] || 0) + qty;
    } 
    else if (entry.type === "out") {
      totalOut += qty;
      recentOut.push(entry);
      stockLevels[item] = (stockLevels[item] || 0) - qty;
    }
  });

  // Update summary cards
  document.getElementById("total-in").textContent = totalIn.toFixed(2);
  document.getElementById("total-out").textContent = totalOut.toFixed(2);

  // Find most frequent item
  const itemCounts = {};
  data.forEach(entry => {
    itemCounts[entry.item] = (itemCounts[entry.item] || 0) + 1;
  });
  const mostFrequent = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("most-item").textContent = mostFrequent ? mostFrequent[0] : "-";

  // Update stock levels table
  updateStockTable(stockLevels);

  // Update recent transactions
  updateRecentTransactions(recentIn, recentOut);

  // Draw chart
  drawChart(stockLevels);
}

function updateStockTable(stockLevels) {
  const tbody = document.querySelector("#stock-level-table tbody");
  tbody.innerHTML = "";
  
  if (Object.keys(stockLevels).length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="2" class="empty-state">No stock data available</td>
      </tr>
    `;
  } else {
    Object.entries(stockLevels).forEach(([item, qty]) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${item}</td><td>${qty}</td>`;
      tbody.appendChild(row);
    });
  }
}

function updateRecentTransactions(recentIn, recentOut) {
  // Sort by date/time
  recentIn.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  recentOut.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

  // Update tables
  updateRecentTable('recent-in-table', recentIn.slice(0, 5));
  updateRecentTable('recent-out-table', recentOut.slice(0, 5));
}

function updateRecentTable(tableId, entries) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = "";

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No recent transactions</td></tr>`;
    return;
  }

  entries.forEach(entry => {
    const row = document.createElement("tr");
    if (entry.type === "in") {
      row.innerHTML = `
        <td>${entry.item}</td>
        <td>${entry.qty}</td>
        <td>${entry.price ? entry.price.toFixed(2) : '-'}</td>
        <td>${entry.totalPrice ? entry.totalPrice.toFixed(2) : '-'}</td>
        <td class="date-column">${entry.date}</td>
        <td class="time-column">${entry.time}</td>
      `;
    } else {
      row.innerHTML = `
        <td>${entry.item}</td>
        <td>${entry.qty}</td>
        <td>${entry.person}</td>
        <td>${entry.reason || '-'}</td>
        <td class="date-column">${entry.date}</td>
        <td class="time-column">${entry.time}</td>
      `;
    }
    tbody.appendChild(row);
  });
}

function drawChart(stockLevels) {
  const ctx = document.getElementById('stockChart').getContext('2d');
  
  if (chart) {
    chart.destroy();
  }

  const labels = Object.keys(stockLevels);
  const values = Object.values(stockLevels);

  if (labels.length === 0) {
    document.getElementById('stockChart').style.display = 'none';
    return;
  }

  document.getElementById('stockChart').style.display = 'block';
  
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Current Stock',
        data: values,
        backgroundColor: '#007aff',
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

function exportToExcel() {
  const data = JSON.parse(localStorage.getItem('stockData')) || [];
  if (data.length === 0) {
    showNotification('No data to export', true);
    return;
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Prepare stock data
  const stockData = data.map(entry => ({
    Type: entry.type === 'in' ? 'Stock In' : 'Stock Out',
    Item: entry.item,
    Quantity: entry.qty,
    'Unit Price': entry.price || '',
    'Total Price': entry.totalPrice || '',
    Supplier: entry.supplier || '',
    'Received By': entry.receiver || '',
    'Taken By': entry.person || '',
    Reason: entry.reason || '',
    Note: entry.note || '',
    Date: entry.date,
    Time: entry.time
  }));

  const ws = XLSX.utils.json_to_sheet(stockData);
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory Data');
  
  // Generate and download file
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Inventory_Export_${date}.xlsx`);
  showNotification('Export completed successfully');
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  loadDashboard();
  
  // Listen for data changes
  window.addEventListener('stockDataChanged', loadDashboard);
  window.addEventListener('storage', function(e) {
    if (e.key === 'stockData' || e.key === 'stockDataUpdated') {
      loadDashboard();
    }
  });
});