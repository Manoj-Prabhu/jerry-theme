/* ==========================================================
   Jerry Theme Back to Top Button
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("BackToTop");

  if (!button) return;

  const SHOW_AFTER = 400;
  const stickyCart = document.getElementById("StickyCart");

  let ticking = false;

  const update = () => {
    button.classList.toggle("is-visible", window.scrollY > SHOW_AFTER);
    button.classList.toggle(
      "is-raised",
      Boolean(stickyCart && stickyCart.classList.contains("is-visible")),
    );

    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true },
  );

  update();

  button.addEventListener("click", () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  });
});
