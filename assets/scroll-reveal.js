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

  // .j-reveal starts an element at opacity: 0 until .is-revealed is added
  // (see scroll-reveal.css) — correct for content the visitor scrolls
  // down to, but applying it to whatever's already sitting in the
  // viewport on load (a collection grid's first row, the hero, etc.)
  // hides real above-the-fold content behind a JS+IntersectionObserver
  // round trip for no visual benefit (it was never off-screen, so there's
  // nothing to "reveal"). On a page busy enough to delay this script
  // (this itself runs on requestIdleCallback), that's exactly the
  // "Element render delay" Lighthouse's LCP breakdown flagged — an
  // already-loaded, already-decoded LCP image sitting invisible for
  // seconds waiting on this script and its observer to get around to it.
  // Anything already in (or above) the viewport at scan time skips the
  // hide/reveal treatment entirely and just renders normally.
  const isAboveTheFold = (el) => el.getBoundingClientRect().top < window.innerHeight;

  // Elements already above the fold are simply left out of both arrays
  // below — never getting .j-reveal at all leaves them in their normal,
  // fully-visible state, with no opacity:0 window for anything (a slow
  // main thread, a delayed observer callback) to strand them behind.
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

// The theme editor swaps a section's markup via AJAX on every settings
// change rather than reloading the page — without this, a freshly-
// swapped section's elements never get .j-reveal added at all, so the
// enter animation just silently stops playing for it (content still
// renders fully visible either way, since .j-reveal — not its absence —
// is what sets opacity: 0). Re-scanning the whole page is safe: already-
// revealed elements just get re-observed and immediately re-marked
// revealed, a harmless no-op.
document.addEventListener("shopify:section:load", initScrollReveal);
