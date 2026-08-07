document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("HeaderSearchForm");
  const input = document.getElementById("PredictiveSearchInput");
  const results = document.getElementById("PredictiveSearchResults");

  if (!form || !input || !results) return;

  const STORAGE_KEY = "jerry_recent_searches";
  const MAX_RECENT = 6;

  /* Recent Searches Storage */

  const getRecentSearches = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(stored) ? stored : [];
    } catch (error) {
      return [];
    }
  };

  const saveRecentSearch = (term) => {
    const trimmed = term.trim();

    if (!trimmed) return;

    const existing = getRecentSearches().filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase(),
    );

    existing.unshift(trimmed);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(existing.slice(0, MAX_RECENT)),
      );
    } catch (error) {
      /* localStorage unavailable (private browsing, quota, etc.) — no-op */
    }
  };

  const removeRecentSearch = (term) => {
    const existing = getRecentSearches().filter((item) => item !== term);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (error) {
      /* no-op */
    }
  };

  const clearRecentSearches = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      /* no-op */
    }
  };

  /* Open / Close State */

  const openResults = () => {
    results.classList.add("is-open");
    input.setAttribute("aria-expanded", "true");
  };

  const closeResults = () => {
    results.classList.remove("is-open");
    input.setAttribute("aria-expanded", "false");
  };

  /* Rendering */

  const escapeHtml = (value) =>
    value.replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );

  const renderRecentSearches = () => {
    const recent = getRecentSearches();

    if (recent.length === 0) {
      closeResults();
      results.innerHTML = "";
      return;
    }

    const strings = window.themeStrings || {};
    const removeTemplate =
      strings.removeRecentSearchHtml || "Remove __TERM__ from recent searches";

    const items = recent
      .map(
        (term) => `
          <li class="j-recent-searches__item">
            <button type="button" class="j-recent-searches__term" data-term="${escapeHtml(term)}">
              ${escapeHtml(term)}
            </button>
            <button type="button" class="j-recent-searches__remove" data-remove="${escapeHtml(term)}" aria-label="${escapeHtml(removeTemplate.replace("__TERM__", term))}">
              ✕
            </button>
          </li>
        `,
      )
      .join("");

    results.innerHTML = `
      <div class="j-recent-searches">
        <div class="j-recent-searches__header">
          <span>${strings.recentlySearched || "Recently Searched"}</span>
          <button type="button" class="j-recent-searches__clear">${strings.searchClearAll || "Clear all"}</button>
        </div>
        <ul class="j-recent-searches__list">${items}</ul>
      </div>
    `;

    openResults();
  };

  const runPredictiveSearch = async (query) => {
    try {
      const response = await fetch(
        `/search/suggest?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=4&section_id=predictive-search`,
      );

      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const content = doc.querySelector("#shopify-section-predictive-search");

      if (content) {
        results.innerHTML = content.innerHTML;
        openResults();
      }
    } catch (error) {
      console.error(error);
    }
  };

  /* Events */

  input.addEventListener("input", () => {
    const query = input.value.trim();

    if (query.length < 2) {
      renderRecentSearches();
      return;
    }

    runPredictiveSearch(query);
  });

  input.addEventListener("focus", () => {
    if (input.value.trim().length < 2) {
      renderRecentSearches();
    }
  });

  // Enter never navigates away — shoppers pick a result from the
  // predictive dropdown instead of landing on the full search page.
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (input.value.trim()) {
      saveRecentSearch(input.value);
    }
  });

  results.addEventListener("click", (event) => {
    const productLink = event.target.closest(".j-predictive-search-item");
    if (productLink) {
      saveRecentSearch(input.value);
      return;
    }

    const termButton = event.target.closest(".j-recent-searches__term");
    if (termButton) {
      input.value = termButton.dataset.term;
      input.focus();
      runPredictiveSearch(termButton.dataset.term);
      return;
    }

    const removeButton = event.target.closest(".j-recent-searches__remove");
    if (removeButton) {
      removeRecentSearch(removeButton.dataset.remove);
      renderRecentSearches();
      return;
    }

    const clearButton = event.target.closest(".j-recent-searches__clear");
    if (clearButton) {
      clearRecentSearches();
      renderRecentSearches();
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".j-search-form")) {
      closeResults();
    }
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeResults();
      input.blur();
    }
  });
});
