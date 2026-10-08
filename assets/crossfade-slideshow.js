function createCrossfadeSlideshow(
  root,
  {
    slideSelector,
    autoplayDelay = 5000,
    arrowSelector,
    onChange,
    onVisibilityChange,
  },
) {
  const slides = Array.from(root.querySelectorAll(slideSelector));
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

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

  let wantsAutoplay = false;
  let isInView = true;

  function clearTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function syncTimer() {
    clearTimer();
    if (wantsAutoplay && isInView) {
      timer = setInterval(next, autoplayDelay);
    }
  }

  function stopAutoplay() {
    wantsAutoplay = false;
    clearTimer();
  }

  function startAutoplay() {
    if (prefersReducedMotion || slides.length < 2) return;
    wantsAutoplay = true;
    syncTimer();
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting === isInView) return;
          isInView = entry.isIntersecting;
          syncTimer();
          if (onVisibilityChange) onVisibilityChange(isInView);
        });
      },
      { threshold: 0 },
    ).observe(root);
  }

  if (slides.length > 1) {
    if (arrowSelector) {
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
    prefersReducedMotion,
    get currentIndex() {
      return currentIndex;
    },
  };
}

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
