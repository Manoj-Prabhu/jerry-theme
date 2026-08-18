function initScrollReveal() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  if (!("IntersectionObserver" in window)) return;

  const STAGGER_STEP_MS = 60;
  const STAGGER_MAX_STEPS = 5;

  // Sections containing a fixed/sticky-positioned element (e.g. the
  // product page's sticky add-to-cart bar) are skipped: animating a
  // transform on the section would create a new containing block and
  // break that descendant's fixed positioning relative to the viewport.
  //
  // The New Products section is also skipped: its heading row was
  // reproducibly going invisible at mobile widths after this reveal
  // animation ran (fixed only by forcing a style recalc in devtools —
  // e.g. toggling an unrelated CSS property off and on), regardless of
  // which layout approach (flex, inline-flex, plain inline-block) it
  // used internally. That points at this transition-driven opacity/
  // transform animation itself interacting badly with that section's
  // layout at narrow widths, not a bug in the section's own CSS.
  const skipSelector = ".j-sticky-cart, .j-new-products";
  const sectionTargets = "CSS" in window && CSS.supports("selector(:has(*))")
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

  sectionTargets.forEach((el) => el.classList.add("j-reveal"));

  cardTargets.forEach((el, index) => {
    el.classList.add("j-reveal");
    const step = index % (STAGGER_MAX_STEPS + 1);
    el.style.transitionDelay = `${step * STAGGER_STEP_MS}ms`;
  });

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

  sectionTargets.forEach((el) => observer.observe(el));
  cardTargets.forEach((el) => observer.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
  // Elements render fully visible until these reveal classes are applied,
  // so deferring to idle time only delays the enter animation slightly —
  // it never leaves content stuck hidden — while keeping this DOM scan
  // off the critical main-thread work during page load.
  if ("requestIdleCallback" in window) {
    requestIdleCallback(initScrollReveal, { timeout: 2000 });
  } else {
    setTimeout(initScrollReveal, 200);
  }
});
