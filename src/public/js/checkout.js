import { apiFetch } from "/js/api.js";
import { showNotification } from "/js/notification.js";

async function loadCheckout() {
  try {
    const data = await apiFetch("/v1/cart/data");

    if (!data.cart || data.cart.CartItems.length === 0) {
      window.location.href = "/v1/cart";
      return;
    }

    let total = 0;
    const tbody = document.getElementById("summaryBody");
    tbody.innerHTML = "";

    data.cart.CartItems.forEach(item => {
      const unitPrice = parseFloat(item.unitPrice);
      const sub = item.qty * unitPrice;
      total += sub;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.Product.title}</td>
        <td style="text-align: center;">${item.qty}</td>
        <td style="text-align: right;">₹${unitPrice.toFixed(2)}</td>
        <td style="text-align: right; font-weight: 600;">₹${sub.toFixed(2)}</td>
      `;
      tbody.appendChild(row);
    });

    document.getElementById("total").innerText =
      "₹ " + total.toFixed(2);

  } catch (err) {
    showNotification(err.message, "error");
  }
}

document.getElementById("orderForm").onsubmit = async (e) => {
  e.preventDefault();

  try {
    const formData = new FormData(e.target);

    await apiFetch("/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(formData)
    });

    window.location.href = "/v1/orders";

  } catch (err) {
    showNotification(err.message, "error");
  }
};

loadCheckout();
