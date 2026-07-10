/* ==========================================================
   Jerry Theme Collection Sorting
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const sortSelect = document.getElementById("SortBy");

  if (!sortSelect) return;

  sortSelect.addEventListener("change", () => {
    const url = new URL(window.location.href);

    url.searchParams.set("sort_by", sortSelect.value);

    window.location.href = url.toString();
  });
});
