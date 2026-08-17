function initProductQuantityStepper() {
  const control = document.querySelector(".j-product__qty-control");
  if (!control) return;

  const input = control.querySelector("input[type='number']");
  const minus = control.querySelector(".j-product__qty-minus");
  const plus = control.querySelector(".j-product__qty-plus");
  if (!input || !minus || !plus) return;

  function step(delta) {
    const min = Number(input.min) || 1;
    const max = input.max ? Number(input.max) : Infinity;
    const next = (Number(input.value) || min) + delta;

    input.value = Math.min(Math.max(next, min), max);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  minus.addEventListener("click", () => step(-1));
  plus.addEventListener("click", () => step(1));
}

document.addEventListener("DOMContentLoaded", () => {
  initProductQuantityStepper();

  const productContainer = document.querySelector(".j-product");
  if (!productContainer) return;
  const handle = window.location.pathname.split("/products/")[1];
  if (!handle) return;
  const STORAGE_KEY = "jerry-recently-viewed";
  let products = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  // Remove duplicate
  products = products.filter((item) => item !== handle);
  // Add current product first
  products.unshift(handle);
  // Keep only last 8
  products = products.slice(0, 4);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
});
