document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "jerry-wishlist";

  function getWishlist() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }

  function saveWishlist(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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

  function pruneWishlistAgainstCatalog() {
    const wishlist = getWishlist();
    if (wishlist.length === 0) return;

    const lastPruned = Number(localStorage.getItem(PRUNE_CHECK_KEY)) || 0;
    if (Date.now() - lastPruned < PRUNE_INTERVAL_MS) return;

    fetch("/products.json?limit=250&fields=handle")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data.products)) return;

        const validHandles = new Set(data.products.map((p) => p.handle));
        const pruned = wishlist.filter((handle) => validHandles.has(handle));

        if (pruned.length !== wishlist.length) {
          saveWishlist(pruned);
          syncWishlistButtons();
          updateWishlistCount();
        }

        localStorage.setItem(PRUNE_CHECK_KEY, String(Date.now()));
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
