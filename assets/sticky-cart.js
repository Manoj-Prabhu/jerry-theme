// addToCartButton/stickyButton/variantInput are re-looked-up every call,
// but toggleStickyCart() needs to read the CURRENT button's position on
// every scroll frame — kept at module scope so the one scroll listener
// (bound once, below) always checks against whichever button is
// currently in the DOM rather than a stale reference from a prior init.
let stickyCartEl = null;
let stickyCartAddToCartButton = null;

function toggleStickyCart() {
  if (!stickyCartEl || !stickyCartAddToCartButton) return;

  const buttonRect = stickyCartAddToCartButton.getBoundingClientRect();

  if (buttonRect.bottom < 0) {
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
