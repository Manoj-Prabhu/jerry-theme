document.addEventListener("DOMContentLoaded", async () => {
  const section = document.querySelector(".j-product-recommendations");

  if (!section) return;

  const productId = section.dataset.productId;
  const limit = section.dataset.limit;
  const container = document.getElementById("ProductRecommendations");

  try {
    const response = await fetch(
      `/recommendations/products?section_id=product-recommendations&product_id=${productId}&limit=${limit}`,
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
    } else {
      section.hidden = true;
    }
  } catch (error) {
    console.error("Recommendation Error:", error);
    section.hidden = true;
  }
});
