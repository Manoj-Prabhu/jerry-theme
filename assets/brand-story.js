// Auto-rotating crossfade between the Brand Story section's Image
// blocks — only runs when there are 2+ slides (see data-slideshow on
// .j-brand-story__media in brand-story.liquid); with 0 or 1 images it's
// just a static image and this never engages.
function initBrandStorySlideshow(media) {
  if (media.dataset.slideshowInitialized) return;
  media.dataset.slideshowInitialized = "true";

  const slides = Array.from(media.querySelectorAll(".j-brand-story__slide"));
  if (slides.length < 2) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const autoplayDelay = Number(media.dataset.slideshowAutoplay) || 5000;
  let currentIndex = slides.findIndex((slide) =>
    slide.classList.contains("is-active"),
  );
  if (currentIndex < 0) currentIndex = 0;

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

  setInterval(() => goToSlide(currentIndex + 1), autoplayDelay);
}

function initAllBrandStorySlideshows() {
  document
    .querySelectorAll(".j-brand-story__media[data-slideshow]")
    .forEach(initBrandStorySlideshow);
}

document.addEventListener("DOMContentLoaded", initAllBrandStorySlideshows);

// The theme editor replaces a section's markup wholesale on block
// add/remove/reorder, leaving fresh elements with no listener attached.
document.addEventListener("shopify:section:load", (event) => {
  event.target
    .querySelectorAll(".j-brand-story__media[data-slideshow]")
    .forEach(initBrandStorySlideshow);
});
