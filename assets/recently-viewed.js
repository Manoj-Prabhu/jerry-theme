// The Product JS API (/products/{handle}.js) returns original,
// full-resolution CDN image URLs with no size applied — rendering those
// directly as <img src> downloaded 1-3 MB originals for what displays as a
// 240x240 card thumbnail (flagged by Lighthouse's "Improve image delivery").
// Shopify's CDN supports resizing any file URL on the fly via a `width`
// query param, so this builds a proper srcset from it instead. format=webp
// mirrors every Liquid image_tag call elsewhere in the theme (e.g.
// product-card.liquid) — without it these were the one place still
// shipping full JPEG/PNG bytes instead of the smaller re-encode.

// 600 closes the gap between 500 and 700 — this grid's real card width
// (.j-product-grid, shared with product-card.liquid) lands around
// 514-526px on plenty of common desktop/laptop window widths, at which
// point 500 falls just short and the browser always overshot straight
// to 700 (see the identical fix/comment in snippets/product-card.liquid).
const RECENTLY_VIEWED_IMAGE_WIDTHS = [200, 350, 500, 600, 700];

async function initRecentlyViewed() {
  const container = document.getElementById("RecentlyViewedProducts");

  if (!container) return;

  let handles = [];
  try {
    handles = JSON.parse(localStorage.getItem("jerry-recently-viewed")) || [];
  } catch (error) {
    /* localStorage unavailable (private browsing, in-app webview, etc.) */
  }

  // The product being viewed right now isn't "recently viewed" — and
  // product.js adds it to this list on every product page load, so
  // without this a first-time visitor's list was never truly empty.
  const currentHandle = decodeURIComponent(
    (window.location.pathname.split("/products/")[1] || "").split("/")[0],
  );
  handles = handles.filter((handle) => handle !== currentHandle);

  const section = container.closest(".j-recently-viewed");
  const inThemeEditor = Boolean(window.Shopify && window.Shopify.designMode);

  // Nothing to show: the section stays hidden (see the inline script in
  // recently-viewed-products.liquid, which makes the same decision
  // before first paint). Only the theme editor gets a visible message,
  // so a merchant can still find and select the section there.
  function showEmptyState() {
    if (inThemeEditor) {
      container.innerHTML = "<p>No recently viewed products.</p>";
    } else if (section) {
      section.hidden = true;
    }
  }

  if (!handles.length) {
    showEmptyState();
    return;
  }

  // Fetches every handle concurrently (rather than one `await` per
  // iteration of a for-loop) and builds each card's markup as a plain
  // string, writing container.innerHTML exactly once at the end.
  // Appending via `container.innerHTML += ...` inside the loop was both
  // slower (the browser re-parses and re-lays-out everything already
  // inserted on every single iteration — O(n²) as the list grows) and
  // serialized network requests that don't depend on each other, both
  // showing up as extra "Style & Layout"/"Script Evaluation" time in
  // Lighthouse's "Minimize main-thread work" on this page.
  const strings = window.themeStrings || {};

  const cardHtmlList = await Promise.all(
    handles.map(async (handle) => {
      try {
        const response = await fetch(window.themeRoutes.product(handle));
        const product = await response.json();

        const images = (
          product.images && product.images.length
            ? product.images
            : [product.featured_image]
        )
          .filter(Boolean)
          .slice(0, 4);

        const imagesHtml = images
          .map((src, index) => {
            const srcset = RECENTLY_VIEWED_IMAGE_WIDTHS.map(
              (width) => `${window.JerryResizeImageUrl(src, width)} ${width}w`,
            ).join(", ");

            return `
              <img
                src="${window.JerryResizeImageUrl(src, 350)}"
                srcset="${srcset}"
                sizes="(max-width: 992px) 43vw, (max-width: 1100px) 28vw, 320px"
                alt="${product.title}"
                loading="lazy"
                class="j-product-card__img${index === 0 ? " is-active" : ""}"
              >
            `;
          })
          .join("");

        return `
        <div class="j-product-card">

          <div class="j-product-card__image"${images.length > 1 ? " data-auto-cycle" : ""}>

            <a href="${product.url}" class="j-product-card__image-link" tabindex="-1" aria-hidden="true">
              ${imagesHtml}
            </a>

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

          <a href="${product.url}" class="j-product-card__link">
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
        return null;
      }
    }),
  );

  const validCards = cardHtmlList.filter(Boolean);

  // Distinct from the "0 stored handles" case above: this is a shopper
  // with 1+ handles saved whose products have ALL since been deleted/
  // unpublished (each fetch 404s, every entry above becomes null) — an
  // easy scenario for a returning visitor days later. Without this, the
  // "Recently Viewed" heading (rendered by
  // sections/recently-viewed-products.liquid, outside this container)
  // was left sitting over a blank grid instead of the same message used
  // when there's nothing saved at all.
  if (!validCards.length) {
    showEmptyState();
    return;
  }

  container.innerHTML = validCards.join("");

  if (window.JerryWishlist) {
    window.JerryWishlist.sync(container);
  }

  if (window.JerryProductCardCycle) {
    window.JerryProductCardCycle(container);
  }
}

document.addEventListener("DOMContentLoaded", initRecentlyViewed);

// The theme editor swaps this section's markup via AJAX on every
// settings change rather than reloading the page — without this, the
// freshly-swapped section stays a stale empty shell.
document.addEventListener("shopify:section:load", (event) => {
  if (event.target.querySelector("#RecentlyViewedProducts")) {
    initRecentlyViewed();
  }
});
