document.addEventListener("DOMContentLoaded", () => {
  const optionsWrap = document.getElementById("ProductOptions");
  const variantsJson = document.getElementById("ProductVariantsJson");

  if (!optionsWrap || !variantsJson) return;

  const variants = JSON.parse(variantsJson.textContent);
  const optionButtons = optionsWrap.querySelectorAll(
    ".j-product__swatch, .j-product__pill",
  );
  const variantInput = document.getElementById("SelectedVariant");
  const price = document.getElementById("ProductPrice");
  const stickyPrice = document.getElementById("StickyPrice");
  const mainImage = document.getElementById("ProductMainImage");
  const addToCartButton = document.getElementById("AddToCartButton");
  const buyNowButton = document.getElementById("BuyNowButton");
  const stickyButton = document.getElementById("StickyAddToCart");
  const inventoryStatus = document.getElementById("ProductInventoryStatus");
  const quantityInput = document.getElementById("Quantity");
  const LOW_STOCK_THRESHOLD = 3;

  if (!optionButtons.length) return;

  function normalizeImageUrl(url) {
    try {
      const parsed = new URL(url, window.location.href);
      return parsed.pathname + parsed.search;
    } catch (error) {
      return url;
    }
  }

  const selectedOptions = [];

  optionButtons.forEach((button) => {
    if (button.classList.contains("is-active")) {
      selectedOptions[Number(button.dataset.optionIndex)] =
        button.dataset.value;
    }
  });

  function findVariant(options) {
    return variants.find((variant) =>
      variant.options.every((value, index) => value === options[index]),
    );
  }

  function updateAvailability() {
    optionButtons.forEach((button) => {
      const index = Number(button.dataset.optionIndex);
      const testOptions = selectedOptions.slice();

      testOptions[index] = button.dataset.value;

      const isAvailable = variants.some(
        (variant) =>
          variant.available &&
          variant.options.every(
            (value, i) => testOptions[i] === undefined || value === testOptions[i],
          ),
      );

      button.classList.toggle("is-sold-out", !isAvailable);
    });
  }

  function updateInventoryStatus(variant) {
    if (!inventoryStatus) return;

    const isLowStock =
      variant.inventoryManagement === "shopify" &&
      variant.inventoryQuantity > 0 &&
      variant.inventoryQuantity < LOW_STOCK_THRESHOLD;

    if (isLowStock) {
      inventoryStatus.textContent = `Only ${variant.inventoryQuantity} left in stock`;
      inventoryStatus.hidden = false;
    } else {
      inventoryStatus.textContent = "";
      inventoryStatus.hidden = true;
    }
  }

  function updateQuantityLimit(variant) {
    if (!quantityInput) return;

    const isLimited =
      variant.inventoryManagement === "shopify" &&
      variant.inventoryPolicy === "deny";

    if (isLimited) {
      const max = Math.max(0, variant.inventoryQuantity);

      quantityInput.max = String(max);

      if (Number(quantityInput.value) > max) {
        quantityInput.value = String(Math.max(1, max));
      }
    } else {
      quantityInput.removeAttribute("max");
    }
  }

  function selectVariant(variant) {
    variantInput.value = variant.id;

    updateInventoryStatus(variant);
    updateQuantityLimit(variant);

    if (price) {
      price.textContent = variant.price;
    }

    if (stickyPrice) {
      stickyPrice.textContent = variant.price;
    }

    if (mainImage && variant.image) {
      mainImage.src = variant.image;
      mainImage.srcset = "";

      const targetImage = normalizeImageUrl(variant.image);

      document.querySelectorAll(".j-product-thumbnail").forEach((thumbnail) => {
        thumbnail.classList.toggle(
          "is-active",
          normalizeImageUrl(thumbnail.dataset.image) === targetImage,
        );
      });
    }

    [addToCartButton, buyNowButton, stickyButton].forEach((button) => {
      if (button) {
        button.disabled = !variant.available;
      }
    });

    if (addToCartButton) {
      const strings = window.themeStrings || {};
      addToCartButton.textContent = variant.available
        ? strings.addToCart || "Add to Cart"
        : strings.soldOut || "Sold Out";
    }
  }

  optionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.optionIndex);
      const group = button.closest(".j-product__swatches, .j-product__pills");

      selectedOptions[index] = button.dataset.value;

      group
        .querySelectorAll(".j-product__swatch, .j-product__pill")
        .forEach((item) => {
          item.classList.remove("is-active");
          item.setAttribute("aria-pressed", "false");
        });

      button.classList.add("is-active");
      button.setAttribute("aria-pressed", "true");

      const optionValueLabel = button
        .closest(".j-product__option")
        .querySelector(".j-product__option-value");

      if (optionValueLabel) {
        optionValueLabel.textContent = button.dataset.value;
      }

      const variant = findVariant(selectedOptions);

      if (variant) {
        selectVariant(variant);
      } else {
        if (addToCartButton) {
          addToCartButton.disabled = true;
          addToCartButton.textContent =
            (window.themeStrings && window.themeStrings.unavailable) ||
            "Unavailable";
        }

        [buyNowButton, stickyButton].forEach((button) => {
          if (button) button.disabled = true;
        });

        if (inventoryStatus) {
          inventoryStatus.hidden = true;
        }
      }

      updateAvailability();
    });
  });

  updateAvailability();
});
