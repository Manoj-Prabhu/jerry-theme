document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".j-product-recommendations");

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
});
