document.addEventListener("DOMContentLoaded", () => {
  const stickyCart = document.getElementById("StickyCart");
  const addToCartButton = document.getElementById("AddToCartButton");
  const stickyButton = document.getElementById("StickyAddToCart");
  const variantInput = document.getElementById("SelectedVariant");

  if (!stickyCart || !addToCartButton || !stickyButton || !variantInput) {
    return;
  }

  function toggleStickyCart() {
    const buttonRect = addToCartButton.getBoundingClientRect();

    if (buttonRect.bottom < 0) {
      stickyCart.classList.add("is-visible");
    } else {
      stickyCart.classList.remove("is-visible");
    }
  }

  // Deferring the geometry read to the next animation frame means it runs
  // after any other scroll listener's style writes (e.g. header.js's
  // sticky-header classList toggle) have already been batched by the
  // browser, instead of forcing a synchronous reflow mid-scroll-event.
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
});
