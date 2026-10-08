document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("QuickViewModal");
  const content = document.getElementById("QuickViewContent");
  const overlay = document.querySelector(".j-quick-view-overlay");
  const close = document.querySelector(".j-quick-view-close");

  if (!modal) return;

  let currentProduct = null;
  let selectedVariant = null;
  let selectedQuantity = 1;
  let lastFocusedTrigger = null;
  let mascotInstance = null;

  function cleanupMascot() {
    if (mascotInstance) {
      mascotInstance.cleanup();
      mascotInstance = null;
    }
  }

  function getFocusableElements() {
    return Array.from(
      modal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null);
  }

  function trapFocus(event) {
    if (event.key === "Escape") {
      closeModal();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusableElements();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // -------------------------
  // Helpers
  // -------------------------

  const formatMoney = window.formatMoney;

  function normalizeSrc(src) {
    if (!src) return "";

    return src
      .split("?")[0]
      .replace(
        /_(?:pico|icon|thumb|small|compact|medium|large|grande|original|\d+x\d*|\d*x\d+)(?=\.[a-z0-9]+$)/i,
        "",
      );
  }

  function getProductMedia(product) {
    if (product.media && product.media.length) {
      return product.media.map((media) => ({
        id: media.id,
        mediaType: media.media_type,
        src: media.preview_image ? media.preview_image.src : media.src,
        alt: media.alt,
        sources: media.sources || [],
        host: media.host,
        externalId: media.external_id,
      }));
    }

    return (product.images || []).map((src, index) => ({
      id: `index-${index}`,
      mediaType: "image",
      src,
    }));
  }

  let modelViewerFeaturePromise = null;

  function loadModelViewerFeature() {
    if (modelViewerFeaturePromise) return modelViewerFeaturePromise;

    modelViewerFeaturePromise = new Promise((resolve, reject) => {
      if (
        !window.Shopify ||
        typeof window.Shopify.loadFeatures !== "function"
      ) {
        reject(new Error("[quick-view] Shopify.loadFeatures unavailable"));
        return;
      }

      window.Shopify.loadFeatures([
        {
          name: "model-viewer-ui",
          version: "1.0",
          onLoad: (errors) => (errors ? reject(errors) : resolve()),
        },
      ]);
    });

    return modelViewerFeaturePromise;
  }

  function renderMainMedia(media, fallbackAlt) {
    if (!media || !media.src) {
      return `
        <div id="QuickViewMainImage" class="j-quick-view__main-placeholder" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="8" cy="10" r="1.5" fill="currentColor"/>
            <path d="M4 17l5-5 3 3 4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      `;
    }

    if (media.mediaType === "video" && media.sources.length) {
      const sourcesHtml = media.sources
        .map(
          (source) => `<source src="${source.url}" type="${source.mime_type}">`,
        )
        .join("");

      return `
        <video
          id="QuickViewMainImage"
          class="j-quick-view__main-video"
          controls
          controlslist="nodownload"
          playsinline
          poster="${window.JerryResizeImageUrl(media.src, 600)}"
        >
          ${sourcesHtml}
        </video>
      `;
    }

    if (
      media.mediaType === "external_video" &&
      media.host &&
      media.externalId
    ) {
      const embedUrl =
        media.host === "vimeo"
          ? `https://player.vimeo.com/video/${media.externalId}`
          : `https://www.youtube.com/embed/${media.externalId}`;

      return `
        <div class="j-quick-view__main-embed" id="QuickViewMainImage">
          <iframe
            src="${embedUrl}"
            title="${media.alt || fallbackAlt || ""}"
            frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      `;
    }

    if (media.mediaType === "model" && media.sources.length) {
      const modelSource =
        media.sources.find((source) => source.format === "glb") ||
        media.sources[0];

      return `
        <model-viewer
          id="QuickViewMainImage"
          class="j-quick-view__main-model"
          src="${modelSource.url}"
          poster="${window.JerryResizeImageUrl(media.src, 600)}"
          camera-controls
          ar
        ></model-viewer>
      `;
    }

    return `
      <img
        id="QuickViewMainImage"
        src="${window.JerryResizeImageUrl(media.src, 600)}"
        srcset="${[300, 450, 600, 800].map((width) => `${window.JerryResizeImageUrl(media.src, width)} ${width}w`).join(", ")}"
        sizes="(max-width: 700px) 90vw, 420px"
        alt="${media.alt || fallbackAlt || ""}"
        loading="eager"
      >
    `;
  }

  function activateModelViewerIfPresent() {
    const modelViewer = content.querySelector(
      "model-viewer#QuickViewMainImage",
    );
    if (!modelViewer) return;

    loadModelViewerFeature()
      .then(() => {
        if (window.Shopify && window.Shopify.ModelViewerUI) {
          new window.Shopify.ModelViewerUI(modelViewer);
        }
      })
      .catch((error) => console.error(error));
  }

  const COMMON_COLOR_NAME_FALLBACKS = {
    bronze: "#8c7853",
    rosegold: "#b76e79",
    champagne: "#f7e7ce",
    blush: "#de5d83",
    charcoal: "#36454f",
    denim: "#1560bd",
    burgundy: "#800020",
    mustard: "#ffdb58",
    emerald: "#50c878",
    sapphire: "#0f52ba",
    camel: "#c19a6b",
    taupe: "#483c32",
    mauve: "#e0b0ff",
    khaki: "#c3b091",
    olive: "#708238",
    rust: "#b7410e",
    terracotta: "#e2725b",
    cream: "#fffdd0",
    ivory: "#fffff0",
    offwhite: "#faf9f6",
    stone: "#928e85",
    sand: "#c2b280",
    wine: "#722f37",
    coral: "#ff7f50",
    navy: "#000080",
    teal: "#008080",
    turquoise: "#40e0d0",
    lilac: "#c8a2c8",
    lavender: "#e6e6fa",
    mint: "#98ff98",
    peach: "#ffe5b4",
    apricot: "#fbceb1",
    plum: "#8e4585",
    indigo: "#4b0082",
    maroon: "#800000",
    beige: "#f5f5dc",
  };

  function colorKey(value) {
    return value.replace(/[\s-]/g, "").toLowerCase();
  }

  function resolveSwatchColor(value) {
    const key = colorKey(value);
    return COMMON_COLOR_NAME_FALLBACKS[key] || key;
  }

  function getOptionValues(product, index) {
    const values = [];

    product.variants.forEach((v) => {
      const value = v.options[index];
      if (value && !values.includes(value)) values.push(value);
    });

    return values;
  }

  function isOptionValueAvailable(product, selectedOptions, index, value) {
    const testOptions = selectedOptions.slice();
    testOptions[index] = value;

    return product.variants.some(
      (v) =>
        v.available &&
        v.options.every(
          (val, i) => testOptions[i] === undefined || val === testOptions[i],
        ),
    );
  }

  let scrollLockY = 0;

  function lockBodyScroll() {
    scrollLockY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollLockY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
  }

  function unlockBodyScroll() {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    window.scrollTo(0, scrollLockY);
  }

  function closeModal() {
    cleanupMascot();
    modal.classList.remove("is-open");
    content.innerHTML = "";
    currentProduct = null;
    selectedVariant = null;
    selectedQuantity = 1;
    unlockBodyScroll();

    const main = document.getElementById("MainContent");
    if (main) main.removeAttribute("aria-hidden");

    document.removeEventListener("keydown", trapFocus);

    if (lastFocusedTrigger) {
      lastFocusedTrigger.focus();
      lastFocusedTrigger = null;
    }
  }

  if (overlay) overlay.addEventListener("click", closeModal);
  if (close) close.addEventListener("click", closeModal);

  // -------------------------
  // Render
  // -------------------------

  function render() {
    const product = currentProduct;
    const variant = selectedVariant;
    const strings = window.themeStrings || {};

    const media = getProductMedia(product);

    const activeMedia = (variant.featured_image &&
      media.find(
        (item) =>
          item.mediaType === "image" &&
          normalizeSrc(item.src) === normalizeSrc(variant.featured_image.src),
      )) ||
      media[0] || { id: null, mediaType: "image", src: product.featured_image };

    const onSale = variant.compare_at_price > variant.price;

    content.innerHTML = `
      <div class="j-quick-view">

        <div class="j-quick-view__gallery">

          <div class="j-quick-view__main-image">
            ${renderMainMedia(activeMedia, product.title)}
          </div>

          ${
            media.length > 1
              ? `
            <div class="j-quick-view__thumbnails">
              ${media
                .map(
                  (item, index) => `
                <button
                  type="button"
                  class="j-quick-view-thumbnail ${item.id === activeMedia.id ? "is-active" : ""}"
                  data-media-id="${item.id}"
                  data-media-type="${item.mediaType}"
                  ${item.mediaType === "image" ? `data-image="${item.src}"` : ""}
                >
                  <img
                    src="${window.JerryResizeImageUrl(item.src, 120)}"
                    srcset="${[60, 120, 180].map((w) => `${window.JerryResizeImageUrl(item.src, w)} ${w}w`).join(", ")}"
                    sizes="60px"
                    alt="${product.title} ${index + 1}"
                    loading="lazy"
                  >
                  ${
                    item.mediaType === "video" ||
                    item.mediaType === "external_video"
                      ? '<span class="j-quick-view-thumbnail__icon" aria-hidden="true">▶</span>'
                      : ""
                  }
                  ${
                    item.mediaType === "model"
                      ? '<span class="j-quick-view-thumbnail__icon j-quick-view-thumbnail__icon--model" aria-hidden="true">3D</span>'
                      : ""
                  }
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
            <div class="j-quick-view__options">
              ${product.options
                .map((optionNameRaw, index) => {
                  const optionName =
                    typeof optionNameRaw === "object"
                      ? optionNameRaw.name
                      : optionNameRaw;
                  const isColor = /^colou?r$/i.test(optionName);
                  const values = getOptionValues(product, index);
                  const selectedValue = variant.options[index];

                  return `
                    <div class="j-quick-view__option">
                      <div class="j-quick-view__option-header">
                        <label>${optionName}</label>
                        <span class="j-quick-view__option-value">${selectedValue}</span>
                      </div>
                      ${
                        isColor
                          ? `
                        <div class="j-quick-view__swatches">
                          ${values
                            .map(
                              (value) => `
                            <button
                              type="button"
                              class="j-quick-view-swatch ${value === selectedValue ? "is-active" : ""} ${!isOptionValueAvailable(product, variant.options, index, value) ? "is-sold-out" : ""}"
                              data-option-index="${index}"
                              data-value="${value}"
                              aria-label="${value}"
                              aria-pressed="${value === selectedValue}"
                              title="${value}"
                            >
                              <span class="j-quick-view-swatch-inner" style="background-color: ${resolveSwatchColor(value)};"></span>
                            </button>
                          `,
                            )
                            .join("")}
                        </div>
                      `
                          : `
                        <div class="j-quick-view__variant-buttons">
                          ${values
                            .map(
                              (value) => `
                            <button
                              type="button"
                              class="j-quick-view-variant-button ${value === selectedValue ? "is-active" : ""} ${!isOptionValueAvailable(product, variant.options, index, value) ? "is-sold-out" : ""}"
                              data-option-index="${index}"
                              data-value="${value}"
                              aria-pressed="${value === selectedValue}"
                            >
                              ${value}
                            </button>
                          `,
                            )
                            .join("")}
                        </div>
                      `
                      }
                    </div>
                  `;
                })
                .join("")}
            </div>
          `
              : ""
          }

          <div class="j-quick-view__quantity">
            <label>${strings.quantity || "Quantity"}</label>
            <div class="j-quick-view__qty-control">
              <button type="button" class="j-quick-view-qty-minus" aria-label="${strings.decreaseQuantity || "Decrease quantity"}">−</button>
              <input type="number" id="QuickViewQty" value="${selectedQuantity}" min="1">
              <button type="button" class="j-quick-view-qty-plus" aria-label="${strings.increaseQuantity || "Increase quantity"}">+</button>
            </div>
          </div>

          <div class="j-quick-view__add-wrap ${!variant.available ? "is-sold-out" : ""}">
            <div class="j-quick-view__mascot">
              <canvas id="QuickViewMascotCanvas" width="144" height="144"></canvas>
            </div>

            <button
              type="button"
              class="j-button j-quick-view-add"
              id="QuickViewAddButton"
              ${!variant.available ? "disabled" : ""}
            >
              ${variant.available ? strings.addToCart || "Add to Cart" : strings.soldOut || "Sold Out"}
            </button>
          </div>

          <p class="j-quick-view__form-error" id="QuickViewFormError" role="alert" hidden></p>

          <div class="j-quick-view__description ${product.description ? "" : "is-empty"}" id="QuickViewDescription">
            ${product.description || ""}
          </div>

          ${
            product.description && product.description.length > 220
              ? `<button type="button" class="j-quick-view-read-more">${(window.themeStrings && window.themeStrings.readMore) || "Read more"}</button>`
              : ""
          }

          <a href="${product.url}" class="j-quick-view__link">
            ${(window.themeStrings && window.themeStrings.viewFullDetails) || "View full details"}
          </a>

        </div>

      </div>
    `;

    attachContentEvents();
    activateModelViewerIfPresent();

    cleanupMascot();
    const mascotCanvas = document.getElementById("QuickViewMascotCanvas");
    if (mascotCanvas) {
      window
        .JerryLoadMascot()
        .then(() => {
          if (typeof window.jerryMascotMount === "function") {
            mascotInstance = window.jerryMascotMount(mascotCanvas);
          }
        })
        .catch((error) => {
          console.warn("[mascot] failed to load animation assets:", error);
        });
    }
  }

  // -------------------------
  // Content Events
  // -------------------------

  function attachContentEvents() {
    // Thumbnails
    content.querySelectorAll(".j-quick-view-thumbnail").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const imageSrc = thumb.dataset.image;

        if (thumb.dataset.mediaType === "image" && imageSrc) {
          const sameImageVariants = currentProduct.variants.filter(
            (v) =>
              v.featured_image &&
              normalizeSrc(v.featured_image.src) === normalizeSrc(imageSrc),
          );

          if (sameImageVariants.length) {
            const mergedOptions = selectedVariant.options.map(
              (currentValue, index) => {
                const isImageSpecific = sameImageVariants.every(
                  (v) =>
                    v.options[index] === sameImageVariants[0].options[index],
                );
                return isImageSpecific
                  ? sameImageVariants[0].options[index]
                  : currentValue;
              },
            );

            const matchingVariant =
              currentProduct.variants.find((v) =>
                v.options.every((val, i) => val === mergedOptions[i]),
              ) || sameImageVariants[0];

            if (matchingVariant.id !== selectedVariant.id) {
              selectedVariant = matchingVariant;
              render();
              return;
            }
          }
        }

        const mediaId = Number(thumb.dataset.mediaId) || thumb.dataset.mediaId;
        const media = getProductMedia(currentProduct).find(
          (item) => String(item.id) === String(mediaId),
        );

        const mainImageWrap = content.querySelector(
          ".j-quick-view__main-image",
        );

        if (media && mainImageWrap) {
          mainImageWrap.innerHTML = renderMainMedia(
            media,
            currentProduct.title,
          );
          activateModelViewerIfPresent();
        }

        content.querySelectorAll(".j-quick-view-thumbnail").forEach((t) => {
          t.classList.toggle("is-active", t === thumb);
        });
      });
    });

    // Option swatches / pills
    content
      .querySelectorAll(".j-quick-view-swatch, .j-quick-view-variant-button")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const index = Number(button.dataset.optionIndex);
          const testOptions = selectedVariant.options.slice();

          testOptions[index] = button.dataset.value;

          const variant = currentProduct.variants.find((v) =>
            v.options.every((val, i) => val === testOptions[i]),
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
        const strings = window.themeStrings || {};
        readMore.textContent = description.classList.contains("is-expanded")
          ? strings.readLess || "Read less"
          : strings.readMore || "Read more";
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
        const mascotEl = document.querySelector(".j-quick-view__mascot");
        if (mascotEl) {
          const currentTransform = getComputedStyle(mascotEl).transform;
          let captureX = 0;

          if (currentTransform && currentTransform !== "none") {
            const matrix = new DOMMatrixReadOnly(currentTransform);
            captureX = matrix.m41; // translateX component
          }

          mascotEl.style.setProperty("--capture-x", `${captureX}px`);
          mascotEl.classList.remove("is-captured");
          void mascotEl.offsetWidth; // force reflow to restart animation
          mascotEl.classList.add("is-captured");
        }

        const strings = window.themeStrings || {};

        try {
          addButton.disabled = true;
          addButton.textContent = strings.adding || "Adding...";

          const response = await fetch(`${window.themeRoutes.cartAdd}.js`, {
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
            throw new Error(
              error.description ||
                strings.addToCartError ||
                "Unable to add item to cart.",
            );
          }

          closeModal();

          const cartButton = document.querySelector(".j-header__cart");
          if (cartButton) cartButton.click();
        } catch (error) {
          console.error(error);
          formError.textContent =
            error.message ||
            strings.addToCartError ||
            "Unable to add item to cart.";
          formError.hidden = false;
          addButton.disabled = false;
          addButton.textContent = strings.addToCart || "Add to Cart";

          const mascotEl = document.querySelector(".j-quick-view__mascot");
          if (mascotEl) mascotEl.classList.remove("is-captured");
        }
      });
    }
  }

  document.addEventListener("click", async (event) => {
    const button = event.target.closest(".j-quick-view-button");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();

    const handle = button.dataset.handle;

    try {
      const response = await fetch(window.themeRoutes.product(handle));
      const product = await response.json();

      currentProduct = product;
      selectedVariant =
        product.variants.find((v) => v.available) || product.variants[0];

      render();

      modal.classList.add("is-open");
      lockBodyScroll();

      const main = document.getElementById("MainContent");
      if (main) main.setAttribute("aria-hidden", "true");

      lastFocusedTrigger = button;
      document.addEventListener("keydown", trapFocus);

      if (close) close.focus();
    } catch (error) {
      console.error(error);
    }
  });
});
