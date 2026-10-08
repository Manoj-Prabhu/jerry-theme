function initTestimonialsSlideshow(root) {
  if (root.dataset.testimonialsInitialized) return;
  root.dataset.testimonialsInitialized = "true";

  const autoplayDelay = Number(root.dataset.autoplay) || 5000;

  const slideshow = createCrossfadeSlideshow(root, {
    slideSelector: ".j-testimonials__slide",
    autoplayDelay,
    arrowSelector: {
      prev: ".j-testimonials__arrow--prev",
      next: ".j-testimonials__arrow--next",
    },
  });

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
