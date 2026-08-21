document.addEventListener("DOMContentLoaded", () => {
  const optionsWrap = document.getElementById("ProductOptions");
  const variantsJson = document.getElementById("ProductVariantsJson");
  const purchaseOptionsWrap = document.getElementById("ProductPurchaseOptions");

  if (!variantsJson) return;

  const variants = JSON.parse(variantsJson.textContent);
  const optionButtons = optionsWrap
    ? optionsWrap.querySelectorAll(".j-product__swatch, .j-product__pill")
    : [];
  const variantInput = document.getElementById("SelectedVariant");
  const price = document.getElementById("ProductPrice");
  const unitPrice = document.getElementById("ProductUnitPrice");
  const stickyPrice = document.getElementById("StickyPrice");
  const addToCartButton = document.getElementById("AddToCartButton");
  const stickyButton = document.getElementById("StickyAddToCart");
  const comparePrice = document.getElementById("ProductComparePrice");
  const inventoryStatus = document.getElementById("ProductInventoryStatus");
  const pickupAvailability = document.getElementById(
    "ProductPickupAvailability",
  );
  const quantityInput = document.getElementById("Quantity");
  const sellingPlanInput = document.getElementById("SelectedSellingPlan");
  const LOW_STOCK_THRESHOLD = 3;

  let currentVariant =
    variants.find((variant) => variant.id === Number(variantInput.value)) ||
    variants[0];

  function getSelectedSellingPlanId() {
    if (!purchaseOptionsWrap) return null;

    const checked = purchaseOptionsWrap.querySelector(
      'input[name="purchase_option"]:checked',
    );

    if (!checked || checked.value === "one_time") return null;

    const select = purchaseOptionsWrap.querySelector(
      `[data-selling-plan-group="${checked.value}"]`,
    );

    return select ? select.value : null;
  }

  function updatePriceDisplay() {
    const planId = getSelectedSellingPlanId();

    if (sellingPlanInput) {
      sellingPlanInput.disabled = !planId;
      sellingPlanInput.value = planId || "";
    }

    const planPrice =
      planId && currentVariant.sellingPlanAllocations
        ? currentVariant.sellingPlanAllocations[planId]
        : null;

    const displayPrice = planPrice || currentVariant.price;

    if (price) price.textContent = displayPrice;
    if (stickyPrice) stickyPrice.textContent = displayPrice;

    if (comparePrice) {
      comparePrice.hidden = Boolean(planId) || !currentVariant.compareAtPrice;
    }
  }

  if (purchaseOptionsWrap) {
    purchaseOptionsWrap.addEventListener("change", (event) => {
      if (event.target.matches('input[name="purchase_option"]')) {
        purchaseOptionsWrap
          .querySelectorAll(".j-product__selling-plan-select")
          .forEach((select) => {
            select.disabled = select.dataset.sellingPlanGroup !== event.target.value;
          });

        purchaseOptionsWrap
          .querySelectorAll(".j-product__purchase-option")
          .forEach((label) => {
            const radio = label.querySelector('input[name="purchase_option"]');
            label.classList.toggle("is-active", radio.checked);
          });
      }

      updatePriceDisplay();
    });
  }

  if (!optionButtons.length) {
    updatePriceDisplay();
    return;
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

  // The pickup availability shown on first paint is server-rendered for
  // whichever variant loaded the page (see product.liquid) — it never
  // updates on its own once a shopper picks a different variant here, so
  // this has to re-render it from the same store-availability data each
  // variant carries in #ProductVariantsJson.
  function updatePickupAvailability(variant) {
    if (!pickupAvailability) return;

    if (!variant.hasPickup) {
      pickupAvailability.hidden = true;
      return;
    }

    const strings = window.themeStrings || {};
    const template = variant.pickupAvailable
      ? strings.pickupAvailableHtml || "Pickup available at __LOCATION__"
      : strings.pickupUnavailableHtml ||
        "Pickup currently unavailable at __LOCATION__";

    const message = pickupAvailability.querySelector("p");
    if (message) {
      message.textContent = template.replace(
        "__LOCATION__",
        variant.pickupLocation || "",
      );
    }

    pickupAvailability.hidden = false;
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
    currentVariant = variant;
    variantInput.value = variant.id;

    updateInventoryStatus(variant);
    updatePickupAvailability(variant);
    updateQuantityLimit(variant);

    if (comparePrice) {
      comparePrice.textContent = variant.compareAtPrice || "";
    }

    updatePriceDisplay();

    if (unitPrice) {
      unitPrice.textContent = variant.unitPrice;
      unitPrice.hidden = !variant.unitPrice;
    }

    if (variant.featuredMediaId) {
      const gallery = document.querySelector(".j-product__gallery");

      if (gallery && typeof gallery.activateMedia === "function") {
        gallery.activateMedia(String(variant.featuredMediaId));
      }
    }

    [addToCartButton, stickyButton].forEach((button) => {
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

        if (stickyButton) stickyButton.disabled = true;

        if (inventoryStatus) {
          inventoryStatus.hidden = true;
        }

        if (pickupAvailability) {
          pickupAvailability.hidden = true;
        }
      }

      updateAvailability();
    });
  });

  updateAvailability();
});
