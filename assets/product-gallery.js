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
    });
  });
});
