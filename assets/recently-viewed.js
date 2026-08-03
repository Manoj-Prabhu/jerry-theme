/* ==========================================================
   Jerry Theme Recently Viewed
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("RecentlyViewedProducts");

  if (!container) return;

  const handles =
    JSON.parse(localStorage.getItem("jerry-recently-viewed")) || [];

  if (!handles.length) {
    container.innerHTML = "<p>No recently viewed products.</p>";
    return;
  }

  container.innerHTML = "";

  for (const handle of handles) {
    try {
      const response = await fetch(`/products/${handle}.js`);
      const product = await response.json();

      container.innerHTML += `
        <div class="j-product-card">

          <button
            type="button"
            class="j-wishlist-button"
            data-handle="${product.handle}"
            aria-label="Add to Wishlist"
          >
            ♡
          </button>

          <a href="/products/${product.handle}" class="j-product-card__link">

            <div class="j-product-card__image">
              <img
                src="${product.featured_image}"
                alt="${product.title}"
                loading="lazy"
              >
            </div>

            <div class="j-product-card__content">

              <h2>${product.title}</h2>

              <div class="j-product-card__price">
                ${window.formatMoney ? window.formatMoney(product.price) : `$${(product.price / 100).toFixed(2)}`}
              </div>

            </div>

          </a>

        </div>
      `;
    } catch (error) {
      console.error(error);
    }
  }

  if (window.JerryWishlist) {
    window.JerryWishlist.sync(container);
  }
});
