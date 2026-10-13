function initHeroSlideshow(root) {
  if (root.dataset.heroSlideshowInitialized) return;
  root.dataset.heroSlideshowInitialized = "true";

  const autoplayDelay = Number(root.dataset.autoplay) || 5000;

  function hydrateSlideImage(slide) {
    const img = slide.querySelector("img[data-src]");
    if (img) {
      // A <picture> source has to be ready before the <img> starts loading.
      slide
        .querySelectorAll("picture source[data-srcset]")
        .forEach((source) => {
          source.srcset = source.dataset.srcset;
          source.removeAttribute("data-srcset");
        });

      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        img.removeAttribute("data-srcset");
      }
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
    }
  }

  function hydrateSlideVideo(slide) {
    const video = slide.querySelector("video");
    if (!video) return;

    const sources = video.querySelectorAll("source[data-src]");
    if (!sources.length) return;

    sources.forEach((source) => {
      source.src = source.dataset.src;
      source.removeAttribute("data-src");
    });
    video.load();
  }

  function hydrateSlide(slide) {
    hydrateSlideImage(slide);
    hydrateSlideVideo(slide);
  }

  function hydrateDeferredSlideImages() {
    slideshow.slides.forEach(hydrateSlideImage);
  }

  function hydrateUpcomingVideo() {
    // Videos never play with reduced motion, so none is downloaded.
    if (slideshow.prefersReducedMotion) return;

    const nextIndex = (slideshow.currentIndex + 1) % slideshow.slides.length;
    hydrateSlideVideo(slideshow.slides[nextIndex]);
  }

  function pauseSlideVideo(slide) {
    const video = slide.querySelector("video");
    if (video) video.pause();
  }

  function playSlideVideo(slide) {
    if (slideshow.prefersReducedMotion) return;

    const video = slide.querySelector("video");
    if (!video) return;

    hydrateSlideImage(slide);
    hydrateSlideVideo(slide);
    const playResult = video.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {});
    }
  }

  function announceActiveSlide(slide) {
    document.dispatchEvent(
      new CustomEvent("heroSlideActivated", { detail: { slide } }),
    );
  }

  let heroInView = true;

  const slideshow = createCrossfadeSlideshow(root, {
    slideSelector: ".j-hero-slideshow__slide",
    autoplayDelay,
    arrowSelector: {
      prev: ".j-hero-slideshow__arrow--prev",
      next: ".j-hero-slideshow__arrow--next",
    },
    onChange(prevSlide, nextSlide) {
      pauseSlideVideo(prevSlide);
      playSlideVideo(nextSlide);
      announceActiveSlide(nextSlide);
      hydrateUpcomingVideo();
    },
    onVisibilityChange(inView) {
      heroInView = inView;
      const slide = slideshow.slides[slideshow.currentIndex];
      if (inView) {
        playSlideVideo(slide);
      } else {
        pauseSlideVideo(slide);
      }
    },
  });

  root.querySelectorAll(".j-hero__video--over-poster").forEach((video) => {
    const poster = video.parentElement.querySelector(".j-hero__img");
    const reveal = () => video.classList.add("is-playing");

    const revealAfterPoster = () => {
      if (!poster || (poster.complete && poster.naturalWidth > 0)) {
        requestAnimationFrame(() => requestAnimationFrame(reveal));
      } else {
        poster.addEventListener("load", revealAfterPoster, { once: true });
        poster.addEventListener("error", reveal, { once: true });
      }
    };

    if (!video.paused && video.readyState >= 3) {
      revealAfterPoster();
    } else {
      video.addEventListener("playing", revealAfterPoster, { once: true });
    }
  });

  function whenIdle(fn) {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(fn, { timeout: 2000 });
    } else {
      setTimeout(fn, 1000);
    }
  }

  // No video is requested while the page is still loading (see the note on
  // data-src in sections/hero.liquid): the first slide shows its poster
  // image until then.
  function playActiveSlideVideo() {
    if (heroInView) playSlideVideo(slideshow.slides[slideshow.currentIndex]);
  }

  function hydrateAfterLoad() {
    whenIdle(playActiveSlideVideo);
    whenIdle(hydrateDeferredSlideImages);
    whenIdle(hydrateUpcomingVideo);
  }

  if (document.readyState === "complete") {
    hydrateAfterLoad();
  } else {
    window.addEventListener("load", hydrateAfterLoad, { once: true });
  }

  announceActiveSlide(slideshow.slides[slideshow.currentIndex]);

  function startAutoplayAfterFirstPaint() {
    const img =
      slideshow.slides[slideshow.currentIndex].querySelector(".j-hero__img");
    const start = () =>
      requestAnimationFrame(() =>
        requestAnimationFrame(slideshow.startAutoplay),
      );

    if (!img || (img.complete && img.naturalWidth > 0)) {
      start();
    } else {
      img.addEventListener("load", start, { once: true });
      img.addEventListener("error", start, { once: true });
    }
  }

  if (document.readyState === "complete") {
    startAutoplayAfterFirstPaint();
  } else {
    window.addEventListener("load", startAutoplayAfterFirstPaint, {
      once: true,
    });
  }

  return slideshow;
}

initCrossfadeSlideshowSections(".j-hero-slideshow", initHeroSlideshow);
