// Renders the wishlist page's product grid — mirrors
// recently-viewed.js's approach (localStorage handles -> fetch each via
// the Product JS API -> render once), reading the "jerry-wishlist" key
// instead of "jerry-recently-viewed". See wishlist.js for where that key
// is written.
const WISHLIST_STORAGE_KEY = "jerry-wishlist";
const WISHLIST_IMAGE_WIDTHS = [200, 350, 500, 600, 700];

function resizeWishlistImageUrl(src, width) {
  if (!src) return "";
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}width=${width}&format=webp`;
}

function getWishlistHandles() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY)) || [];
  } catch (error) {
    /* localStorage unavailable (private browsing, in-app webview, etc.) */
    return [];
  }
}

function renderWishlistCard(product) {
  const strings = window.themeStrings || {};

  const images = (
    product.images && product.images.length
      ? product.images
      : [product.featured_image]
  )
    .filter(Boolean)
    .slice(0, 4);

  const imagesHtml = images
    .map((src, index) => {
      const srcset = WISHLIST_IMAGE_WIDTHS.map(
        (width) => `${resizeWishlistImageUrl(src, width)} ${width}w`,
      ).join(", ");

      return `
        <img
          src="${resizeWishlistImageUrl(src, 350)}"
          srcset="${srcset}"
          sizes="(max-width: 1100px) 50vw, 25vw"
          alt="${product.title}"
          loading="lazy"
          class="j-product-card__img${index === 0 ? " is-active" : ""}"
        >
      `;
    })
    .join("");

  return `
    <div class="j-product-card" data-wishlist-handle="${product.handle}">

      <div class="j-product-card__image"${images.length > 1 ? " data-auto-cycle" : ""}>

        <a href="/products/${product.handle}" class="j-product-card__image-link" tabindex="-1" aria-hidden="true">
          ${imagesHtml}
        </a>

        <button
          type="button"
          class="j-wishlist-button is-active"
          data-handle="${product.handle}"
          data-product-title="${product.title}"
          aria-label="${(strings.removeFromWishlistHtml || "Remove __TITLE__ from Wishlist").replace("__TITLE__", product.title)}"
          aria-pressed="true"
        >
          ♥
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

      <a href="/products/${product.handle}" class="j-product-card__link">
        <div class="j-product-card__content">

          <h2>${product.title}</h2>

          <div class="j-product-card__price">
            ${window.formatMoney ? window.formatMoney(product.price) : `$${(product.price / 100).toFixed(2)}`}
          </div>

        </div>
      </a>

    </div>
  `;
}

function showWishlistEmptyState() {
  const empty = document.getElementById("WishlistPageEmpty");
  if (empty) empty.hidden = false;
}

function hideWishlistEmptyState() {
  const empty = document.getElementById("WishlistPageEmpty");
  if (empty) empty.hidden = true;
}

async function initWishlistPage() {
  const container = document.getElementById("WishlistPageProducts");
  if (!container) return;

  const handles = getWishlistHandles();

  if (!handles.length) {
    showWishlistEmptyState();
    return;
  }

  const cardHtmlList = await Promise.all(
    handles.map(async (handle) => {
      try {
        const response = await fetch(`/products/${handle}.js`);
        if (!response.ok) return null;
        const product = await response.json();
        return renderWishlistCard(product);
      } catch (error) {
        console.error(error);
        return null;
      }
    }),
  );

  const validCards = cardHtmlList.filter(Boolean);

  if (!validCards.length) {
    // Every stored handle 404'd (products deleted/unpublished since
    // being saved) — same "nothing left to show" outcome as never
    // having saved anything, so it gets the same empty state rather
    // than a silently blank grid.
    showWishlistEmptyState();
    return;
  }

  container.innerHTML = validCards.join("");
  hideWishlistEmptyState();

  if (window.JerryWishlist) {
    window.JerryWishlist.sync(container);
  }

  if (window.JerryProductCardCycle) {
    window.JerryProductCardCycle(container);
  }
}

document.addEventListener("DOMContentLoaded", initWishlistPage);

// Clicking a card's own heart button on this page removes it — react
// immediately instead of leaving a now-unwishlisted card sitting there
// until the visitor reloads. See wishlist.js, which dispatches this
// after updating localStorage.
document.addEventListener("jerry:wishlist-changed", (event) => {
  const container = document.getElementById("WishlistPageProducts");
  if (!container) return;

  if (event.detail.added) return; // only removals affect this page

  const card = container.querySelector(
    `.j-product-card[data-wishlist-handle="${event.detail.handle}"]`,
  );
  if (card) card.remove();

  if (!container.querySelector(".j-product-card")) {
    showWishlistEmptyState();
  }
});
