// Rotates between a Featured Product section's product slides (see
// sections/featured-product.liquid) using the same crossfade engine as
// the hero/testimonials/brand-story slideshows. Each slide's own buy-box
// interactivity (variant switching, quantity, add to cart) is handled
// independently by featured-product.js — this only owns which slide is
// visible.
function initFeaturedProductSlideshow(root) {
  const track = root.querySelector(".j-featured-product-slideshow__track");
  const slides = root.querySelectorAll(".j-featured-product-slide");

  // A single product renders one static slide — nothing to rotate.
  if (slides.length < 2) return;

  const autoplayDelay = Number(root.dataset.autoplay) || 5000;

  // No arrowSelector — rotation is autoplay-only, no manual prev/next
  // controls in this section.
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
