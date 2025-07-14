function loadDashboard() {
  const data = JSON.parse(localStorage.getItem('stockData')) || [];
  let totalIn = 0, totalOut = 0;
  const itemCounts = {};
  const stockLevels = {};
  const recentIn = [];
  const recentOut = [];

  data.forEach(entry => {
    const item = entry.item.toLowerCase();
    itemCounts[item] = (itemCounts[item] || 0) + 1;

    if (entry.type === "in") {
      totalIn += parseFloat(entry.qty);
      stockLevels[item] = (stockLevels[item] || 0) + parseFloat(entry.qty);
      recentIn.push(entry);
    } else if (entry.type === "out") {
      totalOut += parseFloat(entry.qty);
      stockLevels[item] = (stockLevels[item] || 0) - parseFloat(entry.qty);
      recentOut.push(entry);
    }
  });

  // Update summary
  document.getElementById("total-in").textContent = totalIn;
  document.getElementById("total-out").textContent = totalOut;

  const mostFrequent = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("most-item").textContent = mostFrequent ? mostFrequent[0] : "-";

  // Update stock levels table
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

  // Sort and show recent transactions
  recentIn.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  recentOut.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

  updateRecentTable('recent-in-table', recentIn.slice(0, 5));
  updateRecentTable('recent-out-table', recentOut.slice(0, 5));

  drawChart(stockLevels);
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

let chart;

function drawChart(stockLevels) {
  const ctx = document.getElementById('stockChart').getContext('2d');
  const labels = Object.keys(stockLevels);
  const values = Object.values(stockLevels);

  if (chart) chart.destroy();

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
  
  // Prepare stock in data
  const stockInData = data.filter(entry => entry.type === "in").map(entry => ({
    'Type': 'Stock In',
    'Item': entry.item,
    'Quantity': entry.qty,
    'Unit Price': entry.price,
    'Total Price': entry.totalPrice,
    'Supplier': entry.supplier,
    'Note': entry.note || '',
    'Date': entry.date,
    'Time': entry.time
  }));

  // Prepare stock out data
  const stockOutData = data.filter(entry => entry.type === "out").map(entry => ({
    'Type': 'Stock Out',
    'Item': entry.item,
    'Quantity': entry.qty,
    'Taken By': entry.person,
    'Reason': entry.reason || '',
    'Date': entry.date,
    'Time': entry.time
  }));

  if (stockInData.length === 0 && stockOutData.length === 0) {
    alert("No data to export");
    return;
  }

  const wb = XLSX.utils.book_new();
  
  if (stockInData.length > 0) {
    const wsIn = XLSX.utils.json_to_sheet(stockInData);
    XLSX.utils.book_append_sheet(wb, wsIn, 'Stock In');
  }
  
  if (stockOutData.length > 0) {
    const wsOut = XLSX.utils.json_to_sheet(stockOutData);
    XLSX.utils.book_append_sheet(wb, wsOut, 'Stock Out');
  }

  XLSX.writeFile(wb, 'inventory_report.xlsx');
}

document.addEventListener('DOMContentLoaded', loadDashboard);

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('isAuthenticated') !== 'true') {
    window.location.href = 'index.html'; // or 'login.html'
  }
});
