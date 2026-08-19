function initHeroSlideshow(root) {
  if (root.dataset.heroSlideshowInitialized) return;
  root.dataset.heroSlideshowInitialized = "true";

  const track = root.querySelector(".j-hero-slideshow__track");
  const autoplayDelay = Number(root.dataset.autoplay) || 5000;

  // Non-first slides ship with data-src/data-srcset instead of real
  // src/srcset (see hero.liquid) so the browser doesn't fetch every slide
  // image (or, worse, video) upfront just because they geometrically
  // overlap the viewport.
  function hydrateSlideImage(slide) {
    const img = slide.querySelector("img[data-src]");
    if (img) {
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        img.removeAttribute("data-srcset");
      }
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
    }
  }

  function hydrateSlideVideo(slide) {
    const videoSource = slide.querySelector("video source[data-src]");
    if (videoSource) {
      const video = videoSource.closest("video");
      videoSource.src = videoSource.dataset.src;
      videoSource.removeAttribute("data-src");
      // Changing a <source>'s src after the fact needs an explicit load()
      // for the <video> to actually pick it up.
      if (video) video.load();
    }
  }

  function hydrateSlide(slide) {
    hydrateSlideImage(slide);
    hydrateSlideVideo(slide);
  }

  // Images only here — they're light, so preloading every slide's image
  // up front avoids any blank/loading gap on a crossfade. Videos are
  // deliberately NOT included: each one can be several MB, and hydrating
  // every hero video shortly after load (the previous behavior of this
  // function) meant the page was downloading 3-4 full videos within a
  // couple of seconds regardless of whether autoplay ever reached them —
  // a large, mostly-wasted chunk of the page's total network payload.
  // Videos hydrate progressively instead — see hydrateUpcomingVideo below,
  // which only ever keeps one slide's video a step ahead of playback.
  function hydrateDeferredSlideImages() {
    slideshow.slides.forEach(hydrateSlideImage);
  }

  // Hydrates (and lets the browser start buffering) the NEXT slide's
  // video while the current one is still showing — a middle ground
  // between loading every video upfront (expensive) and only starting a
  // slide's own download at the exact moment it becomes active (a
  // visible stutter/black-frame risk, since a multi-MB video won't be
  // ready instantly). autoplayDelay is several seconds, which is ample
  // lead time for this to finish before it's actually needed.
  function hydrateUpcomingVideo() {
    const nextIndex = (slideshow.currentIndex + 1) % slideshow.slides.length;
    hydrateSlideVideo(slideshow.slides[nextIndex]);
  }

  // At most one hero video should ever be playing at a time — pause
  // whichever slide is being left, and (after making sure its source is
  // actually hydrated) play whichever slide is becoming active. Never
  // autoplays for visitors who prefer reduced motion; the video just sits
  // on its poster frame instead.
  function pauseSlideVideo(slide) {
    const video = slide.querySelector("video");
    if (video) video.pause();
  }

  function playSlideVideo(slide) {
    if (slideshow.prefersReducedMotion) return;

    const video = slide.querySelector("video");
    if (!video) return;

    if (video.querySelector("source[data-src]")) hydrateSlide(slide);

    // load() is async; play() can be called immediately after regardless,
    // the browser queues it correctly once the new source is ready.
    const playResult = video.play();
    if (playResult && typeof playResult.catch === "function") {
      // Autoplay can be blocked by the browser in some contexts (e.g. low
      // power mode) — that's fine, the poster frame is a reasonable
      // fallback and isn't worth surfacing as an error.
      playResult.catch(() => {});
    }
  }

  // Lets listeners (e.g. the hero heading's initials-cluster reveal in
  // text-reveal.js) replay per-slide effects every time a slide becomes
  // active — including the one that's active from first paint, not just
  // slides reached via arrow/autoplay navigation.
  function announceActiveSlide(slide) {
    document.dispatchEvent(
      new CustomEvent("heroSlideActivated", { detail: { slide } }),
    );
  }

  const slideshow = createCrossfadeSlideshow(root, {
    slideSelector: ".j-hero-slideshow__slide",
    track,
    autoplayDelay,
    arrowSelector: {
      prev: ".j-hero-slideshow__arrow--prev",
      next: ".j-hero-slideshow__arrow--next",
    },
    onChange(prevSlide, nextSlide) {
      pauseSlideVideo(prevSlide);
      playSlideVideo(nextSlide);
      announceActiveSlide(nextSlide);
      // Queue the slide after this one up next, keeping exactly one video
      // hydrated ahead of playback at any given time.
      hydrateUpcomingVideo();
    },
  });

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(hydrateDeferredSlideImages, { timeout: 2000 });
    // Give the second slide's video a head start now, rather than waiting
    // for the first autoplay transition to trigger it.
    window.requestIdleCallback(hydrateUpcomingVideo, { timeout: 2000 });
  } else {
    setTimeout(hydrateDeferredSlideImages, 1000);
    setTimeout(hydrateUpcomingVideo, 1000);
  }

  announceActiveSlide(slideshow.slides[slideshow.currentIndex]);

  // The initial slide's video (if any) has the autoplay attribute directly
  // in its HTML, which the browser honors regardless of the visitor's
  // motion preference — pause it immediately if they prefer reduced motion.
  if (slideshow.prefersReducedMotion) {
    pauseSlideVideo(slideshow.slides[slideshow.currentIndex]);
  }

  // Starting the autoplay timer immediately competes with the page's own
  // critical-path loading: each slide advance during the initial load
  // triggers a fresh video download (see hydrateUpcomingVideo), and under
  // throttled/slow conditions those downloads don't finish within one
  // autoplayDelay interval, so they pile up — several videos' worth of
  // network traffic in flight before the page has even finished loading,
  // inflating total payload and main-thread work in exactly the window
  // LCP/TBT are measured in. Waiting for the window load event keeps the
  // same autoplay behavior for real visitors while keeping the initial
  // load free of extra slide-driven downloads.
  if (document.readyState === "complete") {
    slideshow.startAutoplay();
  } else {
    window.addEventListener("load", slideshow.startAutoplay, { once: true });
  }

  return slideshow;
}

initCrossfadeSlideshowSections(".j-hero-slideshow", initHeroSlideshow);
