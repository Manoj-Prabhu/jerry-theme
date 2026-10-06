
function initBrandStorySlideshow(media) {
  if (media.dataset.slideshowInitialized) return;
  media.dataset.slideshowInitialized = "true";

  if (media.querySelectorAll(".j-brand-story__slide").length < 2) return;

  const autoplayDelay = Number(media.dataset.slideshowAutoplay) || 5000;

  const slideshow = createCrossfadeSlideshow(media, {
    slideSelector: ".j-brand-story__slide",
    autoplayDelay,
  });

  if (document.readyState === "complete") {
    slideshow.startAutoplay();
  } else {
    window.addEventListener("load", slideshow.startAutoplay, { once: true });
  }

  return slideshow;
}

initCrossfadeSlideshowSections(
  ".j-brand-story__media[data-slideshow]",
  initBrandStorySlideshow,
);

const STAT_ANIMATE_MS = 1500;

function animateStatNumber(el) {
  if (el.dataset.statAnimated) return;
  el.dataset.statAnimated = "true";

  const raw = el.textContent.trim();
  const match = raw.match(/^(\D*)(\d[\d,]*)(\D*)$/);
  if (!match) return;

  const [, prefix, digits, suffix] = match;
  const target = Number(digits.replace(/,/g, ""));
  if (!Number.isFinite(target) || target <= 0) return;

  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / STAT_ANIMATE_MS, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);

    el.textContent = `${prefix}${current.toLocaleString("en-US")}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = raw;
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

document.addEventListener("shopify:section:load", (event) => {
  if (event.target.querySelector(".j-brand-story__stat-number")) {
    initBrandStoryStats(event.target);
  }
});
