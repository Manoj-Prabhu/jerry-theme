/* ==========================================================
   Jerry Theme Predictive Search
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("PredictiveSearchInput");
  const results = document.getElementById("PredictiveSearchResults");

  if (!input || !results) return;

  input.addEventListener("input", async () => {
    const query = input.value.trim();

    if (query.length < 2) {
      results.classList.remove("is-open");
      results.innerHTML = "";
      return;
    }

    try {
      const response = await fetch(
        `/search/suggest?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=4&section_id=predictive-search`
      );

      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const content = doc.querySelector("#shopify-section-predictive-search");

      if (content) {
        results.innerHTML = content.innerHTML;
        results.classList.add("is-open");
      }

    } catch (error) {
      console.error(error);
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".j-search-form")) {
      results.classList.remove("is-open");
    }
  });
});