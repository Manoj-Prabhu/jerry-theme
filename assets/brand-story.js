// Auto-rotating crossfade between the Brand Story section's Image
// blocks — only runs when there are 2+ slides (see data-slideshow on
// .j-brand-story__media in brand-story.liquid); with 0 or 1 images it's
// just a static image and this never engages.
function initBrandStorySlideshow(media) {
  if (media.dataset.slideshowInitialized) return;
  media.dataset.slideshowInitialized = "true";

  if (media.querySelectorAll(".j-brand-story__slide").length < 2) return;

  const autoplayDelay = Number(media.dataset.slideshowAutoplay) || 5000;

  const slideshow = createCrossfadeSlideshow(media, {
    slideSelector: ".j-brand-story__slide",
    autoplayDelay,
  });

  slideshow.startAutoplay();

  return slideshow;
}

initCrossfadeSlideshowSections(
  ".j-brand-story__media[data-slideshow]",
  initBrandStorySlideshow,
);
