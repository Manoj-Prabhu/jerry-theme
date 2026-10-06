
function initFeaturedCollectionReveal() {
  const cards = Array.from(
    document.querySelectorAll(".j-featured-collection .j-product-card"),
  );

  if (!cards.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ENTER_VH_FRACTION = 1;
  const SETTLE_VH_FRACTION = 0.4;
  const SLIDE_DISTANCE_PX = 220;

  function updateCard(card, index) {
    const rect = card.getBoundingClientRect();
    const vh = window.innerHeight;
    const startY = vh * ENTER_VH_FRACTION;
    const endY = vh * SETTLE_VH_FRACTION;

    let progress = (startY - rect.top) / (startY - endY);
    progress = Math.min(Math.max(progress, 0), 1);

    const OPACITY_RAMP_FRACTION = 0.35;
    const opacity = Math.min(progress / OPACITY_RAMP_FRACTION, 1);
    const direction = index % 2 === 0 ? -1 : 1;
    const offset = direction * SLIDE_DISTANCE_PX * (1 - progress);
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

  cards.forEach((card) => {
    card.style.willChange = "translate, opacity";
  });

  updateAllCards();

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
}

function initProductCardTapReveal() {
  if (!window.matchMedia("(hover: none)").matches) return;

  const cards = Array.from(document.querySelectorAll(".j-product-card"));

  if (!cards.length) return;

  cards.forEach((card) => {
    if (card.dataset.tapRevealInitialized) return;
    card.dataset.tapRevealInitialized = "true";

    const links = card.querySelectorAll(
      ".j-product-card__link, .j-product-card__image-link",
    );
    if (!links.length) return;

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        if (card.classList.contains("is-tapped")) return;

        event.preventDefault();
        cards.forEach((other) => other.classList.remove("is-tapped"));
        card.classList.add("is-tapped");
      });
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

  initProductCardTapReveal();
});

document.addEventListener("shopify:section:load", (event) => {
  if (event.target.querySelector(".j-featured-collection")) {
    initFeaturedCollectionReveal();
  }
  if (event.target.querySelector(".j-product-card")) {
    initProductCardTapReveal();
  }
});
