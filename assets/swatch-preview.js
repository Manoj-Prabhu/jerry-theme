document.addEventListener(
  "mouseover",
  (event) => {
    const swatch = event.target.closest(
      ".j-product-card__swatch[data-preview-image]",
    );
    if (!swatch) return;

    const card = swatch.closest(".j-product-card");
    const activeImg =
      card && card.querySelector(".j-product-card__img.is-active");
    if (!activeImg) return;

    if (!activeImg.dataset.originalSrc) {
      activeImg.dataset.originalSrc = activeImg.src;
      activeImg.dataset.originalSrcset = activeImg.srcset || "";
    }
    activeImg.srcset = "";
    activeImg.src = swatch.dataset.previewImage;
  },
  { passive: true },
);

document.addEventListener(
  "mouseout",
  (event) => {
    const swatch = event.target.closest(
      ".j-product-card__swatch[data-preview-image]",
    );
    if (!swatch) return;

    const card = swatch.closest(".j-product-card");
    const activeImg =
      card && card.querySelector(".j-product-card__img.is-active");
    if (!activeImg || !activeImg.dataset.originalSrc) return;

    activeImg.src = activeImg.dataset.originalSrc;
    activeImg.srcset = activeImg.dataset.originalSrcset;
  },
  { passive: true },
);
