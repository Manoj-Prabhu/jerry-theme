/* ==========================================================
   Jerry Theme Product Gallery
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const mainImage = document.getElementById("ProductMainImage");
  const thumbnails = document.querySelectorAll(".j-product-thumbnail");

  if (!mainImage || thumbnails.length === 0) return;

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

      const variantButtons = document.querySelectorAll(
        ".j-product__variant-button",
      );

      const matches = Array.from(variantButtons).filter(
        (button) =>
          !button.disabled &&
          button.dataset.hasOwnImage === "true" &&
          button.dataset.image === thumbnail.dataset.image,
      );

      if (matches.length === 1 && !matches[0].classList.contains("is-active")) {
        matches[0].click();
      }
    });
  });
});
