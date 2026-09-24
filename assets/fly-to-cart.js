// Shared "fly to cart" delight animation — a clone of the product image
// visually arcs from wherever it sits on the page into the header cart
// icon, which then bumps. Purely cosmetic (the real add-to-cart request
// already succeeded by the time this plays), so a failure here never
// blocks or delays the actual cart update — this is called after a
// successful add, not as part of it.
//
// Exposed as window.JerryFlyToCart(sourceImg) so both the main product
// page (assets/cart.js) and Quick View (assets/quick-view.js) can
// trigger it from their own add-to-cart handlers without duplicating
// the animation logic.
window.JerryFlyToCart = (() => {
  const FLY_DURATION_MS = 700;

  function bumpCartIcon() {
    const cartButton = document.querySelector(".j-header__cart");
    if (!cartButton) return;

    cartButton.classList.remove("is-bumping");
    // Forces a reflow so the class can be re-added immediately after
    // removal (e.g. adding two items in quick succession) and still
    // restart the animation from scratch instead of being a no-op.
    void cartButton.offsetWidth;
    cartButton.classList.add("is-bumping");
    cartButton.addEventListener(
      "animationend",
      () => cartButton.classList.remove("is-bumping"),
      { once: true },
    );
  }

  return function flyToCart(sourceImg) {
    // Reduced motion, no cart icon to land on, or no real image to fly
    // (a video/model slide, or a Quick View opened before any media
    // loaded) — just bump the icon so there's still some acknowledgment
    // the add happened, and skip the flying-image part entirely.
    const cartButton = document.querySelector(".j-header__cart");
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!cartButton) return;

    if (!sourceImg || sourceImg.tagName !== "IMG" || prefersReducedMotion) {
      bumpCartIcon();
      return;
    }

    const startRect = sourceImg.getBoundingClientRect();
    if (startRect.width === 0 || startRect.height === 0) {
      bumpCartIcon();
      return;
    }

    const endRect = cartButton.getBoundingClientRect();

    const clone = sourceImg.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.left = `${startRect.left}px`;
    clone.style.top = `${startRect.top}px`;
    clone.style.width = `${startRect.width}px`;
    clone.style.height = `${startRect.height}px`;
    clone.style.margin = "0";
    clone.style.borderRadius = "8px";
    clone.style.objectFit = "cover";
    clone.style.zIndex = "10000";
    clone.style.pointerEvents = "none";
    clone.style.transition = `transform ${FLY_DURATION_MS}ms cubic-bezier(0.5, -0.2, 0.7, 0.4), opacity ${FLY_DURATION_MS}ms ease`;
    clone.setAttribute("aria-hidden", "true");
    document.body.appendChild(clone);

    // Endpoint expressed as a translate+scale from the clone's own
    // starting box (not absolute end coordinates) — lets a single
    // transform animate position and size together in one go instead of
    // separately animating left/top/width/height, which is what gives
    // this its curved, easing-driven arc rather than a straight linear
    // slide.
    const endScale = Math.min(
      endRect.width / startRect.width,
      endRect.height / startRect.height,
      0.3,
    );
    const startCenterX = startRect.left + startRect.width / 2;
    const startCenterY = startRect.top + startRect.height / 2;
    const endCenterX = endRect.left + endRect.width / 2;
    const endCenterY = endRect.top + endRect.height / 2;
    const translateX = endCenterX - startCenterX;
    const translateY = endCenterY - startCenterY;

    // Double rAF, not a single one — a single requestAnimationFrame
    // callback can still land in the same style-recalc/paint cycle as
    // the element's insertion above, so the browser never actually
    // commits the "no transform yet" starting frame before the ending
    // transform is applied, and the transition has nothing to
    // interpolate from (it jumps straight to the end state instead of
    // animating — confirmed by sampling the clone's rect at 50ms/250ms/
    // 550ms and getting the exact same numbers every time). Nesting a
    // second rAF guarantees a real paint has happened in between.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        clone.style.transform = `translate(${translateX}px, ${translateY}px) scale(${endScale})`;
        clone.style.opacity = "0.3";
      });
    });

    setTimeout(() => {
      clone.remove();
      bumpCartIcon();
    }, FLY_DURATION_MS);
  };
})();
