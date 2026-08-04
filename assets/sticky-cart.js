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

  window.addEventListener("scroll", toggleStickyCart);
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
