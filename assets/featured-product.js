function initFeaturedProduct(root) {
  if (root.dataset.featuredProductInitialized) return;
  root.dataset.featuredProductInitialized = "true";

  const sectionId = root.dataset.sectionId;
  if (!sectionId) return;

  const form = root.querySelector(".j-featured-product__form");
  if (!form) return;

  const variantsJsonEl = document.getElementById(
    `FeaturedProductVariantsJson-${sectionId}`,
  );
  const variants = variantsJsonEl ? JSON.parse(variantsJsonEl.textContent) : [];

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
  const initialVariant = variants.find(
    (variant) => variant.id === Number(variantInput ? variantInput.value : 0),
  );
  if (initialVariant) selectedOptions = initialVariant.options.slice();

  function findVariant(options) {
    return variants.find((variant) =>
      variant.options.every((value, index) => value === options[index]),
    );
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

      const variant = findVariant(selectedOptions);
      if (variant) selectVariant(variant);
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

      const response = await fetch("/cart/add.js", {
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
