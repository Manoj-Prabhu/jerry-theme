"use strict";

/**
 * Formats a price given in cents into the shop's active money format
 * (e.g. "${{amount}}", "{{amount}} CAD"). Mirrors Shopify's standard
 * formatMoney implementation so client-side/AJAX-rendered prices match
 * the shop's actual currency instead of a hardcoded symbol.
 */
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
  console.log("Jerry Theme initialized");
  window.JerryProductCardCycle();
});

/**
 * Product cards with more than one image auto-cycle through them (no
 * hover required). Only cards currently visible in the viewport run their
 * interval, and the whole feature is skipped under prefers-reduced-motion.
 *
 * Exposed on window and re-callable: sections that inject product cards
 * after page load (recommendations, recently viewed, predictive search)
 * call it again, scoped to their own container, to pick up the new cards —
 * the shared observer/timer map means already-cycling cards are unaffected.
 */
window.JerryProductCardCycle = (() => {
  const CYCLE_MS = 1800;
  const timers = new WeakMap();
  let observer = null;

  const advance = (container) => {
    const images = container.querySelectorAll(".j-product-card__img");
    const activeIndex = Array.from(images).findIndex((img) =>
      img.classList.contains("is-active"),
    );
    const nextIndex = (activeIndex + 1) % images.length;

    images[activeIndex]?.classList.remove("is-active");
    images[nextIndex]?.classList.add("is-active");
  };

  const getObserver = () => {
    if (observer) return observer;

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const container = entry.target;

        if (entry.isIntersecting) {
          if (timers.has(container)) return;
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

    const containers = root.querySelectorAll(
      ".j-product-card__image[data-auto-cycle]",
    );

    if (!containers.length) return;

    const obs = getObserver();
    containers.forEach((container) => obs.observe(container));
  };
})();
