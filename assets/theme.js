"use strict";

// Shared helpers. theme.js is the first theme script on every page, so the
// other scripts call these instead of each keeping its own copy.

// Shopify CDN URL for an image at a given width, re-encoded as WebP.
window.JerryResizeImageUrl = function resizeImageUrl(src, width) {
  if (!src) return "";
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}width=${width}&format=webp`;
};

// Loads the Rive runtime and the mascot script once, however many places ask.
// Resolves when window.jerryMascotMount is ready to use.
window.JerryLoadMascot = (function () {
  let request = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return function loadMascot() {
    const config = window.jerryMascotConfig;

    if (!config || !config.riveUrl || !config.scriptUrl) {
      return Promise.reject(new Error("[mascot] config missing"));
    }

    if (!request) {
      request = loadScript(config.riveUrl).then(() =>
        loadScript(config.scriptUrl),
      );
    }

    return request;
  };
})();

window.formatMoney = function formatMoney(cents, format) {
  if (typeof cents === "string") cents = cents.replace(".", "");

  const formatString = format || window.themeMoneyFormat || "${{amount}}";
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = typeof precision === "undefined" ? 2 : precision;
    thousands = typeof thousands === "undefined" ? "," : thousands;
    decimal = typeof decimal === "undefined" ? "." : decimal;

    if (isNaN(number) || number == null) return 0;

    number = (number / 100).toFixed(precision);

    const parts = number.split(".");
    const dollars = parts[0].replace(
      /(\d)(?=(\d\d\d)+(?!\d))/g,
      `$1${thousands}`,
    );
    const centsPart = parts[1] ? decimal + parts[1] : "";

    return dollars + centsPart;
  }

  const match = formatString.match(placeholderRegex);
  let value;

  switch (match ? match[1] : "amount") {
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0);
      break;
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",");
      break;
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",");
      break;
    default:
      value = formatWithDelimiters(cents, 2);
  }

  return match ? formatString.replace(placeholderRegex, value) : value;
};

document.addEventListener("DOMContentLoaded", () => {
  window.JerryProductCardCycle();
});

window.JerryProductCardCycle = (() => {
  const CYCLE_MS = 1800;
  const timers = new WeakMap();
  let observer = null;
  const hydrate = (img) => {
    if (!img || !img.dataset.src) return;
    if (img.dataset.srcset) {
      img.srcset = img.dataset.srcset;
      img.removeAttribute("data-srcset");
    }
    img.src = img.dataset.src;
    img.removeAttribute("data-src");
  };

  const isReady = (img) =>
    !img.dataset.src && img.complete && img.naturalWidth > 0;

  const advance = (container) => {
    const images = container.querySelectorAll(".j-product-card__img");
    const activeIndex = Array.from(images).findIndex((img) =>
      img.classList.contains("is-active"),
    );
    const nextIndex = (activeIndex + 1) % images.length;
    const next = images[nextIndex];
    if (!next) return;

    if (!isReady(next)) {
      hydrate(next);
      return;
    }

    images[activeIndex]?.classList.remove("is-active");
    next.classList.add("is-active");

    hydrate(images[(nextIndex + 1) % images.length]);
  };

  const getObserver = () => {
    if (observer) return observer;

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const container = entry.target;

        if (entry.isIntersecting) {
          if (timers.has(container)) return;
          hydrate(container.querySelectorAll(".j-product-card__img")[1]);
          timers.set(
            container,
            setInterval(() => advance(container), CYCLE_MS),
          );
        } else if (timers.has(container)) {
          clearInterval(timers.get(container));
          timers.delete(container);
        }
      });
    });

    return observer;
  };

  return function scan(root = document) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (document.readyState !== "complete") {
      window.addEventListener("load", () => scan(root), { once: true });
      return;
    }

    const containers = root.querySelectorAll(
      ".j-product-card__image[data-auto-cycle]",
    );

    if (!containers.length) return;

    const obs = getObserver();
    containers.forEach((container) => obs.observe(container));
  };
})();
