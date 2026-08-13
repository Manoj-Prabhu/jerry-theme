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

  // The trust row (Free Shipping / Easy Returns / Secure Checkout) stays
  // in its natural in-flow position inside .j-hero__content — its
  // vertical position varies slide to slide depending on how much that
  // slide's heading/description wrap to. The arrows are a separate,
  // absolutely-positioned element (so they can sit out past the text
  // column near the media's edge), so a fixed CSS offset would only line
  // the two up by coincidence. This measures each slide's actual trust
  // row position and writes it as a CSS variable the arrows read (see
  // hero.css), so the arrows always land level with the trust row instead
  // of drifting away from it.
  function alignArrowsForSlide(slide) {
    const trust = slide.querySelector(".j-hero__trust");
    const arrowsWrap = slide.querySelector(".j-hero-slideshow__arrows");
    if (!trust || !arrowsWrap) return;

    const slideRect = slide.getBoundingClientRect();
    const trustRect = trust.getBoundingClientRect();
    const arrowHeight = arrowsWrap.offsetHeight || 40;

    // On mobile the trust row wraps to two lines (see hero.css), so
    // centering the arrows on it — the desktop behavior — lands them
    // overlapping the wrapped text instead of beside it. Below 480px the
    // arrows sit just under the trust row's bottom edge and centered
    // horizontally instead (see the matching max-width: 480px rule in
    // hero.css), so this measures from that edge rather than the row's
    // vertical center.
    const isMobile = window.matchMedia("(max-width: 480px)").matches;
    const offset = isMobile
      ? slideRect.bottom - trustRect.bottom - arrowHeight - 6
      : slideRect.bottom - (trustRect.top + trustRect.height / 2) - arrowHeight / 2;

    arrowsWrap.style.setProperty("--hero-trust-offset", `${Math.max(offset, 0)}px`);
  }

  function alignAllArrows() {
    slides.forEach(alignArrowsForSlide);
  }

  updateHeight();
  alignAllArrows();
  slideshow.classList.add("is-ready");

  // Non-first slides ship with data-src/data-srcset instead of real
  // src/srcset (see hero.liquid) so the browser doesn't fetch every slide
  // image (or, worse, video) upfront just because they geometrically
  // overlap the viewport. Hydrate them once the browser is idle after the
  // critical first paint, well before autoplay's first advance needs them.
  function hydrateSlide(slide) {
    const img = slide.querySelector("img[data-src]");
    if (img) {
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        img.removeAttribute("data-srcset");
      }
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
    }

    const videoSource = slide.querySelector("video source[data-src]");
    if (videoSource) {
      const video = videoSource.closest("video");
      videoSource.src = videoSource.dataset.src;
      videoSource.removeAttribute("data-src");
      // Changing a <source>'s src after the fact needs an explicit load()
      // for the <video> to actually pick it up.
      if (video) video.load();
    }
  }

  function hydrateDeferredSlideImages() {
    slides.forEach(hydrateSlide);
  }

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(hydrateDeferredSlideImages, { timeout: 2000 });
  } else {
    setTimeout(hydrateDeferredSlideImages, 1000);
  }

  // At most one hero video should ever be playing at a time — pause
  // whichever slide is being left, and (after making sure its source is
  // actually hydrated) play whichever slide is becoming active. Never
  // autoplays for visitors who prefer reduced motion; the video just sits
  // on its poster frame instead.
  function pauseSlideVideo(slide) {
    const video = slide.querySelector("video");
    if (video) video.pause();
  }

  function playSlideVideo(slide) {
    if (prefersReducedMotion) return;

    const video = slide.querySelector("video");
    if (!video) return;

    if (video.querySelector("source[data-src]")) hydrateSlide(slide);

    // load() is async; play() can be called immediately after regardless,
    // the browser queues it correctly once the new source is ready.
    const playResult = video.play();
    if (playResult && typeof playResult.catch === "function") {
      // Autoplay can be blocked by the browser in some contexts (e.g. low
      // power mode) — that's fine, the poster frame is a reasonable
      // fallback and isn't worth surfacing as an error.
      playResult.catch(() => {});
    }
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateHeight();
      alignAllArrows();
    }, 150);
  });

  // Theme editor text/image edits update the DOM live, which would
  // otherwise leave the height (and the trust-row-aligned arrow offset)
  // stale.
  let mutationTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(() => {
      updateHeight();
      alignAllArrows();
    }, 50);
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

  // The initial slide's video (if any) has the autoplay attribute directly
  // in its HTML, which the browser honors regardless of the visitor's
  // motion preference — pause it immediately if they prefer reduced motion.
  if (prefersReducedMotion) pauseSlideVideo(slides[currentIndex]);

  if (slides.length < 2) return;

  let timer = null;

  function goToSlide(index) {
    const nextIndex = (index + slides.length) % slides.length;
    if (nextIndex === currentIndex) return;

    pauseSlideVideo(slides[currentIndex]);

    slides[currentIndex].classList.remove("is-active");
    slides[currentIndex].setAttribute("aria-hidden", "true");
    slides[currentIndex].setAttribute("inert", "");

    slides[nextIndex].classList.add("is-active");
    slides[nextIndex].removeAttribute("aria-hidden");
    slides[nextIndex].removeAttribute("inert");

    currentIndex = nextIndex;
    playSlideVideo(slides[nextIndex]);
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
