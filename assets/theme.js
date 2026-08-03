/**
 * ==========================================================
 * Jerry Theme
 * Mano Studio
 * ==========================================================
 */

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
});
