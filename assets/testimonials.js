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

  slideshow.startAutoplay();

  return slideshow;
}

initCrossfadeSlideshowSections(
  ".j-testimonials__slideshow",
  initTestimonialsSlideshow,
);
