import { apiFetch } from "/js/api.js";
import { showNotification } from "/js/notification.js";

const id = location.pathname.split("/").pop();

async function loadProduct() {
  try {
    const p = await apiFetch("/v1/products/api/" + id);

    if (!p) return;

    document.getElementById("image").src =
      p.ProductImages.length ? p.ProductImages[0].path : "";

    document.getElementById("title").innerText = p.title;
    document.getElementById("price").innerText = "₹ " + p.price;
    document.getElementById("category").innerText = p.Category.name;
    document.getElementById("stock").innerText =
      p.qtyAvailable > 0
        ? `In stock (${p.qtyAvailable})`
        : "Out of stock";

    document.getElementById("desc").innerText = p.description || "";

  } catch (err) {
    console.error("Load product failed:", err);
    window.location.href = "/v1/products";
  }
}

loadProduct();

// Update cart count helper
async function updateCartCount() {
  try {
    const data = await apiFetch("/v1/cart/count");
    const el = document.getElementById("cartCount");
    if (el) el.innerText = data.count;
  } catch (e) { }
}

document.getElementById("cartForm").addEventListener("submit", async e => {
  e.preventDefault();

  const qty = document.getElementById("qty").value;

  try {
    await apiFetch("/v1/cart/items", {
      method: "POST",
      body: JSON.stringify({
        productId: id,
        qty
      })
    });

    showNotification("Item added to cart", "success");
    updateCartCount();

  } catch (err) {
    console.error("Add to cart failed:", err);
  }
});
