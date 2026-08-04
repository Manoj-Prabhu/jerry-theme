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

  // Every slide is always position:absolute (so switching slides never
  // causes a layout jump), which means the track itself needs an
  // explicit height — nothing is left in normal document flow to give
  // it one automatically. Needed even for a single slide.
  function updateHeight() {
    let maxHeight = 0;

    slides.forEach((slide) => {
      const wasHidden = slide.style.visibility;
      slide.style.position = "static";
      slide.style.visibility = "hidden";
      maxHeight = Math.max(maxHeight, slide.offsetHeight);
      slide.style.position = "";
      slide.style.visibility = wasHidden;
    });

    track.style.height = `${maxHeight}px`;
  }

  updateHeight();

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
