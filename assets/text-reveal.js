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

function prepareTextReveal(heading) {
  if (heading.dataset.textReveal) return;
  heading.dataset.textReveal = "true";

  wrapWordsInNode(heading, { count: 0 });
  heading.classList.add("j-text-reveal");
}

function prepareHeroTextReveal(heading) {
  if (heading.dataset.textReveal) return;
  heading.dataset.textReveal = "true";

  wrapLettersInNode(heading, { count: 0 });
  heading.classList.add("j-text-reveal");
}

function playTextReveal(heading, delay = 50) {
  if (!heading) return;

  clearTimeout(heading._textRevealTimer);
  heading.classList.remove("is-revealed");
  void heading.offsetWidth;

  heading._textRevealTimer = setTimeout(() => {
    heading.classList.add("is-revealed");
  }, delay);
}

const HERO_SLIDE_CROSSFADE_MS = 800;
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

  if (!textRevealHeroListenerBound) {
    textRevealHeroListenerBound = true;
    document.addEventListener("heroSlideActivated", (event) => {
      const slide = event.detail.slide;
      playTextReveal(
        slide.querySelector(".j-hero__badge"),
        HERO_BADGE_DELAY_MS,
      );
      playTextReveal(slide.querySelector("h1"), HERO_SLIDE_CROSSFADE_MS);
      playTextReveal(slide.querySelector("p"), HERO_DESCRIPTION_DELAY_MS);
    });
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const slide = entry.target;
        playTextReveal(
          slide.querySelector(".j-hero__badge"),
          HERO_BADGE_DELAY_MS,
        );
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

document.addEventListener("shopify:section:load", initTextReveal);
