/* ==========================================================
   Jerry Theme Hero Slideshow
========================================================== */

function initHeroSlideshow(slideshow) {
  if (slideshow.dataset.heroSlideshowInitialized) return;
  slideshow.dataset.heroSlideshowInitialized = "true";

  const track = slideshow.querySelector(".j-hero-slideshow__track");
  const slides = Array.from(
    slideshow.querySelectorAll(".j-hero-slideshow__slide"),
  );
  const autoplayDelay = Number(slideshow.dataset.autoplay) || 5000;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // Until this runs, the active slide is plain `position: static` (see
  // hero.css) so the track already has the correct height straight from
  // CSS — no collapsed-then-expand jump on first paint. This measures
  // that same height, locks it in via inline style, and only then flips
  // every slide (including the active one) to `position: absolute` via
  // `.is-ready` — since the height is already pinned to match, that
  // switch itself causes zero visible change, while enabling a jump-free
  // crossfade for every slide change from here on.
  function updateHeight() {
    // Batched into three passes (write / read / write) instead of
    // write-read-write per slide — interleaving style writes with
    // offsetHeight reads forces the browser to recompute layout
    // synchronously on every iteration ("layout thrashing"). Doing all
    // the writes first, then all the reads, then all the reverts costs
    // one forced layout total instead of one per slide.
    const originalVisibility = slides.map((slide) => slide.style.visibility);

    slides.forEach((slide) => {
      slide.style.position = "static";
      slide.style.visibility = "hidden";
    });

    let maxHeight = 0;
    slides.forEach((slide) => {
      maxHeight = Math.max(maxHeight, slide.offsetHeight);
    });

    slides.forEach((slide, index) => {
      slide.style.position = "";
      slide.style.visibility = originalVisibility[index];
    });

    track.style.height = `${maxHeight}px`;
  }

  updateHeight();
  slideshow.classList.add("is-ready");

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateHeight, 150);
  });

  // In the theme editor, editing a Slide's text/image updates the DOM
  // live (no full page reload), which would otherwise leave the height
  // above stale. Recalculate whenever the slideshow's content actually
  // changes, for any reason.
  let mutationTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(updateHeight, 50);
  });
  observer.observe(slideshow, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["src", "srcset"],
  });

  if (slides.length < 2) return;

  let currentIndex = slides.findIndex((slide) =>
    slide.classList.contains("is-active"),
  );
  if (currentIndex < 0) currentIndex = 0;

  let timer = null;

  function goToSlide(index) {
    const nextIndex = (index + slides.length) % slides.length;
    if (nextIndex === currentIndex) return;

    slides[currentIndex].classList.remove("is-active");
    slides[currentIndex].setAttribute("aria-hidden", "true");

    slides[nextIndex].classList.add("is-active");
    slides[nextIndex].removeAttribute("aria-hidden");

    currentIndex = nextIndex;
  }

  function next() {
    goToSlide(currentIndex + 1);
  }

  function prev() {
    goToSlide(currentIndex - 1);
  }

  function stopAutoplay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startAutoplay() {
    if (prefersReducedMotion) return;
    stopAutoplay();
    timer = setInterval(next, autoplayDelay);
  }

  // Each slide carries its own copy of the prev/next arrows (overlaid on
  // its image), but only the active slide's copy is visible/clickable —
  // delegate from the container so this works regardless of which
  // slide's arrows were clicked.
  slideshow.addEventListener("click", (event) => {
    if (event.target.closest(".j-hero-slideshow__arrow--next")) {
      next();
      startAutoplay();
    } else if (event.target.closest(".j-hero-slideshow__arrow--prev")) {
      prev();
      startAutoplay();
    }
  });

  // Pause on hover/focus so a shopper reading a slide isn't interrupted.
  slideshow.addEventListener("mouseenter", stopAutoplay);
  slideshow.addEventListener("mouseleave", startAutoplay);
  slideshow.addEventListener("focusin", stopAutoplay);
  slideshow.addEventListener("focusout", startAutoplay);

  // Exposed so a bfcache restore (see the pageshow listener below) can
  // restart autoplay without needing to re-run this whole init — the
  // `heroSlideshowInitialized` guard at the top would otherwise skip it.
  slideshow._heroSlideshowRestartAutoplay = startAutoplay;

  startAutoplay();
}

function initAllHeroSlideshows() {
  document
    .querySelectorAll(".j-hero-slideshow")
    .forEach(initHeroSlideshow);
}

document.addEventListener("DOMContentLoaded", initAllHeroSlideshows);

// The theme editor fully replaces a section's markup (fresh elements,
// none of the state/listeners above attached) whenever a block is
// added/removed/reordered, or the section is otherwise reloaded.
document.addEventListener("shopify:section:load", (event) => {
  event.target.querySelectorAll(".j-hero-slideshow").forEach(initHeroSlideshow);
});

// A tab reused for repeat visits (e.g. clicking "View your online store"
// from admin more than once) is often restored from the back/forward
// cache instead of doing a fresh load — bfcache restores never fire
// DOMContentLoaded, so the slideshow above would otherwise sit static
// until a manual refresh. `pageshow` fires in both cases; only restart
// autoplay when `persisted` is true so a normal first load isn't affected.
window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;

  document.querySelectorAll(".j-hero-slideshow").forEach((slideshow) => {
    if (typeof slideshow._heroSlideshowRestartAutoplay === "function") {
      slideshow._heroSlideshowRestartAutoplay();
    } else {
      initHeroSlideshow(slideshow);
    }
  });
});
