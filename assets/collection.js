function initCollectionControls() {
  const sortSelect = document.getElementById("SortBy");

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("sort_by", sortSelect.value);
      window.location.href = url.toString();
    });
  }

  /* Mobile Filter Drawer */

  const filterToggle = document.querySelector(".j-filter-toggle");
  const filterSidebar = document.getElementById("CollectionFilters");
  const filterOverlay = document.querySelector(".j-filter-overlay");
  const filterClose = document.querySelector(".j-collection-filters__close");

  if (!filterToggle || !filterSidebar || !filterOverlay) return;

  let lastFilterTrigger = null;

  const getFilterFocusable = () =>
    Array.from(
      filterSidebar.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null);

  const trapFilterFocus = (event) => {
    if (event.key === "Escape") {
      closeFilters();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFilterFocusable();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const openFilters = () => {
    lastFilterTrigger = document.activeElement;
    filterSidebar.classList.add("is-open");
    filterOverlay.classList.add("is-open");
    filterToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", trapFilterFocus);

    if (filterClose) filterClose.focus();
  };

  const closeFilters = () => {
    filterSidebar.classList.remove("is-open");
    filterOverlay.classList.remove("is-open");
    filterToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", trapFilterFocus);

    if (lastFilterTrigger) {
      lastFilterTrigger.focus();
      lastFilterTrigger = null;
    }
  };

  filterToggle.addEventListener("click", openFilters);
  filterOverlay.addEventListener("click", closeFilters);

  if (filterClose) {
    filterClose.addEventListener("click", closeFilters);
  }
}

document.addEventListener("DOMContentLoaded", initCollectionControls);

// The theme editor swaps a section's markup via AJAX on every settings
// change rather than reloading the page — without this, the sort
// dropdown and mobile filter drawer stop responding after any edit to
// the main collection or search section.
document.addEventListener("shopify:section:load", (event) => {
  if (
    event.target.querySelector("#SortBy") ||
    event.target.querySelector("#CollectionFilters")
  ) {
    initCollectionControls();
  }
});
