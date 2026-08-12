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

  // The active slide starts as `position: static` (see hero.css), so the
  // track already has the right height from CSS alone before this runs —
  // no collapsed-then-expand jump on first paint. This measures that
  // height, locks it in, then adds `.is-ready` to switch every slide to
  // `position: absolute` for a jump-free crossfade from here on.
  function updateHeight() {
    // Batched write / read / write instead of write-read-write per slide,
    // to avoid a forced synchronous layout on every iteration.
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

  // Non-first slides ship with data-src/data-srcset instead of real
  // src/srcset (see hero.liquid) so the browser doesn't fetch every slide
  // image upfront just because they geometrically overlap the viewport.
  // Hydrate them once the browser is idle after the critical first paint,
  // well before autoplay's first advance needs them.
  function hydrateDeferredSlideImages() {
    slides.forEach((slide) => {
      const img = slide.querySelector("img[data-src]");
      if (!img) return;

      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        img.removeAttribute("data-srcset");
      }
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
    });
  }

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(hydrateDeferredSlideImages, { timeout: 2000 });
  } else {
    setTimeout(hydrateDeferredSlideImages, 1000);
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateHeight, 150);
  });

  // Theme editor text/image edits update the DOM live, which would
  // otherwise leave the height above stale.
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

  let currentIndex = slides.findIndex((slide) =>
    slide.classList.contains("is-active"),
  );
  if (currentIndex < 0) currentIndex = 0;

  // Lets listeners (e.g. the hero heading's initials-cluster reveal in
  // text-reveal.js) replay per-slide effects every time a slide becomes
  // active — including the one that's active from first paint, not just
  // slides reached via goToSlide.
  function announceActiveSlide() {
    document.dispatchEvent(
      new CustomEvent("heroSlideActivated", {
        detail: { slide: slides[currentIndex] },
      }),
    );
  }

  announceActiveSlide();

  if (slides.length < 2) return;

  let timer = null;

  function goToSlide(index) {
    const nextIndex = (index + slides.length) % slides.length;
    if (nextIndex === currentIndex) return;

    slides[currentIndex].classList.remove("is-active");
    slides[currentIndex].setAttribute("aria-hidden", "true");
    slides[currentIndex].setAttribute("inert", "");

    slides[nextIndex].classList.add("is-active");
    slides[nextIndex].removeAttribute("aria-hidden");
    slides[nextIndex].removeAttribute("inert");

    currentIndex = nextIndex;
    announceActiveSlide();
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

  // Each slide has its own copy of the prev/next arrows (overlaid on its
  // image); delegate since only the active slide's copy is clickable.
  slideshow.addEventListener("click", (event) => {
    if (event.target.closest(".j-hero-slideshow__arrow--next")) {
      next();
      startAutoplay();
    } else if (event.target.closest(".j-hero-slideshow__arrow--prev")) {
      prev();
      startAutoplay();
    }
  });

  // Hover-pause only on real pointer devices — touchscreens can fire a
  // "mouseenter" on tap with no matching "mouseleave", which would
  // otherwise pause autoplay permanently.
  if (window.matchMedia("(hover: hover)").matches) {
    slideshow.addEventListener("mouseenter", stopAutoplay);
    slideshow.addEventListener("mouseleave", startAutoplay);
  }

  slideshow.addEventListener("focusin", stopAutoplay);
  slideshow.addEventListener("focusout", startAutoplay);

  // Lets the bfcache pageshow handler below restart autoplay without
  // re-running init (the initialized guard at the top would skip it).
  slideshow._heroSlideshowRestartAutoplay = startAutoplay;

  startAutoplay();
}

function initAllHeroSlideshows() {
  document.querySelectorAll(".j-hero-slideshow").forEach(initHeroSlideshow);
}

document.addEventListener("DOMContentLoaded", initAllHeroSlideshows);

// The theme editor replaces a section's markup wholesale on block
// add/remove/reorder, leaving fresh elements with no listeners attached.
document.addEventListener("shopify:section:load", (event) => {
  event.target.querySelectorAll(".j-hero-slideshow").forEach(initHeroSlideshow);
});

// A reused tab (e.g. repeat "View your online store" clicks) is often
// restored from the bfcache, which never fires DOMContentLoaded.
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
