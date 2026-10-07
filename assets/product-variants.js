function initProductVariants() {
  const optionsWrap = document.getElementById("ProductOptions");
  const variantJson = document.getElementById("ProductVariantJson");
  const purchaseOptionsWrap = document.getElementById("ProductPurchaseOptions");

  if (!variantJson) return;

  // Only the selected variant is in the page. Other variants are fetched one
  // selection at a time by re-rendering this section (Section Rendering API),
  // so the picker works the same for a handful of variants or thousands.
  const sectionId = variantJson.dataset.sectionId;
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
  const skuDisplay = document.getElementById("ProductSku");
  const quantityInput = document.getElementById("Quantity");
  const sellingPlanInput = document.getElementById("SelectedSellingPlan");
  const LOW_STOCK_THRESHOLD = 3;

  let currentVariant = JSON.parse(variantJson.textContent);

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
            select.disabled =
              select.dataset.sellingPlanGroup !== event.target.value;
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

  const stateCache = new Map();
  let latestRequest = 0;
  let abortController = null;

  function selectedOptionValueIds() {
    return Array.from(optionButtons)
      .filter((button) => button.classList.contains("is-active"))
      .map((button) => button.dataset.optionValueId)
      .filter(Boolean);
  }

  // Reads the selected variant and each option value's state out of a
  // server-rendered copy of this section.
  function readSectionState(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const json = doc.getElementById("ProductVariantJson");
    const buttons = {};

    doc
      .querySelectorAll("#ProductOptions [data-option-value-id]")
      .forEach((button) => {
        buttons[button.dataset.optionValueId] = {
          soldOut: button.classList.contains("is-sold-out"),
          mediaId: button.dataset.mediaId || "",
        };
      });

    return { variant: json ? JSON.parse(json.textContent) : null, buttons };
  }

  async function fetchSectionState(optionValueIds) {
    const key = optionValueIds.join(",");

    if (stateCache.has(key)) return stateCache.get(key);

    if (abortController) abortController.abort();
    abortController = new AbortController();

    const response = await fetch(
      `${window.location.pathname}?section_id=${encodeURIComponent(sectionId)}&option_values=${key}`,
      { signal: abortController.signal },
    );

    if (!response.ok)
      throw new Error(`Section request failed: ${response.status}`);

    const state = readSectionState(await response.text());
    stateCache.set(key, state);

    return state;
  }

  function setLoading(isLoading) {
    if (optionsWrap) optionsWrap.setAttribute("aria-busy", String(isLoading));

    if (!isLoading) return;

    // Nothing can be added to the cart until the new selection is known.
    [addToCartButton, stickyButton].forEach((button) => {
      if (button) button.disabled = true;
    });
  }

  function syncOptionButtons(buttonStates) {
    optionButtons.forEach((button) => {
      const state = buttonStates[button.dataset.optionValueId];

      if (!state) return;

      button.classList.toggle("is-sold-out", state.soldOut);
      button.dataset.mediaId = state.mediaId;
    });
  }

  function markUnavailable() {
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

  async function updateSelection() {
    const optionValueIds = selectedOptionValueIds();
    const request = ++latestRequest;

    setLoading(true);

    let state;

    try {
      state = await fetchSectionState(optionValueIds);
    } catch (error) {
      if (error.name === "AbortError" || request !== latestRequest) return;

      // Fall back to a full page load of the same selection.
      window.location.assign(
        `${window.location.pathname}?option_values=${optionValueIds.join(",")}`,
      );
      return;
    }

    if (request !== latestRequest) return;

    setLoading(false);

    const matchesSelection =
      state.variant &&
      state.variant.options.every(
        (value, index) => value === selectedOptions[index],
      );

    if (matchesSelection) {
      selectVariant(state.variant);
    } else {
      markUnavailable();
    }

    syncOptionButtons(state.buttons);
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
    variantInput.dispatchEvent(new Event("change", { bubbles: true }));

    updateInventoryStatus(variant);
    updatePickupAvailability(variant);
    updateQuantityLimit(variant);

    if (skuDisplay) {
      const strings = window.themeStrings || {};
      skuDisplay.hidden = !variant.sku;
      skuDisplay.textContent = variant.sku
        ? `${strings.sku || "SKU"}: ${variant.sku}`
        : "";
    }

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
      // Combined listings: an option value that belongs to a sibling product
      // carries that product's URL, so selecting it opens that product.
      const siblingUrl = button.dataset.productUrl;

      if (siblingUrl && siblingUrl !== window.location.pathname) {
        window.location.assign(siblingUrl);
        return;
      }

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

      updateSelection();
    });
  });
}

document.addEventListener("DOMContentLoaded", initProductVariants);

document.addEventListener("shopify:section:load", (event) => {
  if (event.target.querySelector("#ProductVariantJson")) {
    initProductVariants();
  }
});
