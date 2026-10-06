let stickyCartEl = null;
let stickyCartAddToCartButton = null;
let stickyCartFooterEl = null;

function toggleStickyCart() {
  if (!stickyCartEl || !stickyCartAddToCartButton) return;

  const buttonRect = stickyCartAddToCartButton.getBoundingClientRect();
  const pastAddToCart = buttonRect.bottom < 0;

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

      let flyToCartDone = Promise.resolve();
      if (typeof window.JerryFlyToCart === "function") {
        try {
          const sourceImg = document.querySelector(".j-sticky-cart__image img");
          flyToCartDone = window.JerryFlyToCart(sourceImg) || Promise.resolve();
        } catch (error) {
          /* no-op — purely decorative */
        }
      }

      await flyToCartDone;

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

document.addEventListener("shopify:section:load", (event) => {
  if (event.target.querySelector("#StickyCart")) {
    initStickyCart();
  }
});
