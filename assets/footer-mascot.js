// Same lazy-load pattern as quick-view.js/404.js: the Rive runtime is
// never loaded globally, only fetched where the mascot actually appears.
// Unlike those two (opened on click / a rarely-visited page), this
// canvas sits in the footer of every single page — so it's additionally
// gated behind an IntersectionObserver, only fetching anything once a
// visitor has actually scrolled this far. A homepage visitor who never
// reaches the footer never downloads a single byte of this.
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
});
