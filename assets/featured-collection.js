// Scroll-scrubbed slide-in for the Featured Collection cards — the
// horizontal offset is driven directly by the card's live position in
// the viewport on every scroll frame, rather than a CSS transition fired
// once by a threshold crossing. That's what makes it track smoothly with
// the scroll itself: scrolling down eases a card in from the side as it
// rises up through the bottom portion of the viewport, scrolling back up
// eases it back out the same way, at whatever pace you're actually
// scrolling — not a fixed-duration animation that runs on its own once
// triggered.
function initFeaturedCollectionReveal() {
  const cards = Array.from(
    document.querySelectorAll(".j-featured-collection .j-product-card"),
  );

  if (!cards.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Card enters (progress 0) once its top crosses the bottom of the
  // viewport, and is fully settled (progress 1) once it's scrolled up to
  // ~40% of viewport height — spread over more scroll distance than an
  // earlier, subtler version of this (was 65%), so the motion plays out
  // over more of the scroll and reads as clearly moving rather than
  // barely noticeable. Slide distance bumped the same way (70px → 220px).
  const ENTER_VH_FRACTION = 1;
  const SETTLE_VH_FRACTION = 0.4;
  const SLIDE_DISTANCE_PX = 220;

  // Below 600px the grid becomes a horizontal swipe carousel (see
  // .j-featured-collection .j-product-grid in featured-collection.css),
  // driven by the browser's own native scrollLeft on that row — this
  // `translate` offset is a separate CSS property layered on top of
  // that, the same way it already composes with the card's hover-lift
  // transform, so the vertical-scroll-driven entrance slide still plays
  // normally here without interfering with the swipe gesture.
  function updateCard(card, index) {
    const rect = card.getBoundingClientRect();
    const vh = window.innerHeight;
    const startY = vh * ENTER_VH_FRACTION;
    const endY = vh * SETTLE_VH_FRACTION;

    let progress = (startY - rect.top) / (startY - endY);
    progress = Math.min(Math.max(progress, 0), 1);

    // Opacity ramps up over a much shorter stretch of the same scroll
    // range (the first 35% of it) than the slide does — so the card is
    // fully solid for most of its travel instead of staying washed-out
    // and semi-transparent for the whole slide.
    const OPACITY_RAMP_FRACTION = 0.35;
    const opacity = Math.min(progress / OPACITY_RAMP_FRACTION, 1);

    // Alternates left/right per card — first card eases in from the
    // left, second from the right, and so on if a merchant shows more
    // than 2.
    const direction = index % 2 === 0 ? -1 : 1;
    const offset = direction * SLIDE_DISTANCE_PX * (1 - progress);

    // `translate`, not `transform` — this card also animates
    // `transform: translateY(-8px)` on hover (see featured-
    // collection.css). translate is a separate, independent CSS
    // property that composes with transform automatically instead of
    // overwriting it, so this scroll-driven offset and the hover lift
    // can both be in effect at once without one clobbering the other.
    card.style.translate = `${offset.toFixed(2)}px 0`;
    card.style.opacity = opacity.toFixed(3);
  }

  let ticking = false;

  function updateAllCards() {
    cards.forEach(updateCard);
    ticking = false;
  }

  function scheduleUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateAllCards);
  }

  // No CSS transition backing this — every scroll/resize frame sets
  // translate/opacity directly, which is what gives the scrubbed (not
  // eased-after-the-fact) feel. Card starts in its "just entering" state
  // (offset, invisible) until the first frame runs.
  cards.forEach((card) => {
    card.style.willChange = "translate, opacity";
  });

  updateAllCards();

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
}

// Tap-to-reveal Quick View on touch devices — they have no real hover
// state, so the button (hidden by default, same as the desktop hover
// reveal — see .j-quick-view-button in featured-collection.css) needs a
// different trigger there. First tap on a card intercepts the link's
// navigation and reveals the button instead (via .is-tapped); tapping
// that same card again (now already revealed) lets the navigation
// proceed normally; tapping anywhere else collapses it back down.
function initFeaturedCollectionTapReveal() {
  if (!window.matchMedia("(hover: none)").matches) return;

  const cards = Array.from(
    document.querySelectorAll(".j-featured-collection .j-product-card"),
  );

  if (!cards.length) return;

  cards.forEach((card) => {
    if (card.dataset.tapRevealInitialized) return;
    card.dataset.tapRevealInitialized = "true";

    const link = card.querySelector(".j-product-card__link");
    if (!link) return;

    link.addEventListener("click", (event) => {
      if (card.classList.contains("is-tapped")) return;

      event.preventDefault();
      cards.forEach((other) => other.classList.remove("is-tapped"));
      card.classList.add("is-tapped");
    });
  });

  document.addEventListener("click", (event) => {
    cards.forEach((card) => {
      if (!card.contains(event.target)) card.classList.remove("is-tapped");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(initFeaturedCollectionReveal, { timeout: 2000 });
  } else {
    setTimeout(initFeaturedCollectionReveal, 200);
  }

  initFeaturedCollectionTapReveal();
});

// The theme editor replaces a section's markup wholesale on block
// add/remove/reorder, leaving fresh elements with no scroll listener
// attached.
document.addEventListener("shopify:section:load", (event) => {
  if (event.target.querySelector(".j-featured-collection")) {
    initFeaturedCollectionReveal();
    initFeaturedCollectionTapReveal();
  }
});
