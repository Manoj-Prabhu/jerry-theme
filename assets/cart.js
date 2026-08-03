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

  let lastCartTrigger = null;

  function getDrawerFocusable() {
    return Array.from(
      drawer.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null);
  }

  function trapDrawerFocus(event) {
    if (event.key === "Escape") {
      closeCartDrawer();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getDrawerFocusable();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openCartDrawer() {
    if (!drawer) return;

    lastCartTrigger = document.activeElement;
    drawer.classList.add("is-open");
    document.documentElement.classList.add("j-scroll-lock");
    document.addEventListener("keydown", trapDrawerFocus);

    if (cartButton) cartButton.setAttribute("aria-expanded", "true");
    const main = document.getElementById("MainContent");
    if (main) main.setAttribute("aria-hidden", "true");

    if (closeButton) closeButton.focus();
  }

  function closeCartDrawer() {
    if (!drawer) return;

    drawer.classList.remove("is-open");
    document.documentElement.classList.remove("j-scroll-lock");
    document.removeEventListener("keydown", trapDrawerFocus);

    if (cartButton) cartButton.setAttribute("aria-expanded", "false");
    const main = document.getElementById("MainContent");
    if (main) main.removeAttribute("aria-hidden");

    if (lastCartTrigger) {
      lastCartTrigger.focus();
      lastCartTrigger = null;
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
  // Cart Notice
  // -------------------------

  let cartNoticeTimeout = null;

  function showCartNotice(message) {
    let notice = document.querySelector(".j-cart-notice");

    if (!notice) {
      notice = document.createElement("div");
      notice.className = "j-cart-notice";
      notice.setAttribute("role", "status");
      notice.setAttribute("aria-live", "polite");
      document.body.appendChild(notice);
    }

    notice.textContent = message;
    notice.classList.add("is-visible");

    clearTimeout(cartNoticeTimeout);
    cartNoticeTimeout = setTimeout(() => {
      notice.classList.remove("is-visible");
    }, 3500);
  }

  // -------------------------
  // Money
  // -------------------------

  const CONFETTI_COLORS = ["#ffd166", "#ef476f", "#06d6a0", "#118ab2", "#ffffff"];

  function launchConfetti(originEl) {
    if (!originEl || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const rect = originEl.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    const container = document.createElement("div");
    container.className = "j-confetti-burst";
    document.body.appendChild(container);

    const pieceCount = 34;

    for (let i = 0; i < pieceCount; i++) {
      const piece = document.createElement("i");
      piece.className = "j-confetti-piece";

      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * 120;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance - 40;
      const fall = 140 + Math.random() * 160;
      const rotate = Math.random() * 720 - 360;
      const size = 5 + Math.random() * 5;
      const duration = 900 + Math.random() * 500;
      const delay = Math.random() * 80;
      const color =
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const isCircle = Math.random() > 0.5;

      piece.style.left = `${originX}px`;
      piece.style.top = `${originY}px`;
      piece.style.width = `${size}px`;
      piece.style.height = `${size * (isCircle ? 1 : 1.6)}px`;
      piece.style.background = color;
      piece.style.borderRadius = isCircle ? "50%" : "1px";
      piece.style.setProperty("--tx", `${tx}px`);
      piece.style.setProperty("--ty", `${ty}px`);
      piece.style.setProperty("--fall", `${fall}px`);
      piece.style.setProperty("--rotate", `${rotate}deg`);
      piece.style.animationDuration = `${duration}ms`;
      piece.style.animationDelay = `${delay}ms`;

      container.appendChild(piece);
    }

    setTimeout(() => container.remove(), 1600);
  }

  function formatMoney(cents) {
    return window.formatMoney
      ? window.formatMoney(cents)
      : `$${(cents / 100).toFixed(2)}`;
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
    const strings = window.themeStrings || {};

    if (cart.items.length === 0) {
      const continueUrl = cartItems.dataset.continueShoppingUrl || "/";
      const emptyText = strings.cartEmpty || "Your cart is empty.";
      const continueText = strings.cartContinueShopping || "Continue Shopping";

      cartItems.innerHTML = `
        <p class="j-cart__empty">
          ${emptyText}
        </p>
        <a href="${continueUrl}" class="j-button j-cart__continue">
          ${continueText}
        </a>
      `;
    } else {
      const removeTemplate = strings.cartRemoveItemHtml || "Remove __TITLE__";
      const decreaseText = strings.cartDecreaseQuantity || "Decrease quantity";
      const increaseText = strings.cartIncreaseQuantity || "Increase quantity";

      cartItems.innerHTML = cart.items
        .map(
          (item) => `
        <div class="j-cart-item">

          <div class="j-cart-item__image">
            <img
              src="${item.image}"
              alt="${item.product_title}"
              width="80"
              height="80"
            >
          </div>

          <div class="j-cart-item__content">

            <div class="j-cart-item__top">
              <p class="j-cart-item__title">${item.product_title}</p>

              <button
                class="j-cart-remove"
                data-key="${item.key}"
                aria-label="${removeTemplate.replace("__TITLE__", item.product_title)}"
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
                aria-label="${decreaseText}"
              >
                −
              </button>

              <span>${item.quantity}</span>

              <button
                class="j-cart-qty-plus"
                data-key="${item.key}"
                data-quantity="${item.quantity}"
                aria-label="${increaseText}"
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
      const strings = window.themeStrings || {};
      const template =
        cart.item_count === 1
          ? strings.cartItemCountOne || `${cart.item_count} item`
          : strings.cartItemCountOther || `${cart.item_count} items`;

      count.textContent = template.replace(/\d+/, cart.item_count);
    });

    document.querySelectorAll(".j-cart-page__shipping-bar").forEach((bar) => {
      const threshold = Number(bar.dataset.freeShippingThreshold);
      if (!threshold) return;

      const remaining = threshold - cart.total_price;
      const unlocked = remaining <= 0;
      const percent = unlocked
        ? 100
        : Math.min(100, (cart.total_price / threshold) * 100);

      const justUnlocked = unlocked && !bar.classList.contains("is-unlocked");
      bar.classList.toggle("is-unlocked", unlocked);

      const message = bar.querySelector(".j-cart-page__shipping-message");
      if (message) {
        message.innerHTML = unlocked
          ? `<span class="j-cart-page__shipping-emoji">
              🎉
              <i class="j-spark"></i><i class="j-spark"></i><i class="j-spark"></i>
              <i class="j-spark"></i><i class="j-spark"></i><i class="j-spark"></i>
            </span> You've unlocked free shipping!`
          : `Add <strong>${formatMoney(remaining)}</strong> more to unlock free shipping`;
      }

      if (justUnlocked) {
        const emoji = bar.querySelector(".j-cart-page__shipping-emoji");
        if (emoji) {
          emoji.classList.remove("is-bursting");
          void emoji.offsetWidth;
          emoji.classList.add("is-bursting");
          launchConfetti(emoji);
        }
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

      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: itemKey,
          quantity: quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showCartNotice(data.description || data.message || "Unable to update quantity.");
      } else {
        const item = data.items.find((cartItem) => cartItem.key === itemKey);

        if (item && item.quantity < quantity) {
          showCartNotice(
            item.quantity > 0
              ? `Only ${item.quantity} of "${item.product_title}" available in stock.`
              : `"${item.product_title}" is out of stock.`,
          );
        }
      }

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

  // Initial cart state (items, subtotal, header count, free-shipping bar)
  // is already server-rendered by Liquid on page load — refreshCart()
  // only needs to run after an actual mutation (add/remove/quantity
  // change), which each of those handlers already triggers itself.
});
