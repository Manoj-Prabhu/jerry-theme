// addToCartButton/stickyButton/variantInput are re-looked-up every call,
// but toggleStickyCart() needs to read the CURRENT button's position on
// every scroll frame — kept at module scope so the one scroll listener
// (bound once, below) always checks against whichever button is
// currently in the DOM rather than a stale reference from a prior init.
let stickyCartEl = null;
let stickyCartAddToCartButton = null;

// Cached once, not re-queried on every scroll frame — the footer element
// itself never changes across a page's lifetime the way section content
// can.
let stickyCartFooterEl = null;

function toggleStickyCart() {
  if (!stickyCartEl || !stickyCartAddToCartButton) return;

  const buttonRect = stickyCartAddToCartButton.getBoundingClientRect();
  const pastAddToCart = buttonRect.bottom < 0;

  // Without this, the bar stayed visible for the entire rest of the page
  // once shown — including over "You may also like"/"Recently Viewed"
  // and, worst, permanently covering the footer's newsletter signup for
  // anyone who scrolls that far, since the original Add to Cart button
  // was still off-screen above. Hiding it once the footer comes into
  // view matches the pattern almost every sticky-cart implementation
  // uses, and there's no reason to keep nudging someone to buy once
  // they've reached the very bottom of the page.
  if (!stickyCartFooterEl) {
    stickyCartFooterEl = document.querySelector(".j-footer");
  }
  const footerVisible = stickyCartFooterEl
    ? stickyCartFooterEl.getBoundingClientRect().top < window.innerHeight
    : false;

  if (pastAddToCart && !footerVisible) {
    stickyCartEl.classList.add("is-visible");
  } else {
    stickyCartEl.classList.remove("is-visible");
  }
}

let stickyCartScrollListenerBound = false;

function initStickyCart() {
  const stickyCart = document.getElementById("StickyCart");
  const addToCartButton = document.getElementById("AddToCartButton");
  const stickyButton = document.getElementById("StickyAddToCart");
  const variantInput = document.getElementById("SelectedVariant");

  if (!stickyCart || !addToCartButton || !stickyButton || !variantInput) {
    return;
  }

  stickyCartEl = stickyCart;
  stickyCartAddToCartButton = addToCartButton;

  // Deferring the geometry read to the next animation frame means it runs
  // after any other scroll listener's style writes (e.g. header.js's
  // sticky-header classList toggle) have already been batched by the
  // browser, instead of forcing a synchronous reflow mid-scroll-event.
  //
  // Bound once, ever, at module scope — this listens on `window` itself
  // (never replaced by a section reload), so re-running init on every
  // shopify:section:load would otherwise stack a duplicate listener each
  // time instead of just picking up the new elements via the module-
  // scoped references above.
  if (!stickyCartScrollListenerBound) {
    stickyCartScrollListenerBound = true;
    let ticking = false;

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;

        requestAnimationFrame(() => {
          toggleStickyCart();
          ticking = false;
        });
      },
      { passive: true },
    );
  }

  toggleStickyCart();

  stickyButton.addEventListener("click", async () => {
    const variantId = Number(variantInput.value);

    try {
      stickyButton.disabled = true;

      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: variantId,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data.description || "Unable to add product.");
        return;
      }

      // Cosmetic only — see assets/fly-to-cart.js. Uses the sticky bar's
      // own small product thumbnail as the flying source, since that's
      // what's actually visible near the top of the viewport at the
      // moment this button is clicked (the main gallery image may be
      // scrolled out of view by then).
      if (typeof window.JerryFlyToCart === "function") {
        try {
          const sourceImg = document.querySelector(".j-sticky-cart__image img");
          window.JerryFlyToCart(sourceImg);
        } catch (error) {
          /* no-op — purely decorative */
        }
      }

      const cartButton = document.querySelector(".j-header__cart");
      if (cartButton) cartButton.click();
    } catch (error) {
      console.error(error);
    } finally {
      stickyButton.disabled = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", initStickyCart);

// See product-variants.js for why this listener is needed — without it,
// the sticky Add to Cart button stops working after any edit to the
// product section in the theme editor.
document.addEventListener("shopify:section:load", (event) => {
  if (event.target.querySelector("#StickyCart")) {
    initStickyCart();
  }
});
