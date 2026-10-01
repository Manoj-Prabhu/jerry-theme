function initTestimonialsSlideshow(root) {
  if (root.dataset.testimonialsInitialized) return;
  root.dataset.testimonialsInitialized = "true";

  const track = root.querySelector(".j-testimonials__track");
  const autoplayDelay = Number(root.dataset.autoplay) || 5000;

  const slideshow = createCrossfadeSlideshow(root, {
    slideSelector: ".j-testimonials__slide",
    track,
    autoplayDelay,
    arrowSelector: {
      prev: ".j-testimonials__arrow--prev",
      next: ".j-testimonials__arrow--next",
    },
  });

  // Waits for window load, matching the hero and featured-product
  // slideshows — keeps slide transitions out of the initial-load window.
  if (document.readyState === "complete") {
    slideshow.startAutoplay();
  } else {
    window.addEventListener("load", slideshow.startAutoplay, { once: true });
  }

  return slideshow;
}

initCrossfadeSlideshowSections(
  ".j-testimonials__slideshow",
  initTestimonialsSlideshow,
);
