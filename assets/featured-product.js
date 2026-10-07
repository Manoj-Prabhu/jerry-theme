function initFeaturedProduct(root) {
  if (root.dataset.featuredProductInitialized) return;
  root.dataset.featuredProductInitialized = "true";

  const sectionId = root.dataset.sectionId;
  if (!sectionId) return;

  const form = root.querySelector(".j-featured-product__form");
  if (!form) return;

  // Only the selected variant is in the page; another selection is fetched by
  // re-rendering this section for the product (Section Rendering API).
  const variantJsonId = `FeaturedProductVariantJson-${sectionId}`;
  const variantJsonEl = document.getElementById(variantJsonId);
  const initialVariant = variantJsonEl
    ? JSON.parse(variantJsonEl.textContent)
    : null;
  const variantCache = new Map();
  let latestRequest = 0;

  const variantInput = document.getElementById(
    `FeaturedProductSelectedVariant-${sectionId}`,
  );
  const price = document.getElementById(`FeaturedProductPrice-${sectionId}`);
  const comparePrice = document.getElementById(
    `FeaturedProductComparePrice-${sectionId}`,
  );
  const saleBadge = document.getElementById(
    `FeaturedProductSaleBadge-${sectionId}`,
  );
  const percentBadge = document.getElementById(
    `FeaturedProductPercentBadge-${sectionId}`,
  );
  const addButton = document.getElementById(
    `FeaturedProductAddToCart-${sectionId}`,
  );
  const addButtonText = document.getElementById(
    `FeaturedProductAddToCartText-${sectionId}`,
  );
  const formError = document.getElementById(
    `FeaturedProductFormError-${sectionId}`,
  );
  const qtyInput = document.getElementById(
    `FeaturedProductQuantity-${sectionId}`,
  );

  const slides = root.querySelectorAll(".j-featured-product__media-slide");
  const thumbnails = root.querySelectorAll(".j-featured-product__thumb");
  const optionButtons = root.querySelectorAll(
    ".j-featured-product__swatch, .j-featured-product__pill",
  );

  let selectedOptions = [];
  if (initialVariant) selectedOptions = initialVariant.options.slice();

  // option_values only applies to the product a URL belongs to, so the
  // section is requested from the product's own URL.
  async function fetchVariant(optionValueIds) {
    const key = optionValueIds.join(",");

    if (variantCache.has(key)) return variantCache.get(key);

    const response = await fetch(
      `${root.dataset.productUrl}?section_id=${encodeURIComponent(root.dataset.section)}&option_values=${key}`,
    );

    if (!response.ok)
      throw new Error(`Section request failed: ${response.status}`);

    const doc = new DOMParser().parseFromString(
      await response.text(),
      "text/html",
    );
    const json = doc.getElementById(variantJsonId);
    const variant = json ? JSON.parse(json.textContent) : null;

    variantCache.set(key, variant);

    return variant;
  }

  async function updateSelection() {
    const optionValueIds = Array.from(optionButtons)
      .filter((button) => button.classList.contains("is-active"))
      .map((button) => button.dataset.optionValueId)
      .filter(Boolean);
    const request = ++latestRequest;
    const wasDisabled = addButton ? addButton.disabled : false;

    // Nothing can be added to the cart until the new selection is known.
    if (addButton) addButton.disabled = true;

    let variant = null;

    try {
      variant = await fetchVariant(optionValueIds);
    } catch (error) {
      if (request === latestRequest && addButton) {
        addButton.disabled = wasDisabled;
      }
      return;
    }

    if (request !== latestRequest) return;

    const matchesSelection =
      variant &&
      variant.options.every((value, index) => value === selectedOptions[index]);

    if (matchesSelection) {
      selectVariant(variant);
    } else if (addButton) {
      // No variant for this combination: leave the previous one in place.
      addButton.disabled = wasDisabled;
    }
  }

  function activateMedia(mediaId) {
    slides.forEach((slide) => {
      slide.classList.toggle("is-active", slide.dataset.mediaId === mediaId);
    });
    thumbnails.forEach((thumb) => {
      thumb.classList.toggle("is-active", thumb.dataset.mediaId === mediaId);
    });
  }

  function selectVariant(variant) {
    if (variantInput) variantInput.value = variant.id;

    if (price) price.textContent = variant.price;

    if (comparePrice) {
      comparePrice.textContent = variant.compareAtPrice || "";
      comparePrice.hidden = !variant.compareAtPrice;
    }

    if (saleBadge) saleBadge.hidden = !variant.compareAtPrice;

    if (percentBadge) {
      percentBadge.textContent = variant.discountPercent
        ? `-${variant.discountPercent}%`
        : "";
      percentBadge.hidden = !variant.discountPercent;
    }

    if (addButton) addButton.disabled = !variant.available;

    if (addButtonText) {
      const strings = window.themeStrings || {};
      addButtonText.textContent = variant.available
        ? strings.addToCart || "Add to Cart"
        : strings.soldOut || "Sold Out";
    }

    if (variant.featuredMediaId) {
      activateMedia(String(variant.featuredMediaId));
    }
  }

  optionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.optionIndex);
      const group = button.closest(
        ".j-featured-product__swatches, .j-featured-product__pills",
      );

      selectedOptions[index] = button.dataset.value;

      group
        .querySelectorAll(
          ".j-featured-product__swatch, .j-featured-product__pill",
        )
        .forEach((item) => {
          item.classList.remove("is-active");
          item.setAttribute("aria-pressed", "false");
        });

      button.classList.add("is-active");
      button.setAttribute("aria-pressed", "true");

      const optionValueLabel = button
        .closest(".j-featured-product__option")
        .querySelector(".j-featured-product__option-value");
      if (optionValueLabel) optionValueLabel.textContent = button.dataset.value;

      updateSelection();
    });
  });

  thumbnails.forEach((thumb) => {
    thumb.addEventListener("click", () => activateMedia(thumb.dataset.mediaId));
  });

  const thumbList = root.querySelector(".j-featured-product__thumbnails");
  const thumbPrev = root.querySelector(
    ".j-featured-product__thumb-arrow--prev",
  );
  const thumbNext = root.querySelector(
    ".j-featured-product__thumb-arrow--next",
  );

  if (thumbList && thumbPrev && thumbNext) {
    function thumbStepDistance() {
      const first = thumbList.querySelector(".j-featured-product__thumb");
      const gap = parseFloat(getComputedStyle(thumbList).columnGap) || 24;
      return first
        ? first.getBoundingClientRect().width + gap
        : thumbList.clientWidth * 0.8;
    }

    function updateThumbArrows() {
      const wrap = thumbList.closest(".j-featured-product__thumbnails-wrap");
      if (wrap) wrap.classList.remove("has-thumb-scroll");

      const canScroll = thumbList.scrollWidth > thumbList.clientWidth + 1;

      if (wrap) wrap.classList.toggle("has-thumb-scroll", canScroll);

      thumbPrev.hidden = !canScroll;
      thumbNext.hidden = !canScroll;

      updateArrowEnabledState();
    }

    function updateArrowEnabledState() {
      if (thumbPrev.hidden) return;

      thumbPrev.disabled = thumbList.scrollLeft <= 0;
      thumbNext.disabled =
        thumbList.scrollLeft + thumbList.clientWidth >=
        thumbList.scrollWidth - 1;
    }

    let arrowStateQueued = false;
    function queueArrowEnabledState() {
      if (arrowStateQueued) return;
      arrowStateQueued = true;
      requestAnimationFrame(() => {
        arrowStateQueued = false;
        updateArrowEnabledState();
      });
    }

    thumbPrev.addEventListener("click", () => {
      thumbList.scrollBy({ left: -thumbStepDistance(), behavior: "smooth" });
    });

    thumbNext.addEventListener("click", () => {
      thumbList.scrollBy({ left: thumbStepDistance(), behavior: "smooth" });
    });

    thumbList.addEventListener("scroll", queueArrowEnabledState, {
      passive: true,
    });

    let thumbResizeTimer = null;
    let lastThumbWidth = null;
    const onThumbListResize = (entries) => {
      const entry = entries && entries[0];
      const width =
        entry && entry.borderBoxSize
          ? entry.borderBoxSize[0].inlineSize
          : thumbList.offsetWidth;
      if (width === lastThumbWidth) return;
      lastThumbWidth = width;

      clearTimeout(thumbResizeTimer);
      thumbResizeTimer = setTimeout(updateThumbArrows, 150);
    };

    if (typeof ResizeObserver === "function") {
      new ResizeObserver(onThumbListResize).observe(thumbList, {
        box: "border-box",
      });
    } else {
      window.addEventListener("resize", () => onThumbListResize(), {
        passive: true,
      });
    }

    updateThumbArrows();
  }

  const qtyMinus = root.querySelector(".j-featured-product__qty-minus");
  const qtyPlus = root.querySelector(".j-featured-product__qty-plus");

  if (qtyMinus) {
    qtyMinus.addEventListener("click", () => {
      qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
    });
  }

  if (qtyPlus) {
    qtyPlus.addEventListener("click", () => {
      qtyInput.value = Number(qtyInput.value) + 1;
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (formError) {
      formError.hidden = true;
      formError.textContent = "";
    }

    const strings = window.themeStrings || {};
    const originalButtonText = addButtonText ? addButtonText.textContent : "";

    try {
      if (addButton) addButton.disabled = true;
      if (addButtonText)
        addButtonText.textContent = strings.adding || "Adding...";

      const response = await fetch(`${window.themeRoutes.cartAdd}.js`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              id: Number(variantInput.value),
              quantity: Number(qtyInput.value) || 1,
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

      const cartButton = document.querySelector(".j-header__cart");
      if (cartButton) cartButton.click();
    } catch (error) {
      console.error(error);
      if (formError) {
        formError.textContent =
          error.message ||
          strings.addToCartError ||
          "Unable to add item to cart.";
        formError.hidden = false;
      }
    } finally {
      if (addButton) addButton.disabled = false;
      if (addButtonText) addButtonText.textContent = originalButtonText;
    }
  });
}

function initAllFeaturedProducts(root) {
  root
    .querySelectorAll(".j-featured-product-card")
    .forEach(initFeaturedProduct);
}

document.addEventListener("DOMContentLoaded", () =>
  initAllFeaturedProducts(document),
);

document.addEventListener("shopify:section:load", (event) =>
  initAllFeaturedProducts(event.target),
);
