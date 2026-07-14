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

  function renderCartItems(cartItems, cart) {
    if (cart.items.length === 0) {
      const continueUrl = cartItems.dataset.continueShoppingUrl || "/";

      cartItems.innerHTML = `
        <p class="j-cart__empty">
          Your cart is empty.
        </p>
        <a href="${continueUrl}" class="j-button j-cart__continue">
          Continue Shopping
        </a>
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
  }

  function renderCart(cart) {
    document
      .querySelectorAll(".j-cart-items")
      .forEach((cartItems) => renderCartItems(cartItems, cart));

    document.querySelectorAll(".j-cart-subtotal-value").forEach((subtotal) => {
      subtotal.textContent = formatMoney(cart.total_price);
    });

    const isEmpty = cart.items.length === 0;

    document.querySelectorAll(".j-cart-checkout-button").forEach((button) => {
      button.disabled = isEmpty;
    });

    document.querySelectorAll(".j-cart-view-link").forEach((link) => {
      link.classList.toggle("is-disabled", isEmpty);
      link.setAttribute("aria-disabled", isEmpty);
      link.tabIndex = isEmpty ? -1 : 0;
    });

    document.querySelectorAll(".j-cart-page").forEach((page) => {
      page.classList.toggle("is-empty", isEmpty);
    });

    document.querySelectorAll(".j-cart-page__count").forEach((count) => {
      count.textContent = `${cart.item_count} ${cart.item_count === 1 ? "item" : "items"}`;
    });

    document.querySelectorAll(".j-cart-page__shipping-bar").forEach((bar) => {
      const threshold = Number(bar.dataset.freeShippingThreshold);
      if (!threshold) return;

      const remaining = threshold - cart.total_price;
      const unlocked = remaining <= 0;
      const percent = unlocked ? 100 : Math.min(100, (cart.total_price / threshold) * 100);

      bar.classList.toggle("is-unlocked", unlocked);

      const message = bar.querySelector(".j-cart-page__shipping-message");
      if (message) {
        message.innerHTML = unlocked
          ? "🎉 You've unlocked free shipping!"
          : `Add <strong>${formatMoney(remaining)}</strong> more to unlock free shipping`;
      }

      const fill = bar.querySelector(".j-cart-page__shipping-fill");
      if (fill) {
        fill.style.width = `${percent}%`;
      }
    });
  }

  // Event delegation: bound once so re-rendering the cart never
  // stacks duplicate listeners on repeat clicks.
  document.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".j-cart-remove");
    if (removeButton) {
      removeCartItem(removeButton.dataset.key);
      return;
    }

    const minusButton = event.target.closest(".j-cart-qty-minus");
    if (minusButton) {
      const quantity = Number(minusButton.dataset.quantity);

      if (quantity > 1) {
        updateCartQuantity(minusButton.dataset.key, quantity - 1);
      }
      return;
    }

    const plusButton = event.target.closest(".j-cart-qty-plus");
    if (plusButton) {
      const quantity = Number(plusButton.dataset.quantity);

      updateCartQuantity(plusButton.dataset.key, quantity + 1);
    }
  });

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
