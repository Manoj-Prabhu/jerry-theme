document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.querySelector(".j-product__gallery");
  const thumbnails = document.querySelectorAll(".j-product-thumbnail");
  const slides = document.querySelectorAll(".j-product__media-slide");
  const variantsJson = document.getElementById("ProductVariantsJson");

  if (!gallery || thumbnails.length === 0) return;

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
  }

  thumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener("click", () => {
      const mediaId = thumbnail.dataset.mediaId;

      activateMedia(mediaId);

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
    });
  });

  gallery.activateMedia = activateMedia;
});
