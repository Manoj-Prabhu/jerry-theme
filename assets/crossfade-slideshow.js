// Shared engine for the theme's crossfade slideshows (hero, testimonials,
// brand story) — they all swap `.is-active` between absolutely positioned
// slides and were each maintaining a near-identical copy of this: autoplay,
// arrow navigation, focus-pause, and — where a `track` element is given —
// the measure-then-lock-height trick that keeps the container from jumping
// on first paint (the active slide starts as `position: static` in CSS, so
// this measures that natural height, locks it in, then switches every
// slide to `position: absolute` for a jump-free crossfade from here on).
function createCrossfadeSlideshow(
  root,
  { slideSelector, track, autoplayDelay = 5000, arrowSelector, onChange },
) {
  const slides = Array.from(root.querySelectorAll(slideSelector));
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function updateHeight() {
    if (!track) return;

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

  if (track) {
    updateHeight();
    root.classList.add("is-ready");

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateHeight, 150);
    });

    // Theme editor edits (text, images, blocks) update the DOM live, which
    // would otherwise leave the locked height stale.
    let mutationTimer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(updateHeight, 50);
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["src", "srcset"],
    });
  }

  let currentIndex = slides.findIndex((slide) =>
    slide.classList.contains("is-active"),
  );
  if (currentIndex < 0) currentIndex = 0;

  let timer = null;

  function goToSlide(index) {
    const nextIndex = (index + slides.length) % slides.length;
    if (nextIndex === currentIndex) return;

    const prevSlide = slides[currentIndex];
    const nextSlide = slides[nextIndex];

    prevSlide.classList.remove("is-active");
    prevSlide.setAttribute("aria-hidden", "true");
    prevSlide.setAttribute("inert", "");

    nextSlide.classList.add("is-active");
    nextSlide.removeAttribute("aria-hidden");
    nextSlide.removeAttribute("inert");

    currentIndex = nextIndex;

    if (onChange) onChange(prevSlide, nextSlide);
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
    if (prefersReducedMotion || slides.length < 2) return;
    stopAutoplay();
    timer = setInterval(next, autoplayDelay);
  }

  if (slides.length > 1) {
    if (arrowSelector) {
      // Each slide has its own copy of the prev/next arrows (overlaid on
      // its content); delegate since only the active slide's copy is
      // visible/clickable.
      root.addEventListener("click", (event) => {
        if (arrowSelector.next && event.target.closest(arrowSelector.next)) {
          next();
          startAutoplay();
        } else if (
          arrowSelector.prev &&
          event.target.closest(arrowSelector.prev)
        ) {
          prev();
          startAutoplay();
        }
      });
    }

    root.addEventListener("focusin", stopAutoplay);
    root.addEventListener("focusout", startAutoplay);
  }

  return {
    slides,
    goToSlide,
    next,
    prev,
    startAutoplay,
    stopAutoplay,
    updateHeight,
    prefersReducedMotion,
    get currentIndex() {
      return currentIndex;
    },
  };
}

// Wires the DOMContentLoaded / shopify:section:load / bfcache-pageshow
// boilerplate every crossfade slideshow needs. `initFn(root)` should
// initialize `root` (bailing out early — returning nothing — if it's
// already initialized or doesn't qualify, e.g. fewer than 2 slides) and
// return the object created by createCrossfadeSlideshow.
function initCrossfadeSlideshowSections(selector, initFn) {
  const instances = new WeakMap();

  function initAll(root) {
    root.querySelectorAll(selector).forEach((el) => {
      const instance = initFn(el);
      if (instance) instances.set(el, instance);
    });
  }

  document.addEventListener("DOMContentLoaded", () => initAll(document));

  // The theme editor replaces a section's markup wholesale on block
  // add/remove/reorder, leaving fresh elements with no listeners attached.
  document.addEventListener("shopify:section:load", (event) =>
    initAll(event.target),
  );

  // A reused tab (e.g. repeat "View your online store" clicks) is often
  // restored from the bfcache, which never fires DOMContentLoaded.
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;

    document.querySelectorAll(selector).forEach((el) => {
      const instance = instances.get(el);
      if (instance) {
        instance.startAutoplay();
      } else {
        initAll(document);
      }
    });
  });
}
