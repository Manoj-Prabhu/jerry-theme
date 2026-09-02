// Featured Product — self-contained variant switching, gallery, and add
// to cart for sections/featured-product.liquid. Written independently
// from product-variants.js/product-gallery.js/cart.js's product-form
// handling (rather than reusing them) because those assume a single
// global instance tied to fixed ids (#AddToCartButton, #ProductPrice,
// etc.), while this section can appear more than once on a page and on
// any template — every id here is scoped per section.id instead.
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

  // Thumbnail row scroll arrows — the row can hold more thumbnails than
  // fit on one line, so it scrolls horizontally instead of wrapping.
  const thumbList = root.querySelector(".j-featured-product__thumbnails");
  const thumbPrev = root.querySelector(".j-featured-product__thumb-arrow--prev");
  const thumbNext = root.querySelector(".j-featured-product__thumb-arrow--next");

  if (thumbList && thumbPrev && thumbNext) {
    // Thumbnail width/row-capacity is handled entirely by CSS (see
    // .j-featured-product__thumb's flex-basis calc() in
    // featured-product.css) rather than JS measuring and writing inline
    // styles — a previous version of this computed and wrote explicit
    // pixel widths here, which could go stale (thumbnails rendering
    // overlapped/misjudged) whenever the layout changed without a full
    // page reload, e.g. the theme editor's mobile/desktop preview
    // toggle. CSS re-flows itself correctly on every layout change with
    // no JS involved, so that whole class of bug isn't possible here —
    // this only owns arrow visibility/enabled state and the scroll
    // itself, both of which are read fresh from the DOM on demand.
    function thumbStepDistance() {
      const first = thumbList.querySelector(".j-featured-product__thumb");
      const gap = parseFloat(getComputedStyle(thumbList).columnGap) || 24;
      return first ? first.getBoundingClientRect().width + gap : thumbList.clientWidth * 0.8;
    }

    function updateThumbArrows() {
      const canScroll = thumbList.scrollWidth > thumbList.clientWidth + 1;

      thumbPrev.hidden = !canScroll;
      thumbNext.hidden = !canScroll;

      if (!canScroll) return;

      thumbPrev.disabled = thumbList.scrollLeft <= 0;
      thumbNext.disabled =
        thumbList.scrollLeft + thumbList.clientWidth >=
        thumbList.scrollWidth - 1;
    }

    thumbPrev.addEventListener("click", () => {
      thumbList.scrollBy({ left: -thumbStepDistance(), behavior: "smooth" });
    });

    thumbNext.addEventListener("click", () => {
      thumbList.scrollBy({ left: thumbStepDistance(), behavior: "smooth" });
    });

    thumbList.addEventListener("scroll", updateThumbArrows, { passive: true });

    // Re-checks arrow visibility whenever the row's available width
    // changes for any reason (viewport resize, web fonts swapping in,
    // the grid column reflowing, a live mobile/desktop preview toggle)
    // — ResizeObserver reacts to the row's actual rendered size itself
    // rather than only window resize events.
    let thumbResizeTimer = null;
    const onThumbListResize = () => {
      clearTimeout(thumbResizeTimer);
      thumbResizeTimer = setTimeout(updateThumbArrows, 150);
    };

    if (typeof ResizeObserver === "function") {
      new ResizeObserver(onThumbListResize).observe(thumbList);
    } else {
      window.addEventListener("resize", onThumbListResize, { passive: true });
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
      if (addButtonText) addButtonText.textContent = strings.adding || "Adding...";

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

      // Reuses the header cart button's own click handler (in cart.js,
      // loaded on every page) to refresh the cart count and open the
      // drawer, rather than duplicating that logic here.
      const cartButton = document.querySelector(".j-header__cart");
      if (cartButton) cartButton.click();
    } catch (error) {
      console.error(error);
      if (formError) {
        formError.textContent =
          error.message || strings.addToCartError || "Unable to add item to cart.";
        formError.hidden = false;
      }
    } finally {
      if (addButton) addButton.disabled = false;
      if (addButtonText) addButtonText.textContent = originalButtonText;
    }
  });
}

function initAllFeaturedProducts(root) {
  root.querySelectorAll(".j-featured-product-card").forEach(initFeaturedProduct);
}

document.addEventListener("DOMContentLoaded", () => initAllFeaturedProducts(document));

// The theme editor replaces a section's markup wholesale on block/setting
// changes, leaving fresh elements with no listeners attached.
document.addEventListener("shopify:section:load", (event) =>
  initAllFeaturedProducts(event.target),
);
