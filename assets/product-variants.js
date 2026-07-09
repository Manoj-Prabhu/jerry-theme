/* ==========================================================
   Jerry Theme Product Variants
========================================================== */
console.log("product-variant.js loaded");
document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".j-product__variant-button");
  const variantInput = document.getElementById("SelectedVariant");
  const price = document.getElementById("ProductPrice");
  const mainImage = document.getElementById("ProductMainImage");

  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((item) => {
        item.classList.remove("is-active");
      });

      button.classList.add("is-active");

      variantInput.value = button.dataset.variantId;

      if (price) {
        price.textContent = button.dataset.price;
      }

      if (mainImage && button.dataset.image) {
        mainImage.src = button.dataset.image;
        mainImage.srcset = "";
      }
    });
  });
});
