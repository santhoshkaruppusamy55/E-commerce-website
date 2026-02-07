import { apiFetch } from "/js/api.js";
import { showNotification } from "/js/notification.js";


async function loadCart() {
  try {
    const data = await apiFetch("/v1/cart/data");

    const body = document.getElementById("cartBody");
    body.innerHTML = "";
    let total = 0;

    if (!data.cart || data.cart.CartItems.length === 0) {
      body.innerHTML = "<tr><td colspan='5'>Cart is empty</td></tr>";
      document.getElementById("total").innerText = "";
      return;
    }

    data.cart.CartItems.forEach(item => {
      const sub = item.qty * item.unitPrice;
      total += sub;

      // Get product image
      const imageUrl = item.Product.ProductImages && item.Product.ProductImages.length > 0
        ? item.Product.ProductImages[0].path
        : '/images/placeholder.png';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${imageUrl}" alt="${item.Product.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
            <span>${item.Product.title}</span>
          </div>
        </td>
        <td>₹${item.unitPrice}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="number" value="${item.qty}" min="1" id="qty-${item.id}" style="width: 70px;">
            <button class="btn-cart-update" onclick="updateItem(${item.id})" title="Update quantity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          </div>
        </td>
        <td>₹${sub.toFixed(2)}</td>
        <td>
          <button class="btn-cart-remove" onclick="removeItem(${item.id})" title="Remove item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </td>
      `;
      body.appendChild(row);
    });

    document.getElementById("total").innerText = "Total: ₹ " + total;

  } catch (err) {
    showNotification(err.message, "error");
  }
}


async function updateItem(id) {
  try {
    const qty = document.getElementById(`qty-${id}`).value;

    await apiFetch(`/v1/cart/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty })
    });

    showNotification("Cart updated successfully", "success");
    loadCart();

  } catch (err) {
    showNotification(err.message, "error");
  }
}


async function removeItem(id) {
  try {
    await apiFetch(`/v1/cart/items/${id}`, {
      method: "DELETE"
    });

    showNotification("Item removed from cart", "success");
    loadCart();

  } catch (err) {
    showNotification(err.message, "error");
  }
}

async function goCheckout() {
  try {
    const data = await apiFetch("/v1/cart/data");

    if (!data.cart || !data.cart.CartItems || data.cart.CartItems.length === 0) {
      showNotification("Your cart is empty. Add items before checkout.", "error");
      return;
    }

    window.location.href = "/v1/cart/items";
  } catch (err) {
    showNotification("Failed to load cart", "error");
  }
}

window.updateItem = updateItem;
window.removeItem = removeItem;
window.goCheckout = goCheckout;

loadCart();
