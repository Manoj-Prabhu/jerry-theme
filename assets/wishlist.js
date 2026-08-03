/* ==========================================================
   Jerry Theme Wishlist
========================================================== */

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

  // The initial DOM scan isn't needed for first paint (buttons render in
  // their default "not wishlisted" state either way) — deferring it to
  // idle time keeps it off the critical main-thread work during load.
  const runInitialSync = () => {
    syncWishlistButtons();
    updateWishlistCount();
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
