let cart = [];

let orderLogsByDate = JSON.parse(localStorage.getItem("orderLogsByDate")) || {};

let isAdmin = false;
let adminName = "Corpuz";

let currentDate = getToday();

/* =========================
   DATE
========================= */

function getToday() {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

/* =========================
   CLOCK
========================= */

setInterval(() => {
  const clock = document.getElementById("clock");
  if (clock) clock.textContent = new Date().toLocaleString();
}, 1000);

/* =========================
   ADMIN LOGIN
========================= */

function adminLogin() {
  const user = prompt("Username:");
  const pass = prompt("Password:");

  const status = document.getElementById("login-status");

  if (user === "corpuz" && pass === "0429") {
    isAdmin = true;

    if (status) {
      status.textContent = "Logged in successfully";
      status.style.color = "green";

      setTimeout(() => {
        status.textContent = "";
      }, 2500);
    }

    renderAdminUI();
    renderLogs();
  } else {
    isAdmin = false;

    if (status) {
      status.textContent = "Wrong credentials. Please try again.";
      status.style.color = "red";
    }
  }
}

/* =========================
   ADMIN UI
========================= */

function renderAdminUI() {
  const btn = document.getElementById("admin-btn");
  const status = document.getElementById("login-status");

  if (!btn) return;

  if (isAdmin) {
    btn.textContent = `Welcome, ${adminName}!`;
    btn.disabled = true;

    btn.style.pointerEvents = "none";
    btn.style.opacity = "0.8";
    btn.style.cursor = "default";
    btn.style.background = "#2e7d32";

    if (status) status.textContent = "";
  } else {
    btn.textContent = "Admin Login";
    btn.disabled = false;
    btn.onclick = adminLogin;

    btn.style.pointerEvents = "auto";
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
    btn.style.background = "#d32f2f";
  }
}

/* =========================
   TOTAL CALCULATION
========================= */

function calculateTotal() {
  return cart.reduce((sum, item) => sum + item.price, 0);
}

function updateTotalUI() {
  const totalBox = document.getElementById("total");
  if (totalBox) {
    totalBox.textContent = calculateTotal();
  }

  updateChange();
}

/* =========================
   CHANGE CALCULATION
========================= */

function updateChange() {
  const cashEl = document.getElementById("cash");
  const changeEl = document.getElementById("change");

  if (!cashEl || !changeEl) return;

  const cash = Number(cashEl.value) || 0;
  const total = calculateTotal();

  const change = cash - total;

  changeEl.textContent = change > 0 ? change : 0;
}

document.addEventListener("input", function (e) {
  if (e.target && e.target.id === "cash") {
    updateChange();
  }
});

/* =========================
   CART
========================= */

function addToCart(name, price) {
  const status = document.getElementById("login-status");

  if (!isAdmin) {
    if (status) {
      status.textContent = "⚠ Please login first before adding items.";
      status.style.color = "red";

      setTimeout(() => {
        status.textContent = "";
      }, 2000);
    }
    return;
  }

  cart.push({ name, price: Number(price) });

  updateCart();
}

/* =========================
   CART UI
========================= */

function updateCart() {
  const cartBox = document.getElementById("cart-items");

  if (!cartBox) return;

  cartBox.innerHTML = "";

  cart.forEach(item => {
    const div = document.createElement("div");
    div.className = "cart-item";
    div.textContent = `${item.name} - ₱${item.price}`;
    cartBox.appendChild(div);
  });

  updateTotalUI();
}

/* =========================
   CHECKOUT
========================= */

function checkout(method) {
  if (cart.length === 0) return;

  const name = prompt("Customer Name:");
  const address = prompt("Address:");
  if (!name || !address) return;

  const cashInput = document.getElementById("cash");
  const cash = Number(cashInput?.value) || 0;

  const total = calculateTotal();

  // BLOCK IF NO CASH
  if (!cash || cash <= 0) {
    alert("Please enter cash before selecting payment.");
    return;
  }

  // BLOCK IF INSUFFICIENT CASH
  if (cash < total) {
    alert("Insufficient cash.");
    return;
  }

  const change = cash - total;

  const orderDate = getToday();
  const orderTime = new Date().toLocaleString();

  const receiptCart = [...cart];
  const itemsSummary = groupItems(cart);

  openReceipt(
    name,
    address,
    method,
    cash,
    change,
    receiptCart,
    itemsSummary,
    total,
    orderDate,
    orderTime
  );

  if (!orderLogsByDate[currentDate]) {
    orderLogsByDate[currentDate] = [];
  }

  orderLogsByDate[currentDate].push({
    id: Date.now(),
    name,
    address,
    method,
    total,
    cash,
    change,
    time: orderTime,
    items: receiptCart,
    summary: itemsSummary
  });

  localStorage.setItem("orderLogsByDate", JSON.stringify(orderLogsByDate));

  cart = [];

  updateCart();
  renderLogs();
}

/* =========================
   RECEIPT
========================= */

function openReceipt(name, address, method, cash, change, items, summary, totalAmount, orderDate, orderTime) {

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 350;
  canvas.height = 520 + items.length * 25;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000";
  ctx.font = "14px Arial";

  let y = 30;

  ctx.fillText("RECEIPT", 130, y);
  y += 30;

  ctx.fillText(`Date: ${orderDate}`, 10, y); y += 20;
  ctx.fillText(`Time: ${orderTime}`, 10, y); y += 20;

  ctx.fillText(`Name: ${name}`, 10, y); y += 20;
  ctx.fillText(`Address: ${address}`, 10, y); y += 20;
  ctx.fillText(`Payment: ${method.toUpperCase()}`, 10, y); y += 20;

  ctx.fillText("Items:", 10, y);
  y += 20;

  items.forEach(item => {
    ctx.fillText(`${item.name} - ₱${item.price}`, 20, y);
    y += 20;
  });

  y += 10;

  ctx.fillText(`Total: ₱${totalAmount}`, 10, y); y += 20;
  ctx.fillText(`Cash: ₱${cash}`, 10, y); y += 20;
  ctx.fillText(`Change: ₱${change}`, 10, y); y += 20;

  ctx.fillText("Thank you!", 120, y);

  const link = document.createElement("a");
  link.download = `receipt_${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/* =========================
   GROUP ITEMS
========================= */

function groupItems(items) {
  const obj = {};

  items.forEach(i => {
    obj[i.name] = (obj[i.name] || 0) + 1;
  });

  return Object.entries(obj)
    .map(([name, qty]) => `• ${name}: ${qty}`)
    .join("<br>");
}

/* =========================
   LOGS
========================= */

function renderLogs() {
  const logDiv = document.getElementById("order-log");
  const dateEl = document.getElementById("log-date");
  const totalEl = document.getElementById("daily-total");

  if (!logDiv || !dateEl) return;

  const logs = orderLogsByDate[currentDate] || [];

  dateEl.textContent = currentDate;
  logDiv.innerHTML = "";

  let dailyTotal = 0;

  logs.forEach(l => {
    dailyTotal += l.total;

    const div = document.createElement("div");
    div.className = "log-entry";

    div.innerHTML = `
      <b>${l.name}</b><br>
      ₱${l.total} | ${l.method}<br>
      ${l.time}<br>
      <div>${l.summary}</div>

      <button onclick="deleteOrder(${l.id})">Delete</button>
    `;

    logDiv.appendChild(div);
  });

  if (totalEl) {
    totalEl.textContent = "Daily Sales: ₱" + dailyTotal;
  }
}

/* =========================
   DELETE ORDER
========================= */

function deleteOrder(id) {
  if (!isAdmin) return;

  let logs = orderLogsByDate[currentDate] || [];
  logs = logs.filter(l => l.id !== id);

  orderLogsByDate[currentDate] = logs;

  localStorage.setItem("orderLogsByDate", JSON.stringify(orderLogsByDate));

  renderLogs();
}

/* =========================
   INIT
========================= */

updateCart();
renderLogs();