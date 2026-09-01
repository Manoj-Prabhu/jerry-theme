let productGalleryResizeListenerBound = false;

function initProductGallery() {
  const gallery = document.querySelector(".j-product__gallery");
  const thumbnails = document.querySelectorAll(".j-product-thumbnail");
  const dots = document.querySelectorAll(".j-product__dot");
  const slides = document.querySelectorAll(".j-product__media-slide");
  const variantsJson = document.getElementById("ProductVariantsJson");

  if (!gallery || (thumbnails.length === 0 && dots.length === 0)) return;

  const variants = variantsJson ? JSON.parse(variantsJson.textContent) : [];

  // Source order of the slides in the DOM doubles as the gallery's
  // left-to-right sequence — whichever direction a clicked thumbnail
  // sits in relative to the currently active slide is the direction it
  // visually slides in from (see the is-entering-*/is-leaving-* classes
  // in product.css).
  const mediaOrder = Array.from(slides).map((slide) => slide.dataset.mediaId);

  function activateMedia(mediaId) {
    const outgoing = gallery.querySelector(
      ".j-product__media-slide.is-active",
    );
    const incoming = gallery.querySelector(
      `.j-product__media-slide[data-media-id="${CSS.escape(mediaId)}"]`,
    );

    const outgoingId = outgoing ? outgoing.dataset.mediaId : null;
    const oldIndex = outgoingId ? mediaOrder.indexOf(outgoingId) : -1;
    const newIndex = mediaOrder.indexOf(mediaId);

    thumbnails.forEach((thumbnail) => {
      thumbnail.classList.toggle(
        "is-active",
        thumbnail.dataset.mediaId === mediaId,
      );
    });

    dots.forEach((dot) => {
      dot.classList.toggle("is-active", dot.dataset.mediaId === mediaId);
    });

    if (!incoming || incoming === outgoing) return;

    if (!outgoing || oldIndex === -1 || newIndex === -1) {
      // No prior active slide (first render) — just show it, no
      // direction to animate from.
      slides.forEach((slide) => {
        slide.classList.remove(
          "is-entering-next",
          "is-entering-prev",
          "is-leaving-next",
          "is-leaving-prev",
        );
        slide.classList.toggle("is-active", slide === incoming);
      });
      return;
    }

    const direction = newIndex > oldIndex ? "next" : "prev";
    const enterClass = direction === "next" ? "is-entering-next" : "is-entering-prev";
    const leaveClass = direction === "next" ? "is-leaving-next" : "is-leaving-prev";

    // Clear any leftover state from a transition that got interrupted
    // mid-flight (e.g. clicking a second thumbnail before the first
    // one's animation finished).
    slides.forEach((slide) => {
      slide.classList.remove(
        "is-entering-next",
        "is-entering-prev",
        "is-leaving-next",
        "is-leaving-prev",
      );
    });

    incoming.classList.remove("is-active");
    incoming.classList.add(enterClass);
    // Forces the browser to commit the entering slide's starting
    // position (translateX ±100%) before the next frame flips it to
    // .is-active — without this the two class changes would collapse
    // into a single style recalc and the slide would never actually
    // animate from off-screen.
    void incoming.offsetWidth;

    requestAnimationFrame(() => {
      incoming.classList.remove(enterClass);
      incoming.classList.add("is-active");

      outgoing.classList.remove("is-active");
      outgoing.classList.add(leaveClass);

      outgoing.addEventListener(
        "transitionend",
        () => {
          outgoing.classList.remove(leaveClass);
        },
        { once: true },
      );
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

    // Bound once, ever, at module scope — this listens on `window`
    // itself (never replaced by a section reload), so re-running init on
    // every shopify:section:load would otherwise stack a duplicate
    // listener each time instead of just picking up the new elements.
    if (!productGalleryResizeListenerBound) {
      productGalleryResizeListenerBound = true;
      let resizeTimer = null;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateArrowState, 150);
      });
    }

    updateArrowState();
  }
}

document.addEventListener("DOMContentLoaded", initProductGallery);

// See product-variants.js for why this listener is needed — the theme
// editor swaps section markup via AJAX without firing DOMContentLoaded
// again, so without this, thumbnails/dots stop switching the main image
// after any edit to the product section.
document.addEventListener("shopify:section:load", (event) => {
  if (event.target.querySelector(".j-product__gallery")) {
    initProductGallery();
  }
});
