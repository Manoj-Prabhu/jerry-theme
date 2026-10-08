document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("Error404MascotCanvas");
  if (!canvas) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  window
    .JerryLoadMascot()
    .then(() => {
      if (typeof window.jerryMascotMount === "function") {
        window.jerryMascotMount(canvas);
      }
    })
    .catch(() => {
      /* decorative — nothing to do if it can't load */
    });
});
