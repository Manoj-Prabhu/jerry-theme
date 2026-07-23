/* ==========================================================
   Jerry Theme Collection Sorting
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const sortSelect = document.getElementById("SortBy");

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("sort_by", sortSelect.value);
      window.location.href = url.toString();
    });
  }

  /* ==========================================================
     Mobile Filter Drawer
  ========================================================== */

  const filterToggle = document.querySelector(".j-filter-toggle");
  const filterSidebar = document.getElementById("CollectionFilters");
  const filterOverlay = document.querySelector(".j-filter-overlay");
  const filterClose = document.querySelector(".j-collection-filters__close");

  if (!filterToggle || !filterSidebar || !filterOverlay) return;

  const isMobile = () => window.matchMedia("(max-width: 992px)").matches;

  const openFilters = () => {
    filterSidebar.classList.add("is-open");
    filterOverlay.classList.add("is-open");
    filterToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };

  const closeFilters = () => {
    filterSidebar.classList.remove("is-open");
    filterOverlay.classList.remove("is-open");
    filterToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  filterToggle.addEventListener("click", openFilters);
  filterOverlay.addEventListener("click", closeFilters);

  if (filterClose) {
    filterClose.addEventListener("click", closeFilters);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeFilters();
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) closeFilters();
  });
});
