let productGalleryResizeListenerBound = false;

function initProductGallery() {
  const gallery = document.querySelector(".j-product__gallery");
  const thumbnails = document.querySelectorAll(".j-product-thumbnail");
  const dots = document.querySelectorAll(".j-product__dot");
  const slides = document.querySelectorAll(".j-product__media-slide");
  const variantsJson = document.getElementById("ProductVariantsJson");

  if (!gallery || (thumbnails.length === 0 && dots.length === 0)) return;

  const variants = variantsJson ? JSON.parse(variantsJson.textContent) : [];
  const mediaOrder = Array.from(slides).map((slide) => slide.dataset.mediaId);

  function activateMedia(mediaId) {
    const outgoing = gallery.querySelector(".j-product__media-slide.is-active");
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
    const enterClass =
      direction === "next" ? "is-entering-next" : "is-entering-prev";
    const leaveClass =
      direction === "next" ? "is-leaving-next" : "is-leaving-prev";

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

  const mainImage = document.querySelector(".j-product__main-image");

  if (mainImage) {
    let touchStartX = 0;
    let touchStartY = 0;
    let tracking = false;

    const SWIPE_THRESHOLD = 40;

    mainImage.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length !== 1) return;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        tracking = true;
      },
      { passive: true },
    );

    mainImage.addEventListener(
      "touchend",
      (event) => {
        if (!tracking) return;
        tracking = false;

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        if (
          Math.abs(deltaX) < SWIPE_THRESHOLD ||
          Math.abs(deltaX) < Math.abs(deltaY)
        ) {
          return;
        }

        const activeSlide = gallery.querySelector(
          ".j-product__media-slide.is-active",
        );
        if (!activeSlide) return;

        const currentIndex = mediaOrder.indexOf(activeSlide.dataset.mediaId);
        if (currentIndex === -1) return;
        const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex < 0 || nextIndex >= mediaOrder.length) return;

        const nextMediaId = mediaOrder[nextIndex];
        activateMedia(nextMediaId);
        syncVariantToMedia(nextMediaId);
      },
      { passive: true },
    );
  }

  const thumbList = document.querySelector(".j-product__thumbnails");
  const upButton = document.querySelector(".j-product__thumb-scroll--up");
  const downButton = document.querySelector(".j-product__thumb-scroll--down");

  if (thumbList && upButton && downButton) {
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

document.addEventListener("shopify:section:load", (event) => {
  if (event.target.querySelector(".j-product__gallery")) {
    initProductGallery();
  }
});
