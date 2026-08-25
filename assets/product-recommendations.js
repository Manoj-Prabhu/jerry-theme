function initProductRecommendations(root) {
  const sections = (root || document).querySelectorAll(
    ".j-product-recommendations",
  );

  sections.forEach(async (section) => {
    // Only sections still on their initial (JS-populated) render have
    // these data attributes — ones already server-rendered via
    // recommendations.performed don't need fetching.
    if (!section.dataset.sectionId) return;

    const { sectionId, productId, limit, intent } = section.dataset;
    const container = section.querySelector(".j-product-grid");

    try {
      const response = await fetch(
        `/recommendations/products?section_id=${sectionId}&product_id=${productId}&limit=${limit}&intent=${intent}`,
      );

      if (!response.ok) {
        section.hidden = true;
        return;
      }

      const html = await response.text();

      const parser = new DOMParser();
      const documentHtml = parser.parseFromString(html, "text/html");

      const recommendations = documentHtml.querySelector(".j-product-grid");

      if (recommendations && recommendations.children.length > 0) {
        container.innerHTML = recommendations.innerHTML;

        if (window.JerryWishlist) {
          window.JerryWishlist.sync(container);
        }

        if (window.JerryProductCardCycle) {
          window.JerryProductCardCycle(container);
        }
      } else {
        section.hidden = true;
      }
    } catch (error) {
      console.error("Recommendation Error:", error);
      section.hidden = true;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => initProductRecommendations());

// The theme editor swaps this section's markup via AJAX on every
// settings change (heading, limit, intent) rather than reloading the
// page — without this, the freshly-swapped section would stay a stale
// empty/hidden shell that never fetches its recommendations.
document.addEventListener("shopify:section:load", (event) => {
  if (event.target.querySelector(".j-product-recommendations")) {
    initProductRecommendations(event.target);
  }
});
