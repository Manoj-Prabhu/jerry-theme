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

function initHeroTextReveal() {
  const headings = document.querySelectorAll(".j-hero h1");

  if (!headings.length) return;

  headings.forEach(prepareHeroTextReveal);

  // Multi-slide hero: replay the reveal every time a slide becomes active
  // (dispatched by hero-slideshow.js), not just once on page load.
  document.addEventListener("heroSlideActivated", (event) => {
    const heading = event.detail.slide.querySelector("h1");
    playTextReveal(heading, HERO_SLIDE_CROSSFADE_MS);
  });

  // Single, non-slideshow hero (or the initially active slide before any
  // heroSlideActivated event has fired) still needs its own trigger.
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          playTextReveal(entry.target, HERO_SLIDE_CROSSFADE_MS);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );

  headings.forEach((heading) => observer.observe(heading));
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
