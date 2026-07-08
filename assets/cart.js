/* ==========================================================
   Jerry Theme Cart Drawer
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const drawer = document.querySelector(".j-cart-drawer");
  const overlay = document.querySelector(".j-cart-overlay");
  const closeButton = document.querySelector(".j-cart__close");
  const cartButton = document.querySelector(".j-header__cart");
  const productForm = document.querySelector(".j-product-form");

  // Open Drawer
  function openCartDrawer() {
    if (drawer) {
      drawer.classList.add("is-open");
    }
  }

  // Close Drawer
  function closeCartDrawer() {
    if (drawer) {
      drawer.classList.remove("is-open");
    }
  }

  // Format Money
  function formatMoney(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  // Render Cart
  function renderCart(cart) {
    const cartItems = document.getElementById("CartItems");
    const subtotal = document.getElementById("CartSubtotal");

    if (!cartItems) return;

    if (cart.items.length === 0) {
      cartItems.innerHTML = `
        <p class="j-cart__empty">
          Your cart is empty.
        </p>
      `;
    } else {
      cartItems.innerHTML = cart.items
        .map(
          (item) => `
        <div class="j-cart-item">

          <div class="j-cart-item__image">
            <img
              src="${item.image}"
              alt="${item.product_title}"
              width="80"
            >
          </div>

          <div class="j-cart-item__content">
            <h4>${item.product_title}</h4>
            <p>${formatMoney(item.final_price)}</p>

            <div class="j-cart-item__quantity">
              <button
                class="j-cart-qty-minus"
                data-key="${item.key}"
                data-quantity="${item.quantity}"
              >
                −
              </button>

              <span>${item.quantity}</span>

              <button
                class="j-cart-qty-plus"
                data-key="${item.key}"
                data-quantity="${item.quantity}"
              >
                +
              </button>
            </div>
            <button
              class="j-cart-remove"
              data-key="${item.key}"
            >
              Remove
            </button>
          </div>

        </div>
      `,
        )
        .join("");
    }

    if (subtotal) {
      subtotal.textContent = formatMoney(cart.total_price);
    }

    document.querySelectorAll(".j-cart-remove").forEach((button) => {
      button.addEventListener("click", () => {
        removeCartItem(button.dataset.key);
      });
    });

    document.querySelectorAll(".j-cart-qty-minus").forEach((button) => {
      button.addEventListener("click", () => {
        const quantity = Number(button.dataset.quantity);

        if (quantity > 1) {
          updateCartQuantity(button.dataset.key, quantity - 1);
        }
      });
    });

    document.querySelectorAll(".j-cart-qty-plus").forEach((button) => {
      button.addEventListener("click", () => {
        const quantity = Number(button.dataset.quantity);

        updateCartQuantity(button.dataset.key, quantity + 1);
      });
    });
  }

  function updateCartCount(cart) {
    const cartCount = document.getElementById("CartCount");

    if (!cartCount) return;

    cartCount.textContent = cart.item_count;
  }

  async function removeCartItem(itemKey) {
    try {
      await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: itemKey,
          quantity: 0,
        }),
      });

      const cartResponse = await fetch("/cart.js");
      const cart = await cartResponse.json();

      renderCart(cart);
      updateCartCount(cart);
    } catch (error) {
      console.error(error);
    }
  }

  async function updateCartQuantity(itemKey, quantity) {
    try {
      await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: itemKey,
          quantity: quantity,
        }),
      });

      const cartResponse = await fetch("/cart.js");
      const cart = await cartResponse.json();

      renderCart(cart);
      updateCartCount(cart);
    } catch (error) {
      console.error(error);
    }
  }

  // Header Cart
  if (cartButton) {
    cartButton.addEventListener("click", openCartDrawer);
  }

  // Close Button
  if (closeButton) {
    closeButton.addEventListener("click", closeCartDrawer);
  }

  // Overlay
  if (overlay) {
    overlay.addEventListener("click", closeCartDrawer);
  }

  // AJAX Add to Cart
  if (productForm) {
    productForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const variantInput = productForm.querySelector('[name="id"]');
      const quantityInput = productForm.querySelector('[name="quantity"]');

      const variantId = Number(variantInput.value);
      const quantity = Number(quantityInput.value);

      try {
        const response = await fetch("/cart/add.js", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [
              {
                id: variantId,
                quantity: quantity,
              },
            ],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("Cart Error:", error);

          throw new Error(error.description || "Failed to add product");
        }

        await response.json();

        const cartResponse = await fetch("/cart.js");
        const cart = await cartResponse.json();

        renderCart(cart);
        updateCartCount(cart);

        openCartDrawer();
      } catch (error) {
        console.error(error);
      }
    });
  }
});
