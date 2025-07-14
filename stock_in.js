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

function addStock() {
  const item = document.getElementById("item").value.trim();
  const qty = parseFloat(document.getElementById("qty").value.trim());
  const price = parseFloat(document.getElementById("price").value.trim());
  const totalPrice = parseFloat(document.getElementById("total-price").value.trim());
  const supplier = document.getElementById("supplier").value.trim();
  const note = document.getElementById("note").value.trim();

  if (!item) return alert("Please enter an item name");
  if (!qty || isNaN(qty)) return alert("Please enter a valid quantity");
  if (!price || isNaN(price)) return alert("Please enter a valid price");
  if (!supplier) return alert("Please enter supplier name");

  const { date, time } = getCurrentDateTime();
  const data = getData();
  
  data.push({
    type: "in",
    item,
    qty,
    price,
    totalPrice,
    supplier,
    note,
    date,
    time
  });
  
  saveData(data);
  clearForm();
  loadData();
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
  document.getElementById("note").value = "";
}

function loadData() {
  const keyword = document.getElementById("search").value.toLowerCase();
  const data = getData();
  const tbody = document.querySelector("#stock-table tbody");
  tbody.innerHTML = "";

  const filteredData = data.filter(entry => {
    if (entry.type !== "in") return false;
    const line = `${entry.item} ${entry.supplier} ${entry.note} ${entry.date} ${entry.time}`.toLowerCase();
    return line.includes(keyword);
  });

  if (filteredData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">No stock in records found</td>
      </tr>
    `;
    return;
  }

  filteredData.forEach((entry, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.item}</td>
      <td>${entry.qty}</td>
      <td>${entry.price ? entry.price.toFixed(2) : '-'}</td>
      <td>${entry.totalPrice ? entry.totalPrice.toFixed(2) : '-'}</td>
      <td>${entry.supplier}</td>
      <td>${entry.note || '-'}</td>
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
  document.getElementById("price").value = entry.price;
  document.getElementById("total-price").value = entry.totalPrice;
  document.getElementById("supplier").value = entry.supplier;
  document.getElementById("note").value = entry.note || '';

  deleteStock(index);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("qty").addEventListener("input", calculateTotal);
  document.getElementById("price").addEventListener("input", calculateTotal);
  loadData();
});