/* ==========================================================
   Jerry Theme Mascot (Rive)

   Requires:
   - window.jerryMascotConfig (src, stateMachine) — set in
     layout/theme.liquid, pointing at assets/mascot-cat.riv.
   - The @rive-app/canvas runtime loaded as a prior <script> tag,
     exposing the global `rive.Rive` constructor.
========================================================== */

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

  // Mounts an ambient, looping idle animation onto a caller-provided
  // <canvas> (e.g. sitting above the Quick View Add to Cart button).
  // Returns the Rive instance so the caller can `.cleanup()` it when
  // the canvas is removed/re-rendered, or null if unavailable.
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
