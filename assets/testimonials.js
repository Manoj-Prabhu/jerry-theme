function initTestimonialsSlideshow(slideshow) {
  if (slideshow.dataset.testimonialsInitialized) return;
  slideshow.dataset.testimonialsInitialized = "true";

  const track = slideshow.querySelector(".j-testimonials__track");
  const slides = Array.from(
    slideshow.querySelectorAll(".j-testimonials__slide"),
  );
  const autoplayDelay = Number(slideshow.dataset.autoplay) || 5000;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // Same measure-then-lock-height approach as the hero slideshow (see
  // hero-slideshow.js): the active slide starts as `position: static`
  // (see testimonials.css), so the track already has the right height
  // from CSS alone before this runs — no collapsed-then-expand jump on
  // first paint. This measures the tallest slide, locks that height in,
  // then switches every slide to `position: absolute` for a jump-free
  // crossfade from here on.
  function updateHeight() {
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

  // Theme editor block edits (quote length, adding/removing blocks)
  // update the DOM live, which would otherwise leave the height stale.
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
    slides[currentIndex].setAttribute("inert", "");

    slides[nextIndex].classList.add("is-active");
    slides[nextIndex].removeAttribute("aria-hidden");
    slides[nextIndex].removeAttribute("inert");

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

  // Each slide has its own copy of the prev/next arrows (see
  // testimonials.liquid); delegate since only the active slide's copy
  // is visible/clickable — the same approach as the hero slideshow.
  slideshow.addEventListener("click", (event) => {
    if (event.target.closest(".j-testimonials__arrow--next")) {
      next();
      startAutoplay();
    } else if (event.target.closest(".j-testimonials__arrow--prev")) {
      prev();
      startAutoplay();
    }
  });

  slideshow.addEventListener("focusin", stopAutoplay);
  slideshow.addEventListener("focusout", startAutoplay);

  slideshow._testimonialsRestartAutoplay = startAutoplay;

  startAutoplay();
}

function initAllTestimonialsSlideshows() {
  document
    .querySelectorAll(".j-testimonials__slideshow")
    .forEach(initTestimonialsSlideshow);
}

document.addEventListener("DOMContentLoaded", initAllTestimonialsSlideshows);

document.addEventListener("shopify:section:load", (event) => {
  event.target
    .querySelectorAll(".j-testimonials__slideshow")
    .forEach(initTestimonialsSlideshow);
});

// A reused tab restored from the bfcache never fires DOMContentLoaded.
window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;

  document.querySelectorAll(".j-testimonials__slideshow").forEach((slideshow) => {
    if (typeof slideshow._testimonialsRestartAutoplay === "function") {
      slideshow._testimonialsRestartAutoplay();
    } else {
      initTestimonialsSlideshow(slideshow);
    }
  });
});
