/* ==========================================================
   Jerry Theme Cart Drawer
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const drawer = document.querySelector(".j-cart-drawer");
  const overlay = document.querySelector(".j-cart-overlay");
  const closeButton = document.querySelector(".j-cart__close");
  const cartButton = document.querySelector(".j-header__cart");
  const productForm = document.querySelector(".j-product-form");

  // -------------------------
  // Drawer
  // -------------------------

  function openCartDrawer() {
    if (drawer) {
      drawer.classList.add("is-open");
    }
  }

  function closeCartDrawer() {
    if (drawer) {
      drawer.classList.remove("is-open");
    }
  }

  // -------------------------
  // Loading
  // -------------------------

  function setLoading(isLoading) {
    document
      .querySelectorAll(
        ".j-product-form button, .j-cart-remove, .j-cart-qty-plus, .j-cart-qty-minus",
      )
      .forEach((button) => {
        button.disabled = isLoading;
      });
  }

  // -------------------------
  // Money
  // -------------------------

  function formatMoney(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  // -------------------------
  // Header Cart Count
  // -------------------------

  function updateCartCount(cart) {
    const cartCount = document.getElementById("CartCount");

    if (!cartCount) return;

    if (cart.item_count > 0) {
      cartCount.textContent = cart.item_count;
      cartCount.hidden = false;
    } else {
      cartCount.hidden = true;
      cartCount.textContent = "";
    }
  }

  // -------------------------
  // Render Cart
  // -------------------------

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

            <div class="j-cart-item__top">
              <h4>${item.product_title}</h4>

              <button
                class="j-cart-remove"
                data-key="${item.key}"
                aria-label="Remove ${item.product_title}"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0 1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>

            <p>${formatMoney(item.final_price)}</p>

            <div class="j-cart-item__quantity">

              <button
                class="j-cart-qty-minus"
                data-key="${item.key}"
                data-quantity="${item.quantity}"
                aria-label="Decrease quantity"
              >
                −
              </button>

              <span>${item.quantity}</span>

              <button
                class="j-cart-qty-plus"
                data-key="${item.key}"
                data-quantity="${item.quantity}"
                aria-label="Increase quantity"
              >
                +
              </button>

            </div>

          </div>

        </div>
      `,
        )
        .join("");
    }

    if (subtotal) {
      subtotal.textContent = formatMoney(cart.total_price);
    }

    // Remove

    document.querySelectorAll(".j-cart-remove").forEach((button) => {
      button.addEventListener("click", () => {
        removeCartItem(button.dataset.key);
      });
    });

    // Minus

    document.querySelectorAll(".j-cart-qty-minus").forEach((button) => {
      button.addEventListener("click", () => {
        const quantity = Number(button.dataset.quantity);

        if (quantity > 1) {
          updateCartQuantity(button.dataset.key, quantity - 1);
        }
      });
    });

    // Plus

    document.querySelectorAll(".j-cart-qty-plus").forEach((button) => {
      button.addEventListener("click", () => {
        const quantity = Number(button.dataset.quantity);

        updateCartQuantity(button.dataset.key, quantity + 1);
      });
    });
  }

  // -------------------------
  // Refresh Cart
  // -------------------------

  async function refreshCart() {
    try {
      const response = await fetch("/cart.js");
      const cart = await response.json();

      renderCart(cart);
      updateCartCount(cart);
    } catch (error) {
      console.error(error);
    }
  }

  // -------------------------
  // Remove Item
  // -------------------------

  async function removeCartItem(itemKey) {
    try {
      setLoading(true);

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

      await refreshCart();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------
  // Update Quantity
  // -------------------------

  async function updateCartQuantity(itemKey, quantity) {
    try {
      setLoading(true);

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

      await refreshCart();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------
  // Drawer Events
  // -------------------------

  if (cartButton) {
    cartButton.addEventListener("click", async () => {
      await refreshCart();
      openCartDrawer();
    });
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeCartDrawer);
  }

  if (overlay) {
    overlay.addEventListener("click", closeCartDrawer);
  }

  // -------------------------
  // Checkout Redirect
  // -------------------------

  function redirectToCheckout() {
    const form = document.createElement("form");
    form.action = "/cart";
    form.method = "post";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "checkout";
    input.value = "Checkout";

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  }

  // -------------------------
  // AJAX Add To Cart
  // -------------------------

  if (productForm) {
    const formError = document.getElementById("ProductFormError");

    const showFormError = (message) => {
      if (!formError) return;
      formError.textContent = message;
      formError.hidden = false;
    };

    const clearFormError = () => {
      if (!formError) return;
      formError.textContent = "";
      formError.hidden = true;
    };

    productForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      clearFormError();

      const isBuyNow = event.submitter && event.submitter.id === "BuyNowButton";

      const variantId = Number(productForm.querySelector('[name="id"]').value);
      const quantity = Number(
        productForm.querySelector('[name="quantity"]').value,
      );

      if (!variantId || !quantity || quantity < 1) {
        showFormError("Please select a valid option and quantity.");
        return;
      }

      try {
        setLoading(true);

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
          throw new Error(error.description || "Unable to add item to cart.");
        }

        if (isBuyNow) {
          redirectToCheckout();
          return;
        }

        await refreshCart();
        openCartDrawer();
      } catch (error) {
        console.error(error);
        showFormError(error.message || "Unable to add item to cart.");
      } finally {
        setLoading(false);
      }
    });
  }

  // -------------------------
  // Initial Load
  // -------------------------

  refreshCart();
});
