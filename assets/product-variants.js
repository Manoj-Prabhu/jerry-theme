/* ==========================================================
   Jerry Theme Product Variants
========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".j-product__variant-button");
  const variantInput = document.getElementById("SelectedVariant");
  const price = document.getElementById("ProductPrice");
  const mainImage = document.getElementById("ProductMainImage");
  const addToCartButton = document.getElementById("AddToCartButton");

  if (!buttons.length) return;

  buttons.forEach((button) => {
    if (button.disabled) return;

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

        if (button.dataset.hasOwnImage === "true") {
          document.querySelectorAll(".j-product-thumbnail").forEach((thumbnail) => {
            thumbnail.classList.toggle(
              "is-active",
              thumbnail.dataset.image === button.dataset.image,
            );
          });
        }
      }

      if (addToCartButton) {
        const isAvailable = button.dataset.available === "true";

        addToCartButton.disabled = !isAvailable;
        addToCartButton.textContent = isAvailable ? "Add to Cart" : "Sold Out";
      }
    });
  });
});
