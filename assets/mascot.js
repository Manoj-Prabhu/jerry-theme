(function () {
  const config = window.jerryMascotConfig;
  if (!config || !config.src) return;

  function riveReady() {
    if (typeof rive !== "undefined" && rive.Rive) return true;
    console.warn(
      "[mascot] @rive-app/canvas runtime not loaded yet (CDN blocked/slow?) — skipping mascot animation.",
    );
    return false;
  }

  function mountMascotIdle(canvas) {
    if (
      !canvas ||
      !riveReady() ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return null;
    }

    return new rive.Rive({
      src: config.src,
      canvas: canvas,
      autoplay: true,
      stateMachines: config.stateMachine,
      onLoadError: (error) => {
        console.error("[mascot] Failed to load .riv file:", error);
      },
    });
  }

  window.jerryMascotMount = mountMascotIdle;
})();
