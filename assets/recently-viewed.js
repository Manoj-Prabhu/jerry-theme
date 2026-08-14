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
      const strings = window.themeStrings || {};

      const images = (product.images && product.images.length
        ? product.images
        : [product.featured_image]
      ).slice(0, 4);

      const imagesHtml = images
        .map(
          (src, index) => `
              <img
                src="${src}"
                alt="${product.title}"
                loading="lazy"
                class="j-product-card__img${index === 0 ? " is-active" : ""}"
              >
            `,
        )
        .join("");

      container.innerHTML += `
        <div class="j-product-card">

          <a href="/products/${product.handle}" class="j-product-card__link">

            <div class="j-product-card__image"${images.length > 1 ? " data-auto-cycle" : ""}>
              ${imagesHtml}

              <button
                type="button"
                class="j-wishlist-button"
                data-handle="${product.handle}"
                data-product-title="${product.title}"
                aria-label="${(strings.addToWishlistHtml || "Add __TITLE__ to Wishlist").replace("__TITLE__", product.title)}"
              >
                ♡
              </button>

              <button
                type="button"
                class="j-quick-view-button"
                data-handle="${product.handle}"
                aria-haspopup="dialog"
              >
                ${strings.quickView || "Quick View"}
              </button>

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

  if (window.JerryProductCardCycle) {
    window.JerryProductCardCycle(container);
  }
});
