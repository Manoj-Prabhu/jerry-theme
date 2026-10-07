document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "jerry-wishlist";

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
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
        (
          strings.removeFromWishlistHtml || "Remove __TITLE__ from Wishlist"
        ).replace("__TITLE__", title),
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

  const HEART_BURST_COUNT = 7;
  const HEART_BURST_DURATION_MS = 1400;

  function spawnHeartBurst(button) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const card = button.closest(".j-product-card");
    if (!card) return;

    const burst = document.createElement("span");
    burst.className = "j-heart-burst";
    burst.setAttribute("aria-hidden", "true");

    for (let i = 0; i < HEART_BURST_COUNT; i += 1) {
      const particle = document.createElement("span");
      particle.className = "j-heart-burst__particle";
      particle.textContent = "♥";
      particle.style.setProperty(
        "--burst-x",
        `${Math.round((Math.random() - 0.5) * 80)}px`,
      );
      particle.style.setProperty(
        "--burst-y",
        `${Math.round(70 + Math.random() * 50)}px`,
      );
      particle.style.setProperty(
        "--burst-rotate",
        `${Math.round((Math.random() - 0.5) * 50)}deg`,
      );
      particle.style.setProperty(
        "--burst-size",
        `${Math.round(14 + Math.random() * 10)}px`,
      );
      particle.style.setProperty("--burst-delay", `${i * 50}ms`);
      burst.appendChild(particle);
    }

    card.appendChild(burst);
    setTimeout(() => burst.remove(), HEART_BURST_DURATION_MS);
  }

  function updateWishlistCount() {
    const count = document.getElementById("WishlistCount");
    if (!count) return;
    const wishlist = getWishlist();
    count.textContent = wishlist.length;
    count.hidden = wishlist.length === 0;

    const wishlistButton = document.querySelector(".j-header__wishlist");
    if (wishlistButton) {
      wishlistButton.classList.toggle("has-items", wishlist.length > 0);
    }
  }

  function syncWishlistButtons(root = document) {
    const wishlist = getWishlist();

    root.querySelectorAll(".j-wishlist-button").forEach((button) => {
      updateButton(button, wishlist.includes(button.dataset.handle));
    });
  }

  window.JerryWishlist = { sync: syncWishlistButtons };
  const PRUNE_CHECK_KEY = "jerry-wishlist-pruned-at";
  const PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000;

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
        fetch(window.themeRoutes.product(handle)).then(
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
    let added = true;

    if (wishlist.includes(handle)) {
      wishlist = wishlist.filter((item) => item !== handle);
      updateButton(button, false);
      added = false;
    } else {
      wishlist.push(handle);
      updateButton(button, true);
      spawnHeartBurst(button);
    }

    saveWishlist(wishlist);
    updateWishlistCount();
    document.dispatchEvent(
      new CustomEvent("jerry:wishlist-changed", { detail: { handle, added } }),
    );
  });
});
