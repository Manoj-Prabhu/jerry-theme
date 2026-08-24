document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("Error404MascotCanvas");
  if (!canvas) return;

  const config = window.jerryMascotConfig;
  if (!config || !config.riveUrl || !config.scriptUrl) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Same lazy-load pattern as quick-view.js: the Rive runtime is only
  // ever needed on this page for the mascot, so it isn't loaded globally.
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
});
