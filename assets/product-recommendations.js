function initProductRecommendations(root) {
  const sections = (root || document).querySelectorAll(
    ".j-product-recommendations",
  );

  sections.forEach(async (section) => {
    if (!section.dataset.sectionId) return;

    const { sectionId, productId, limit, intent } = section.dataset;
    const container = section.querySelector(".j-product-grid");

    try {
      const response = await fetch(
        `${window.themeRoutes.productRecommendations}?section_id=${sectionId}&product_id=${productId}&limit=${limit}&intent=${intent}`,
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
        section.hidden = false;

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

document.addEventListener("DOMContentLoaded", () =>
  initProductRecommendations(),
);

document.addEventListener("shopify:section:load", (event) => {
  if (event.target.querySelector(".j-product-recommendations")) {
    initProductRecommendations(event.target);
  }
});
