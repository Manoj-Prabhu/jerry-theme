// Auto-rotating crossfade between the Brand Story section's Image
// blocks — only runs when there are 2+ slides (see data-slideshow on
// .j-brand-story__media in brand-story.liquid); with 0 or 1 images it's
// just a static image and this never engages.
function initBrandStorySlideshow(media) {
  if (media.dataset.slideshowInitialized) return;
  media.dataset.slideshowInitialized = "true";

  if (media.querySelectorAll(".j-brand-story__slide").length < 2) return;

  const autoplayDelay = Number(media.dataset.slideshowAutoplay) || 5000;

  const slideshow = createCrossfadeSlideshow(media, {
    slideSelector: ".j-brand-story__slide",
    autoplayDelay,
  });

  slideshow.startAutoplay();

  return slideshow;
}

initCrossfadeSlideshowSections(
  ".j-brand-story__media[data-slideshow]",
  initBrandStorySlideshow,
);

// Stat count-up — "40+" / "10K+" / "2020" arrive as static numbers with
// no visual weight; animating them from 0 up to their real value once
// they scroll into view gives that row some presence instead of just
// sitting there. Only the leading digits are animated — any trailing
// text ("+", "K+") is treated as a literal suffix and left untouched,
// so this works for any stat format a merchant types in without trying
// to guess unit math (a real "10K" meaning 10,000 vs. a literal "10K+"
// merchants type as shorthand are indistinguishable from text alone).
const STAT_ANIMATE_MS = 1500;

function animateStatNumber(el) {
  if (el.dataset.statAnimated) return;
  el.dataset.statAnimated = "true";

  const raw = el.textContent.trim();
  const match = raw.match(/^(\D*)(\d[\d,]*)(\D*)$/);
  if (!match) return; // no digits to animate (e.g. a purely text stat) — leave as-is

  const [, prefix, digits, suffix] = match;
  const target = Number(digits.replace(/,/g, ""));
  if (!Number.isFinite(target) || target <= 0) return;

  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / STAT_ANIMATE_MS, 1);
    // Ease-out — fast start, settles into the final number rather than
    // arriving at a constant rate.
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);

    el.textContent = `${prefix}${current.toLocaleString("en-US")}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = raw; // land on the exact original text, commas/formatting included
    }
  }

  requestAnimationFrame(tick);
}

function initBrandStoryStats(root = document) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  const stats = root.querySelectorAll(".j-brand-story__stat-number");
  if (!stats.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateStatNumber(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.5 },
  );

  stats.forEach((stat) => observer.observe(stat));
}

document.addEventListener("DOMContentLoaded", () => initBrandStoryStats());

// The theme editor swaps this section's markup via AJAX on every
// settings change — without this, a freshly-swapped section's stats
// would never get observed and just sit at their final value with no
// animation (harmless, but inconsistent with a normal page load).
document.addEventListener("shopify:section:load", (event) => {
  if (event.target.querySelector(".j-brand-story__stat-number")) {
    initBrandStoryStats(event.target);
  }
});
