document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.querySelector(".j-product__gallery");
  const thumbnails = document.querySelectorAll(".j-product-thumbnail");
  const dots = document.querySelectorAll(".j-product__dot");
  const slides = document.querySelectorAll(".j-product__media-slide");
  const variantsJson = document.getElementById("ProductVariantsJson");

  if (!gallery || (thumbnails.length === 0 && dots.length === 0)) return;

  const variants = variantsJson ? JSON.parse(variantsJson.textContent) : [];

  function activateMedia(mediaId) {
    slides.forEach((slide) => {
      slide.classList.toggle("is-active", slide.dataset.mediaId === mediaId);
    });

    thumbnails.forEach((thumbnail) => {
      thumbnail.classList.toggle(
        "is-active",
        thumbnail.dataset.mediaId === mediaId,
      );
    });

    dots.forEach((dot) => {
      dot.classList.toggle("is-active", dot.dataset.mediaId === mediaId);
    });
  }

  function syncVariantToMedia(mediaId) {
    // Only sync an option index if this media implies a single value for
    // it (e.g. Color, or the only option on a single-option product).
    // If variants with other option values (e.g. different Sizes) share
    // this same media, that index isn't media-specific — leave the
    // user's current selection for it untouched.
    const sameMediaVariants = variants.filter(
      (variant) => String(variant.featuredMediaId) === mediaId,
    );
    const matchingVariant = sameMediaVariants[0];

    if (!matchingVariant) return;

    matchingVariant.options.forEach((value, index) => {
      const isMediaSpecific = sameMediaVariants.every(
        (variant) => variant.options[index] === value,
      );

      if (!isMediaSpecific) return;

      const button = document.querySelector(
        `.j-product__swatch[data-option-index="${index}"][data-value="${CSS.escape(value)}"], .j-product__pill[data-option-index="${index}"][data-value="${CSS.escape(value)}"]`,
      );

      if (button && !button.classList.contains("is-active")) {
        button.click();
      }
    });
  }

  thumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener("click", () => {
      activateMedia(thumbnail.dataset.mediaId);
      syncVariantToMedia(thumbnail.dataset.mediaId);
    });
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      activateMedia(dot.dataset.mediaId);
      syncVariantToMedia(dot.dataset.mediaId);
    });
  });

  gallery.activateMedia = activateMedia;

  // -------------------------
  // Thumbnail scroll arrows (desktop column only — see .j-product__dots
  // for the mobile equivalent, which doesn't need scrolling)
  // -------------------------

  const thumbList = document.querySelector(".j-product__thumbnails");
  const upButton = document.querySelector(".j-product__thumb-scroll--up");
  const downButton = document.querySelector(".j-product__thumb-scroll--down");

  if (thumbList && upButton && downButton) {
    // How far one click moves the list — one thumbnail's own height (plus
    // its gap to the next one), so a click always lands exactly on a
    // thumbnail boundary instead of stopping mid-scroll.
    function stepDistance() {
      const first = thumbList.querySelector(".j-product-thumbnail");
      return first ? first.offsetHeight + 10 : thumbList.clientHeight * 0.8;
    }

    function updateArrowState() {
      const canScroll = thumbList.scrollHeight > thumbList.clientHeight + 1;

      upButton.hidden = !canScroll;
      downButton.hidden = !canScroll;

      if (!canScroll) return;

      upButton.disabled = thumbList.scrollTop <= 0;
      downButton.disabled =
        thumbList.scrollTop + thumbList.clientHeight >=
        thumbList.scrollHeight - 1;
    }

    upButton.addEventListener("click", () => {
      thumbList.scrollBy({ top: -stepDistance(), behavior: "smooth" });
    });

    downButton.addEventListener("click", () => {
      thumbList.scrollBy({ top: stepDistance(), behavior: "smooth" });
    });

    thumbList.addEventListener("scroll", updateArrowState, { passive: true });

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateArrowState, 150);
    });

    updateArrowState();
  }
});
