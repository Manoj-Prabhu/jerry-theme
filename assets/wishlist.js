document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "jerry-wishlist";

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
      /* localStorage unavailable (private browsing, in-app webview, etc.) */
      return [];
    }
  }

  function saveWishlist(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      /* no-op */
    }
  }

  function updateButton(button, active) {
    const title = button.dataset.productTitle || "";
    const strings = window.themeStrings || {};

    if (active) {
      button.classList.add("is-active");
      button.textContent = "♥";
      button.setAttribute("aria-pressed", "true");
      button.setAttribute(
        "aria-label",
        (strings.removeFromWishlistHtml || "Remove __TITLE__ from Wishlist").replace(
          "__TITLE__",
          title,
        ),
      );
    } else {
      button.classList.remove("is-active");
      button.textContent = "♡";
      button.setAttribute("aria-pressed", "false");
      button.setAttribute(
        "aria-label",
        (strings.addToWishlistHtml || "Add __TITLE__ to Wishlist").replace(
          "__TITLE__",
          title,
        ),
      );
    }
  }

  function updateWishlistCount() {
    const count = document.getElementById("WishlistCount");
    if (!count) return;
    const wishlist = getWishlist();
    count.textContent = wishlist.length;
    count.hidden = wishlist.length === 0;
  }

  function syncWishlistButtons(root = document) {
    const wishlist = getWishlist();

    root.querySelectorAll(".j-wishlist-button").forEach((button) => {
      updateButton(button, wishlist.includes(button.dataset.handle));
    });
  }

  // Re-sync buttons whenever product cards are injected dynamically
  // (predictive search results, product recommendations, etc.)
  window.JerryWishlist = { sync: syncWishlistButtons };

  // Saved handles never expire on their own — if a merchant deletes a
  // product (or a whole test catalog) after a visitor wishlisted it, that
  // handle just sits in localStorage forever, inflating the header count
  // for a product that no longer exists. Cross-checking against the
  // store's actual product list on load prunes anything stale, so the
  // count only ever reflects products that still exist. Runs at most once
  // per day per visitor (not on every page load) since it costs a network
  // request; failures are silent and leave the existing wishlist alone.
  const PRUNE_CHECK_KEY = "jerry-wishlist-pruned-at";
  const PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000;

  // A single /products.json request only ever returns one page (max 250
  // products) — stores with a larger catalog would have anything past the
  // first page wrongly pruned as "deleted". Checking each wishlisted
  // handle individually via /products/{handle}.js instead scales with the
  // wishlist size (typically a handful of items) rather than the catalog
  // size, and needs no pagination.
  function pruneWishlistAgainstCatalog() {
    const wishlist = getWishlist();
    if (wishlist.length === 0) return;

    let lastPruned = 0;
    try {
      lastPruned = Number(localStorage.getItem(PRUNE_CHECK_KEY)) || 0;
    } catch (error) {
      /* localStorage unavailable — treat as never pruned, still safe to skip below */
    }
    if (Date.now() - lastPruned < PRUNE_INTERVAL_MS) return;

    Promise.all(
      wishlist.map((handle) =>
        fetch(`/products/${handle}.js`).then(
          (response) => response.ok,
          () => true, // network error: assume it still exists, don't prune
        ),
      ),
    )
      .then((results) => {
        const pruned = wishlist.filter((_handle, index) => results[index]);

        if (pruned.length !== wishlist.length) {
          saveWishlist(pruned);
          syncWishlistButtons();
          updateWishlistCount();
        }

        try {
          localStorage.setItem(PRUNE_CHECK_KEY, String(Date.now()));
        } catch (error) {
          /* no-op */
        }
      })
      .catch(() => {});
  }

  // The initial DOM scan isn't needed for first paint (buttons render in
  // their default "not wishlisted" state either way) — deferring it to
  // idle time keeps it off the critical main-thread work during load.
  const runInitialSync = () => {
    syncWishlistButtons();
    updateWishlistCount();
    pruneWishlistAgainstCatalog();
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(runInitialSync, { timeout: 2000 });
  } else {
    setTimeout(runInitialSync, 200);
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".j-wishlist-button");

    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    const handle = button.dataset.handle;
    let wishlist = getWishlist();

    if (wishlist.includes(handle)) {
      wishlist = wishlist.filter((item) => item !== handle);
      updateButton(button, false);
    } else {
      wishlist.push(handle);
      updateButton(button, true);
    }

    saveWishlist(wishlist);
    updateWishlistCount();
  });
});
