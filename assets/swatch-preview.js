// Swatch hover-preview — hovering a color swatch on a product card swaps
// the card's currently-active image to that color's photo, without a
// click or page navigation. Delegated to `document` rather than bound
// per-swatch, so this works on every .j-product-card sitewide (collection
// grids, search results, recommendations, recently-viewed) including
// ones injected after load, with one listener instead of re-binding on
// every AJAX-rendered batch of cards.
document.addEventListener(
  "mouseover",
  (event) => {
    const swatch = event.target.closest(".j-product-card__swatch[data-preview-image]");
    if (!swatch) return;

    const card = swatch.closest(".j-product-card");
    const activeImg = card && card.querySelector(".j-product-card__img.is-active");
    if (!activeImg) return;

    if (!activeImg.dataset.originalSrc) {
      // Saved once per card visit, not overwritten on a second swatch
      // hover — otherwise hovering swatch B after swatch A would save
      // swatch A's preview as the "original" to restore back to.
      activeImg.dataset.originalSrc = activeImg.src;
      activeImg.dataset.originalSrcset = activeImg.srcset || "";
    }

    // Clearing srcset is required, not optional — a populated srcset
    // takes priority over src for the browser's own image selection, so
    // just overwriting src alone would silently keep showing whichever
    // srcset candidate it already picked.
    activeImg.srcset = "";
    activeImg.src = swatch.dataset.previewImage;
  },
  { passive: true },
);

document.addEventListener(
  "mouseout",
  (event) => {
    const swatch = event.target.closest(".j-product-card__swatch[data-preview-image]");
    if (!swatch) return;

    const card = swatch.closest(".j-product-card");
    const activeImg = card && card.querySelector(".j-product-card__img.is-active");
    if (!activeImg || !activeImg.dataset.originalSrc) return;

    activeImg.src = activeImg.dataset.originalSrc;
    activeImg.srcset = activeImg.dataset.originalSrcset;
  },
  { passive: true },
);
