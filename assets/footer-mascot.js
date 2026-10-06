document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("FooterMascotCanvas");
  if (!canvas) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  if (!("IntersectionObserver" in window)) return;

  let loaded = false;

  function loadAndMount() {
    if (loaded) return;
    loaded = true;

    const config = window.jerryMascotConfig;
    if (!config || !config.riveUrl || !config.scriptUrl) return;

    const riveScript = document.createElement("script");
    riveScript.src = config.riveUrl;
    riveScript.onload = () => {
      const mascotScript = document.createElement("script");
      mascotScript.src = config.scriptUrl;
      mascotScript.onload = () => {
        if (typeof window.jerryMascotMount === "function") {
          window.jerryMascotMount(canvas);
        }
      };
      document.head.appendChild(mascotScript);
    };
    document.head.appendChild(riveScript);
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
