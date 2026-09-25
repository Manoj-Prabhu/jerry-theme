// Renders the wishlist page's product grid — mirrors
// recently-viewed.js's approach (localStorage handles -> fetch each via
// the Product JS API -> render once), reading the "jerry-wishlist" key
// instead of "jerry-recently-viewed". See wishlist.js for where that key
// is written.
//
// Pagination and filters reuse main-collection.liquid's markup/classes
// (collection.css supplies all the visual styling, collection.js the
// mobile filter-drawer open/close behavior) but run entirely client-side:
// there's no Shopify collection or Search & Discovery filter object
// behind an arbitrary, per-visitor localStorage product list, so the
// filter options (product type / vendor / price) are derived from
// whatever's actually in the wishlist, and paging just slices the array.
const WISHLIST_STORAGE_KEY = "jerry-wishlist";
const WISHLIST_IMAGE_WIDTHS = [200, 350, 500, 600, 700];
const WISHLIST_PAGE_SIZE = 8;

let wishlistProducts = [];
let filteredProducts = [];
let currentPage = 1;
let currentSort = "featured";
let activeFilters = { types: new Set(), vendors: new Set(), minPrice: null, maxPrice: null };

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

function buildPaginationHtml(totalPages) {
  const strings = window.themeStrings || {};

  if (totalPages <= 1) return "";

  const pages = [];
  for (let page = 1; page <= totalPages; page += 1) {
    const isEdge = page === 1 || page === totalPages;
    const isNeighbor = Math.abs(page - currentPage) <= 1;
    if (isEdge || isNeighbor) {
      pages.push(page);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  const itemsHtml = pages
    .map((page) =>
      page === "…"
        ? `<li><span class="j-pagination__item j-pagination__item--gap">…</span></li>`
        : `<li>${
            page === currentPage
              ? `<span class="j-pagination__item j-pagination__item--current" aria-current="page">${page}</span>`
              : `<button type="button" class="j-pagination__item" data-page="${page}">${page}</button>`
          }</li>`,
    )
    .join("");

  const prevDisabled = currentPage === 1;
  const nextDisabled = currentPage === totalPages;

  return `
    <nav class="j-pagination" role="navigation" aria-label="${strings.paginationLabel || "Pagination"}">
      ${
        prevDisabled
          ? `<span class="j-pagination__arrow j-pagination__arrow--prev is-disabled" role="link" aria-disabled="true">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 15 7.5 10l5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span aria-hidden="true">${strings.paginationPrev || "Prev"}</span>
            </span>`
          : `<button type="button" class="j-pagination__arrow j-pagination__arrow--prev" data-page="${currentPage - 1}">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 15 7.5 10l5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span aria-hidden="true">${strings.paginationPrev || "Prev"}</span>
            </button>`
      }
      <ul class="j-pagination__list">${itemsHtml}</ul>
      ${
        nextDisabled
          ? `<span class="j-pagination__arrow j-pagination__arrow--next is-disabled" role="link" aria-disabled="true">
              <span aria-hidden="true">${strings.paginationNext || "Next"}</span>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7.5 5 12.5 10l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>`
          : `<button type="button" class="j-pagination__arrow j-pagination__arrow--next" data-page="${currentPage + 1}">
              <span aria-hidden="true">${strings.paginationNext || "Next"}</span>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7.5 5 12.5 10l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>`
      }
    </nav>
  `;
}

function showWishlistEmptyState(reason) {
  const strings = window.themeStrings || {};
  const empty = document.getElementById("WishlistPageEmpty");
  const emptyText = document.getElementById("WishlistPageEmptyText");
  if (emptyText) {
    emptyText.textContent =
      reason === "filters"
        ? strings.wishlistNoFilterMatches || "No wishlist items match the selected filters."
        : strings.wishlistEmpty || "Your wishlist is empty. Tap the heart on any product to save it here.";
  }
  if (empty) empty.hidden = false;

  const container = document.getElementById("WishlistPageProducts");
  if (container) container.innerHTML = "";
}

function hideWishlistEmptyState() {
  const empty = document.getElementById("WishlistPageEmpty");
  if (empty) empty.hidden = true;
}

function productMatchesFilters(product) {
  if (activeFilters.types.size && !activeFilters.types.has(product.type)) return false;
  if (activeFilters.vendors.size && !activeFilters.vendors.has(product.vendor)) return false;

  const price = product.price / 100;
  if (activeFilters.minPrice != null && price < activeFilters.minPrice) return false;
  if (activeFilters.maxPrice != null && price > activeFilters.maxPrice) return false;

  return true;
}

function sortProducts(products) {
  const sorted = [...products];

  switch (currentSort) {
    case "price-ascending":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-descending":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "title-ascending":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "title-descending":
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
    default:
      // "featured" — the order products were added to the wishlist, i.e.
      // wishlistProducts' own fetch order (no separate merchant-curated
      // sequence exists for a localStorage-only product list).
      break;
  }

  return sorted;
}

function recomputeFilteredProducts() {
  filteredProducts = sortProducts(wishlistProducts.filter(productMatchesFilters));
}

function hasActiveFilters() {
  return (
    activeFilters.types.size > 0 ||
    activeFilters.vendors.size > 0 ||
    activeFilters.minPrice != null ||
    activeFilters.maxPrice != null
  );
}

function renderCurrentPage() {
  const container = document.getElementById("WishlistPageProducts");
  if (!container) return;

  if (!filteredProducts.length) {
    showWishlistEmptyState(wishlistProducts.length ? "filters" : "empty");
    return;
  }

  hideWishlistEmptyState();

  const totalPages = Math.ceil(filteredProducts.length / WISHLIST_PAGE_SIZE);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = (currentPage - 1) * WISHLIST_PAGE_SIZE;
  const pageItems = filteredProducts.slice(start, start + WISHLIST_PAGE_SIZE);

  container.innerHTML = pageItems.map(renderWishlistCard).join("") + buildPaginationHtml(totalPages);

  if (window.JerryWishlist) window.JerryWishlist.sync(container);
  if (window.JerryProductCardCycle) window.JerryProductCardCycle(container);
}

function restoreFilterPanelState() {
  const panel = document.getElementById("WishlistFiltersPanel");
  if (!panel) return;

  panel.querySelectorAll('input[data-filter-group="type"]').forEach((checkbox) => {
    checkbox.checked = activeFilters.types.has(checkbox.value);
  });
  panel.querySelectorAll('input[data-filter-group="vendor"]').forEach((checkbox) => {
    checkbox.checked = activeFilters.vendors.has(checkbox.value);
  });

  const minInput = document.getElementById("WishlistPriceMin");
  const maxInput = document.getElementById("WishlistPriceMax");
  if (minInput) minInput.value = activeFilters.minPrice ?? "";
  if (maxInput) maxInput.value = activeFilters.maxPrice ?? "";

  const clearButton = document.getElementById("WishlistFiltersClear");
  if (clearButton) clearButton.hidden = !hasActiveFilters();
}

function applyFiltersFromPanel() {
  const panel = document.getElementById("WishlistFiltersPanel");
  if (!panel) return;

  const types = new Set(
    Array.from(panel.querySelectorAll('input[data-filter-group="type"]:checked')).map((el) => el.value),
  );
  const vendors = new Set(
    Array.from(panel.querySelectorAll('input[data-filter-group="vendor"]:checked')).map((el) => el.value),
  );

  const minInput = document.getElementById("WishlistPriceMin");
  const maxInput = document.getElementById("WishlistPriceMax");
  const minPrice = minInput && minInput.value !== "" ? Number(minInput.value) : null;
  const maxPrice = maxInput && maxInput.value !== "" ? Number(maxInput.value) : null;

  activeFilters = { types, vendors, minPrice, maxPrice };

  currentPage = 1;
  recomputeFilteredProducts();
  renderCurrentPage();
  restoreFilterPanelState();
}

function clearFilters() {
  activeFilters = { types: new Set(), vendors: new Set(), minPrice: null, maxPrice: null };
  currentPage = 1;
  recomputeFilteredProducts();
  renderCurrentPage();
  restoreFilterPanelState();
}

function buildFilterPanel() {
  const strings = window.themeStrings || {};
  const panel = document.getElementById("WishlistFiltersPanel");
  const toggle = document.getElementById("WishlistFilterToggle");
  if (!panel) return;

  const types = [...new Set(wishlistProducts.map((product) => product.type).filter(Boolean))].sort();
  const vendors = [...new Set(wishlistProducts.map((product) => product.vendor).filter(Boolean))].sort();
  const prices = wishlistProducts.map((product) => product.price / 100);
  const minPrice = Math.floor(Math.min(...prices));
  const maxPrice = Math.ceil(Math.max(...prices));

  const canFilterByType = types.length > 1;
  const canFilterByVendor = vendors.length > 1;
  const canFilterByPrice = minPrice !== maxPrice;

  if (!canFilterByType && !canFilterByVendor && !canFilterByPrice) {
    if (toggle) toggle.hidden = true;
    return;
  }

  if (toggle) toggle.hidden = false;

  const optionsHtml = (group, values) =>
    values
      .map(
        (value) => `
          <label class="j-filter__option">
            <input type="checkbox" data-filter-group="${group}" value="${value}">
            <span class="j-filter__option-label">${value}</span>
          </label>
        `,
      )
      .join("");

  panel.innerHTML = `
    <div class="j-collection-filters__header">
      <h2>${strings.filtersTitle || "Filters"}</h2>
      <div class="j-collection-filters__header-actions">
        <button type="button" class="j-collection-filters__clear" id="WishlistFiltersClear" hidden>
          ${strings.filtersClearAll || "Clear all"}
        </button>
        <button type="button" class="j-collection-filters__close" aria-label="${strings.filtersClose || "Close filters"}">✕</button>
      </div>
    </div>

    <form id="WishlistFiltersForm">
      ${
        canFilterByType
          ? `<details class="j-filter" open>
              <summary>${strings.filtersProductType || "Product type"}</summary>
              <div class="j-filter__values">${optionsHtml("type", types)}</div>
            </details>`
          : ""
      }
      ${
        canFilterByVendor
          ? `<details class="j-filter" open>
              <summary>${strings.filtersVendor || "Brand"}</summary>
              <div class="j-filter__values">${optionsHtml("vendor", vendors)}</div>
            </details>`
          : ""
      }
      ${
        canFilterByPrice
          ? `<details class="j-filter" open>
              <summary>${strings.filtersPrice || "Price"}</summary>
              <div class="j-filter__values">
                <div class="j-filter__price-range">
                  <div class="j-filter__price-input">
                    <span>${strings.currencySymbol || "$"}</span>
                    <input type="number" id="WishlistPriceMin" placeholder="${minPrice}">
                  </div>
                  <span class="j-filter__price-separator">${strings.filtersTo || "to"}</span>
                  <div class="j-filter__price-input">
                    <span>${strings.currencySymbol || "$"}</span>
                    <input type="number" id="WishlistPriceMax" placeholder="${maxPrice}">
                  </div>
                </div>
              </div>
            </details>`
          : ""
      }
      <button type="submit" class="j-button j-collection-filters__apply">
        ${strings.filtersApply || "Apply Filters"}
      </button>
    </form>
  `;

  const form = document.getElementById("WishlistFiltersForm");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      applyFiltersFromPanel();
    });
  }

  panel.querySelectorAll('input[data-filter-group]').forEach((checkbox) => {
    checkbox.addEventListener("change", applyFiltersFromPanel);
  });

  const clearButton = document.getElementById("WishlistFiltersClear");
  if (clearButton) clearButton.addEventListener("click", clearFilters);
}

