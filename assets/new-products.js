function initNewProductsCardCycle(card) {
  if (card.dataset.cycleInitialized) return;

  const images = card.querySelectorAll(".j-new-products__image");
  if (images.length < 2) return;

  card.dataset.cycleInitialized = "true";

  const CYCLE_MS = 700;
  let timer = null;
  let activeIndex = 0;

  function showIndex(index) {
    images[activeIndex].classList.remove("is-active");
    activeIndex = index;
    images[activeIndex].classList.add("is-active");
  }

  function start() {
    if (timer) return;
    timer = setInterval(() => {
      showIndex((activeIndex + 1) % images.length);
    }, CYCLE_MS);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    showIndex(0);
  }

  card.addEventListener("mouseenter", start);
  card.addEventListener("mouseleave", stop);
  card.addEventListener("focus", start);
  card.addEventListener("blur", stop);
}

function initNewProducts(section) {
  if (section.dataset.newProductsInitialized) return;
  section.dataset.newProductsInitialized = "true";

  const board = section.querySelector("[data-new-products-board]");
  const prevButton = section.querySelector(".j-new-products__arrow--prev");
  const nextButton = section.querySelector(".j-new-products__arrow--next");

  section
    .querySelectorAll(".j-new-products__card")
    .forEach(initNewProductsCardCycle);

  if (!board || !prevButton || !nextButton) return;

  function stepDistance() {
    return board.clientWidth || 480;
  }

  function updateArrowState() {
    const maxScroll = board.scrollWidth - board.clientWidth;
    prevButton.disabled = board.scrollLeft <= 1;
    nextButton.disabled = board.scrollLeft >= maxScroll - 1;
  }

  prevButton.addEventListener("click", () => {
    board.scrollBy({ left: -stepDistance(), behavior: "smooth" });
  });

  nextButton.addEventListener("click", () => {
    board.scrollBy({ left: stepDistance(), behavior: "smooth" });
  });

  board.addEventListener("scroll", updateArrowState, { passive: true });

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateArrowState, 150);
  });

  updateArrowState();
}

function initAllNewProducts() {
  document.querySelectorAll(".j-new-products").forEach(initNewProducts);
}

document.addEventListener("DOMContentLoaded", initAllNewProducts);

document.addEventListener("shopify:section:load", (event) => {
  event.target.querySelectorAll(".j-new-products").forEach(initNewProducts);
});
