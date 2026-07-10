/* ==========================================================
   Jerry Theme Quick View
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("QuickViewModal");
  const content = document.getElementById("QuickViewContent");
  const overlay = document.querySelector(".j-quick-view-overlay");
  const close = document.querySelector(".j-quick-view-close");

  if (!modal) return;

  let currentProduct = null;
  let selectedVariant = null;
  let selectedQuantity = 1;

  // -------------------------
  // Helpers
  // -------------------------

  function formatMoney(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function normalizeSrc(src) {
    if (!src) return "";

    return src
      .split("?")[0]
      .replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|original|\d+x\d*|\d*x\d+)(?=\.[a-z0-9]+$)/i, "");
  }

  function getProductImages(product) {
    if (product.media && product.media.length) {
      return product.media
        .filter((media) => media.media_type === "image")
        .map((media) => ({
          id: media.id,
          src: media.preview_image ? media.preview_image.src : media.src,
        }));
    }

    return (product.images || []).map((src, index) => ({
      id: `index-${index}`,
      src,
    }));
  }

  function findVariantByImage(src) {
    return currentProduct.variants.find(
      (v) =>
        v.featured_image &&
        normalizeSrc(v.featured_image.src) === normalizeSrc(src),
    );
  }

  function closeModal() {
    modal.classList.remove("is-open");
    content.innerHTML = "";
    currentProduct = null;
    selectedVariant = null;
    selectedQuantity = 1;
  }

  if (overlay) overlay.addEventListener("click", closeModal);
  if (close) close.addEventListener("click", closeModal);

  // -------------------------
  // Render
  // -------------------------

  function render() {
    const product = currentProduct;
    const variant = selectedVariant;

    const images = getProductImages(product);

    const mainImageEntry =
      (variant.featured_image &&
        images.find(
          (image) =>
            normalizeSrc(image.src) === normalizeSrc(variant.featured_image.src),
        )) ||
      images[0] ||
      { id: null, src: product.featured_image };

    const mainImage = mainImageEntry.src;

    const onSale = variant.compare_at_price > variant.price;

    content.innerHTML = `
      <div class="j-quick-view">

        <div class="j-quick-view__gallery">

          <div class="j-quick-view__main-image">
            <img id="QuickViewMainImage" src="${mainImage}" alt="${product.title}">
          </div>

          ${
            images.length > 1
              ? `
            <div class="j-quick-view__thumbnails">
              ${images
                .map(
                  (image, index) => `
                <button
                  type="button"
                  class="j-quick-view-thumbnail ${normalizeSrc(image.src) === normalizeSrc(mainImage) ? "is-active" : ""}"
                  data-image="${image.src}"
                >
                  <img src="${image.src}" alt="${product.title} ${index + 1}">
                </button>
              `,
                )
                .join("")}
            </div>
          `
              : ""
          }

        </div>

        <div class="j-quick-view__details">

          <h2>${product.title}</h2>

          <p class="j-quick-view__price" id="QuickViewPrice">
            <span class="${onSale ? "sale" : ""}">${formatMoney(variant.price)}</span>
            ${onSale ? `<del>${formatMoney(variant.compare_at_price)}</del>` : ""}
          </p>

          ${
            product.variants.length > 1
              ? `
            <div class="j-quick-view__variants">
              <label>${
                typeof product.options[0] === "object"
                  ? product.options[0].name
                  : product.options[0]
              }</label>
              <div class="j-quick-view__variant-buttons">
                ${product.variants
                  .map(
                    (v) => `
                  <button
                    type="button"
                    class="j-quick-view-variant-button ${v.id === variant.id ? "is-active" : ""} ${!v.available ? "is-sold-out" : ""}"
                    data-variant-id="${v.id}"
                    ${!v.available ? "disabled" : ""}
                  >
                    ${v.title}
                  </button>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }

          <div class="j-quick-view__quantity">
            <label>Quantity</label>
            <div class="j-quick-view__qty-control">
              <button type="button" class="j-quick-view-qty-minus" aria-label="Decrease quantity">−</button>
              <input type="number" id="QuickViewQty" value="${selectedQuantity}" min="1">
              <button type="button" class="j-quick-view-qty-plus" aria-label="Increase quantity">+</button>
            </div>
          </div>

          <button
            type="button"
            class="j-button j-quick-view-add"
            id="QuickViewAddButton"
            ${!variant.available ? "disabled" : ""}
          >
            ${variant.available ? "Add to Cart" : "Sold Out"}
          </button>

          <p class="j-quick-view__form-error" id="QuickViewFormError" hidden></p>

          <div class="j-quick-view__description ${product.description ? "" : "is-empty"}" id="QuickViewDescription">
            ${product.description || ""}
          </div>

          ${
            product.description && product.description.length > 220
              ? `<button type="button" class="j-quick-view-read-more">Read more</button>`
              : ""
          }

          <a href="/products/${product.handle}" class="j-quick-view__link">
            View full details
          </a>

        </div>

      </div>
    `;

    attachContentEvents();
  }

  // -------------------------
  // Content Events
  // -------------------------

  function attachContentEvents() {
    // Thumbnails
    content.querySelectorAll(".j-quick-view-thumbnail").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const matchingVariant = findVariantByImage(thumb.dataset.image);

        if (matchingVariant && matchingVariant.id !== selectedVariant.id) {
          selectedVariant = matchingVariant;
          render();
          return;
        }

        const mainImage = document.getElementById("QuickViewMainImage");
        if (mainImage) mainImage.src = thumb.dataset.image;

        content.querySelectorAll(".j-quick-view-thumbnail").forEach((t) => {
          t.classList.toggle("is-active", t === thumb);
        });
      });
    });

    // Variant buttons
    content.querySelectorAll(".j-quick-view-variant-button").forEach((button) => {
      if (button.disabled) return;

      button.addEventListener("click", () => {
        const variant = currentProduct.variants.find(
          (v) => v.id === Number(button.dataset.variantId),
        );

        if (!variant) return;

        selectedVariant = variant;
        render();
      });
    });

    // Quantity
    const qtyInput = document.getElementById("QuickViewQty");
    const qtyMinus = content.querySelector(".j-quick-view-qty-minus");
    const qtyPlus = content.querySelector(".j-quick-view-qty-plus");

    if (qtyInput) {
      qtyInput.addEventListener("change", () => {
        selectedQuantity = Math.max(1, Number(qtyInput.value) || 1);
        qtyInput.value = selectedQuantity;
      });
    }

    if (qtyMinus) {
      qtyMinus.addEventListener("click", () => {
        selectedQuantity = Math.max(1, Number(qtyInput.value) - 1);
        qtyInput.value = selectedQuantity;
      });
    }

    if (qtyPlus) {
      qtyPlus.addEventListener("click", () => {
        selectedQuantity = Number(qtyInput.value) + 1;
        qtyInput.value = selectedQuantity;
      });
    }

    // Description read more
    const readMore = content.querySelector(".j-quick-view-read-more");
    const description = document.getElementById("QuickViewDescription");

    if (readMore && description) {
      readMore.addEventListener("click", () => {
        description.classList.toggle("is-expanded");
        readMore.textContent = description.classList.contains("is-expanded")
          ? "Read less"
          : "Read more";
      });
    }

    // Add to cart
    const addButton = document.getElementById("QuickViewAddButton");
    const formError = document.getElementById("QuickViewFormError");

    if (addButton) {
      addButton.addEventListener("click", async () => {
        formError.hidden = true;
        formError.textContent = "";

        const quantity = Number(qtyInput.value) || 1;

        try {
          addButton.disabled = true;
          addButton.textContent = "Adding...";

          const response = await fetch("/cart/add.js", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items: [
                {
                  id: selectedVariant.id,
                  quantity: quantity,
                },
              ],
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.description || "Unable to add item to cart.");
          }

          closeModal();

          const cartButton = document.querySelector(".j-header__cart");
          if (cartButton) cartButton.click();
        } catch (error) {
          console.error(error);
          formError.textContent = error.message || "Unable to add item to cart.";
          formError.hidden = false;
          addButton.disabled = false;
          addButton.textContent = "Add to Cart";
        }
      });
    }
  }

  // -------------------------
  // Open
  // -------------------------

  document.querySelectorAll(".j-quick-view-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const handle = button.dataset.handle;

      try {
        const response = await fetch(`/products/${handle}.js`);
        const product = await response.json();

        currentProduct = product;
        selectedVariant =
          product.variants.find((v) => v.available) || product.variants[0];

        render();

        modal.classList.add("is-open");
      } catch (error) {
        console.error(error);
      }
    });
  });
});
