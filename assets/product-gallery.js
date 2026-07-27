/* ==========================================================
   Jerry Theme Product Gallery
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const mainImage = document.getElementById("ProductMainImage");
  const thumbnails = document.querySelectorAll(".j-product-thumbnail");
  const variantsJson = document.getElementById("ProductVariantsJson");

  if (!mainImage || thumbnails.length === 0) return;

  const variants = variantsJson ? JSON.parse(variantsJson.textContent) : [];

  function normalizeImageUrl(url) {
    try {
      const parsed = new URL(url, window.location.href);
      return parsed.pathname + parsed.search;
    } catch (error) {
      return url;
    }
  }

  thumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener("click", () => {
      mainImage.classList.add("is-loading");

      const newImage = new Image();

      newImage.onload = () => {
        mainImage.src = thumbnail.dataset.image;
        mainImage.srcset = "";
        mainImage.classList.remove("is-loading");
      };

      newImage.src = thumbnail.dataset.image;
      thumbnails.forEach((item) => item.classList.remove("is-active"));

      thumbnail.classList.add("is-active");

      const targetImage = normalizeImageUrl(thumbnail.dataset.image);
      const sameImageVariants = variants.filter(
        (variant) => normalizeImageUrl(variant.image) === targetImage,
      );
      const matchingVariant = sameImageVariants[0];

      if (!matchingVariant) return;

      // Only sync an option index if this image implies a single value for
      // it (e.g. Color, or the only option on a single-option product).
      // If variants with other option values (e.g. different Sizes) share
      // this same image, that index isn't image-specific — leave the
      // user's current selection for it untouched.
      matchingVariant.options.forEach((value, index) => {
        const isImageSpecific = sameImageVariants.every(
          (variant) => variant.options[index] === value,
        );

        if (!isImageSpecific) return;

        const button = document.querySelector(
          `.j-product__swatch[data-option-index="${index}"][data-value="${CSS.escape(value)}"], .j-product__pill[data-option-index="${index}"][data-value="${CSS.escape(value)}"]`,
        );

        if (button && !button.classList.contains("is-active")) {
          button.click();
        }
      });
    });
  });
});
