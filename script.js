const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data.json');

// Load existing items
window.onload = () => {
  if (fs.existsSync(dataFile)) {
    const data = JSON.parse(fs.readFileSync(dataFile));
    data.forEach(addToList);
  }
};

function addItem() {
  const item = document.getElementById('item').value;
  const qty = document.getElementById('qty').value;
  const person = document.getElementById('person').value;

  if (!item || !qty || !person) {
    return alert("Fill in all fields");
  }

  const entry = { item, qty, person, date: new Date().toLocaleString() };

  // Save to JSON file
  let data = [];
  if (fs.existsSync(dataFile)) {
    data = JSON.parse(fs.readFileSync(dataFile));
  }
  data.push(entry);
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

  addToList(entry);

  // Clear input fields
  document.getElementById('item').value = '';
  document.getElementById('qty').value = '';
  document.getElementById('person').value = '';
}

function addToList(entry) {
  const li = document.createElement('li');
  li.textContent = `${entry.item} | Qty: ${entry.qty} | By: ${entry.person} | ${entry.date}`;
  document.getElementById('stock-list').appendChild(li);
}
