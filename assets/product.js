/* ==========================================================
   Recently Viewed Products
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
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
