document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("FooterMascotCanvas");
  if (!canvas) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  if (!("IntersectionObserver" in window)) return;

  let loaded = false;

  function loadAndMount() {
    if (loaded) return;
    loaded = true;

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
  }

  function watchForFooter() {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadAndMount();
            obs.disconnect();
          }
        });
      },
      { rootMargin: "200px" },
    );

    observer.observe(canvas);
  }

  const interactionEvents = [
    "scroll",
    "wheel",
    "pointerdown",
    "touchstart",
    "keydown",
  ];

  function onFirstInteraction() {
    interactionEvents.forEach((type) =>
      window.removeEventListener(type, onFirstInteraction),
    );
    watchForFooter();
  }

  interactionEvents.forEach((type) =>
    window.addEventListener(type, onFirstInteraction, { passive: true }),
  );
});
