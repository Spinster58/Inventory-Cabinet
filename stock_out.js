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
}

function getCurrentDateTime() {
  const now = new Date();
  return {
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

function addStockOut() {
  const item = document.getElementById("item").value.trim();
  const qty = document.getElementById("qty").value.trim();
  const person = document.getElementById("person").value.trim();
  const reason = document.getElementById("reason").value.trim();

  if (!item) return alert("Please enter an item name");
  if (!qty || isNaN(qty)) return alert("Please enter a valid quantity");
  if (!person) return alert("Please enter who took the item");

  const { date, time } = getCurrentDateTime();
  const data = getData();
  
  data.push({
    type: "out",
    item,
    qty: parseInt(qty),
    person,
    reason,
    date,
    time
  });
  
  saveData(data);
  clearForm();
  loadData();
}

function clearForm() {
  document.getElementById("item").value = "";
  document.getElementById("qty").value = "";
  document.getElementById("person").value = "";
  document.getElementById("reason").value = "";
}

function loadData() {
  const keyword = document.getElementById("search").value.toLowerCase();
  const data = getData();
  const tbody = document.querySelector("#stock-table tbody");
  tbody.innerHTML = "";

  const filteredData = data.filter(entry => {
    if (entry.type !== "out") return false;
    const line = `${entry.item} ${entry.person} ${entry.reason} ${entry.date} ${entry.time}`.toLowerCase();
    return line.includes(keyword);
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
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.item}</td>
      <td>${entry.qty}</td>
      <td>${entry.person}</td>
      <td>${entry.reason || '-'}</td>
      <td class="date-column">${entry.date}</td>
      <td class="time-column">${entry.time}</td>
      <td>
        <button class="action-btn" onclick="editStock(${i})"><i class="fas fa-edit"></i></button>
        <button class="action-btn" onclick="deleteStock(${i})"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function deleteStock(index) {
  if (!confirm("Are you sure you want to delete this entry?")) return;
  const data = getData();
  data.splice(index, 1);
  saveData(data);
  loadData();
}

function editStock(index) {
  const data = getData();
  const entry = data[index];
  if (!entry) return;

  document.getElementById("item").value = entry.item;
  document.getElementById("qty").value = entry.qty;
  document.getElementById("person").value = entry.person;
  document.getElementById("reason").value = entry.reason || '';

  deleteStock(index);
}

document.addEventListener('DOMContentLoaded', loadData);