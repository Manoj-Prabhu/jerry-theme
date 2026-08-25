function wrapWordsInNode(node, wordIndexRef) {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const tokens = child.textContent.split(/(\s+)/);
      const fragment = document.createDocumentFragment();

      tokens.forEach((token) => {
        if (token.trim() === "") {
          fragment.appendChild(document.createTextNode(token));
          return;
        }

        const span = document.createElement("span");
        span.className = "j-text-reveal__word";
        span.textContent = token;
        span.style.transitionDelay = `${wordIndexRef.count * 40}ms`;
        wordIndexRef.count++;
        fragment.appendChild(span);
      });

      node.replaceChild(fragment, child);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      wrapWordsInNode(child, wordIndexRef);
    }
  });
}

// Splits text into individual letters instead of whole words, for a
// typewriter-style sequential build. Each word is kept inside a
// non-breaking wrapper so a line never wraps mid-word — only the letters
// within a word animate individually, the words themselves still wrap
// normally at their natural spaces.
function wrapLettersInNode(node, letterIndexRef) {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const tokens = child.textContent.split(/(\s+)/);
      const fragment = document.createDocumentFragment();

      tokens.forEach((token) => {
        if (token.trim() === "") {
          fragment.appendChild(document.createTextNode(token));
          return;
        }

        const wordWrap = document.createElement("span");
        wordWrap.className = "j-text-reveal__word-wrap";

        Array.from(token).forEach((char) => {
          const span = document.createElement("span");
          span.className = "j-text-reveal__word";
          span.textContent = char;
          span.style.transitionDelay = `${letterIndexRef.count * 25}ms`;
          letterIndexRef.count++;
          wordWrap.appendChild(span);
        });

        fragment.appendChild(wordWrap);
      });

      node.replaceChild(fragment, child);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      wrapLettersInNode(child, letterIndexRef);
    }
  });
}

// Prepares a heading for the word-by-word fade reveal — safe to call more
// than once (guarded), since a multi-slide hero has one heading per slide.
function prepareTextReveal(heading) {
  if (heading.dataset.textReveal) return;
  heading.dataset.textReveal = "true";

  wrapWordsInNode(heading, { count: 0 });
  heading.classList.add("j-text-reveal");
}

// Same idea, but for the hero heading specifically — a letter-by-letter
// typewriter-style build instead of whole words appearing at once.
function prepareHeroTextReveal(heading) {
  if (heading.dataset.textReveal) return;
  heading.dataset.textReveal = "true";

  wrapLettersInNode(heading, { count: 0 });
  heading.classList.add("j-text-reveal");
}

// Resets and replays the fade-in for one heading — called on first load
// and again every time the slideshow activates a different hero slide, so
// each slide's heading animates independently instead of only the first.
function playTextReveal(heading, delay = 50) {
  if (!heading) return;

  clearTimeout(heading._textRevealTimer);
  heading.classList.remove("is-revealed");
  void heading.offsetWidth;

  heading._textRevealTimer = setTimeout(() => {
    heading.classList.add("is-revealed");
  }, delay);
}

// The hero slide itself crossfades in over 0.8s (see .j-hero-slideshow__slide
// in hero.css) — starting the letter reveal at the same moment as that fade
// buries it under the slide's own opacity transition, so it barely reads as
// an animation. Waiting until the slide has finished fading in first makes
// the letter-by-letter build clearly visible against an already-visible slide.
const HERO_SLIDE_CROSSFADE_MS = 800;

// Badge and description get the same word-by-word reveal section titles
// already use elsewhere (prepareTextReveal), not the heading's
// letter-by-letter build — a whole paragraph animating letter by letter
// would take far too long to finish. A small stagger around the
// heading's own delay (badge just before, description just after) reads
// as one coordinated reveal rather than three unrelated elements
// animating independently.
const HERO_BADGE_DELAY_MS = HERO_SLIDE_CROSSFADE_MS - 100;
const HERO_DESCRIPTION_DELAY_MS = HERO_SLIDE_CROSSFADE_MS + 150;

let textRevealHeroListenerBound = false;

function initHeroTextReveal() {
  const slides = document.querySelectorAll(".j-hero");

  if (!slides.length) return;

  const headings = document.querySelectorAll(".j-hero h1");
  const badges = document.querySelectorAll(".j-hero__badge");
  const descriptions = document.querySelectorAll(".j-hero p");

  headings.forEach(prepareHeroTextReveal);
  badges.forEach(prepareTextReveal);
  descriptions.forEach(prepareTextReveal);

  // Multi-slide hero: replay the reveal every time a slide becomes active
  // (dispatched by hero-slideshow.js), not just once on page load. Bound
  // once, ever — this listens on `document` (never replaced by a section
  // reload), so re-running initHeroTextReveal on every
  // shopify:section:load would otherwise stack a duplicate listener each
  // time, playing the reveal multiple times per slide change.
  if (!textRevealHeroListenerBound) {
    textRevealHeroListenerBound = true;
    document.addEventListener("heroSlideActivated", (event) => {
      const slide = event.detail.slide;
      playTextReveal(slide.querySelector(".j-hero__badge"), HERO_BADGE_DELAY_MS);
      playTextReveal(slide.querySelector("h1"), HERO_SLIDE_CROSSFADE_MS);
      playTextReveal(slide.querySelector("p"), HERO_DESCRIPTION_DELAY_MS);
    });
  }

  // Single, non-slideshow hero (or the initially active slide before any
  // heroSlideActivated event has fired) still needs its own trigger.
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const slide = entry.target;
        playTextReveal(slide.querySelector(".j-hero__badge"), HERO_BADGE_DELAY_MS);
        playTextReveal(slide.querySelector("h1"), HERO_SLIDE_CROSSFADE_MS);
        playTextReveal(slide.querySelector("p"), HERO_DESCRIPTION_DELAY_MS);
        obs.unobserve(slide);
      });
    },
    { threshold: 0.2 },
  );

  slides.forEach((slide) => observer.observe(slide));
}

function initSectionTitleReveal() {
  const targets = document.querySelectorAll(".j-section-title h2");

  if (!targets.length) return;

  targets.forEach(prepareTextReveal);

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );

  targets.forEach((heading) => observer.observe(heading));
}

function initTextReveal() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

  initHeroTextReveal();
  initSectionTitleReveal();
}

document.addEventListener("DOMContentLoaded", () => {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(initTextReveal, { timeout: 1500 });
  } else {
    setTimeout(initTextReveal, 150);
  }
});

// The theme editor swaps a section's markup via AJAX on every settings
// change rather than reloading the page — without this, a hero slide or
// section title added/swapped in after initial load never gets wrapped
// into words/letters, so it never gets the reveal treatment at all.
// prepareTextReveal/prepareHeroTextReveal are self-guarded per-element
// (dataset.textReveal), so re-running against already-processed
// elements is a safe no-op.
document.addEventListener("shopify:section:load", initTextReveal);
