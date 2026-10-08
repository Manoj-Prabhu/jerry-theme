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

    // The engine is served from the theme's own assets. Without this the
    // runtime downloads it from a public CDN (unpkg, then jsDelivr).
    if (config.wasmUrl && rive.RuntimeLoader) {
      rive.RuntimeLoader.setWasmUrl(config.wasmUrl);

      if (typeof rive.RuntimeLoader.setWasmFallbackUrl === "function") {
        rive.RuntimeLoader.setWasmFallbackUrl(config.wasmUrl);
      }
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
