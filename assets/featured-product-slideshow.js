
function initFeaturedProductSlideshow(root) {
  const track = root.querySelector(".j-featured-product-slideshow__track");
  const slides = root.querySelectorAll(".j-featured-product-slide");

  // A single product renders one static slide — nothing to rotate.
  if (slides.length < 2) return;

  const autoplayDelay = Number(root.dataset.autoplay) || 5000;
  const slideshow = createCrossfadeSlideshow(root, {
    slideSelector: ".j-featured-product-slide",
    track,
    autoplayDelay,
  });

  if (document.readyState === "complete") {
    slideshow.startAutoplay();
  } else {
    window.addEventListener("load", slideshow.startAutoplay, { once: true });
  }

  return slideshow;
}

initCrossfadeSlideshowSections(
  ".j-featured-product-slideshow",
  initFeaturedProductSlideshow,
);
