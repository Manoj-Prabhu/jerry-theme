function initScrollReveal() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  if (!("IntersectionObserver" in window)) return;

  const STAGGER_STEP_MS = 60;
  const STAGGER_MAX_STEPS = 5;

  const skipSelector = ".j-sticky-cart, .j-new-products";
  const sectionTargets =
    "CSS" in window && CSS.supports("selector(:has(*))")
      ? Array.from(
          document.querySelectorAll(
            `#MainContent > .shopify-section:not(:has(${skipSelector}))`,
          ),
        )
      : Array.from(
          document.querySelectorAll("#MainContent > .shopify-section"),
        ).filter((el) => !el.querySelector(skipSelector));
  const cardTargets = Array.from(
    document.querySelectorAll(".j-product-card, .j-card"),
  );

  const isAboveTheFold = (el) =>
    el.getBoundingClientRect().top < window.innerHeight;
  const revealOnScroll = [];

  sectionTargets.forEach((el) => {
    if (!isAboveTheFold(el)) revealOnScroll.push(el);
  });

  cardTargets.forEach((el, index) => {
    if (isAboveTheFold(el)) return;
    revealOnScroll.push(el);
    const step = index % (STAGGER_MAX_STEPS + 1);
    el.style.transitionDelay = `${step * STAGGER_STEP_MS}ms`;
  });

  revealOnScroll.forEach((el) => el.classList.add("j-reveal"));

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
  );

  revealOnScroll.forEach((el) => observer.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(initScrollReveal, { timeout: 2000 });
  } else {
    setTimeout(initScrollReveal, 200);
  }
});

document.addEventListener("shopify:section:load", initScrollReveal);