function handlePaginationClick(event) {
  const target = event.target.closest("[data-page]");
  if (!target) return;

  currentPage = Number(target.dataset.page);
  renderCurrentPage();

  const container = document.getElementById("WishlistPageProducts");
  if (container) container.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function initWishlistPage() {
  const container = document.getElementById("WishlistPageProducts");
  if (!container) return;

  container.addEventListener("click", handlePaginationClick);

  const sortSelect = document.getElementById("WishlistSortBy");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      currentSort = sortSelect.value;
      currentPage = 1;
      recomputeFilteredProducts();
      renderCurrentPage();
    });
  }

  const handles = getWishlistHandles();

  if (!handles.length) {
    showWishlistEmptyState("empty");
    return;
  }

  const fetchedProducts = await Promise.all(
    handles.map(async (handle) => {
      try {
        const response = await fetch(`/products/${handle}.js`);
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error(error);
        return null;
      }
    }),
  );

  wishlistProducts = fetchedProducts.filter(Boolean);

  if (!wishlistProducts.length) {
    // Every stored handle 404'd (products deleted/unpublished since
    // being saved) — same "nothing left to show" outcome as never
    // having saved anything, so it gets the same empty state rather
    // than a silently blank grid.
    showWishlistEmptyState("empty");
    return;
  }

  buildFilterPanel();
  recomputeFilteredProducts();
  renderCurrentPage();
}

document.addEventListener("DOMContentLoaded", initWishlistPage);

// Clicking a card's own heart button on this page removes it — react
// immediately instead of leaving a now-unwishlisted card sitting there
// until the visitor reloads. See wishlist.js, which dispatches this
// after updating localStorage.
document.addEventListener("jerry:wishlist-changed", (event) => {
  const container = document.getElementById("WishlistPageProducts");
  if (!container || event.detail.added) return; // only removals affect this page

  wishlistProducts = wishlistProducts.filter((product) => product.handle !== event.detail.handle);

  buildFilterPanel();
  recomputeFilteredProducts();
  renderCurrentPage();
  restoreFilterPanelState();
});
