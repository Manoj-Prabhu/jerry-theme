/**
 * ==========================================================
 * Jerry Header
 * Mano Studio
 * ==========================================================
 */

"use strict";

class JerryHeader {
  init() {
    this.initAnnouncementBar();
    this.initStickyHeader();
  }

  /* ==========================================================
     Announcement Bar
  ========================================================== */

  initAnnouncementBar(root = document) {
    const bar = root.querySelector(".j-announcement");

    if (!bar) return;

    const items = bar.querySelectorAll(".j-announcement__item");
    const closeButton = bar.querySelector(".j-announcement__close");
    const isAutoplay = bar.dataset.autoplay === "true";
    const speedSeconds = Number(bar.dataset.speed) || 5;

    let activeIndex = Array.from(items).findIndex((item) =>
      item.classList.contains("is-active"),
    );

    if (activeIndex < 0) activeIndex = 0;

    let rotationTimer = null;

    const rotate = () => {
      items[activeIndex].classList.remove("is-active");
      activeIndex = (activeIndex + 1) % items.length;
      items[activeIndex].classList.add("is-active");
    };

    const startRotation = () => {
      if (!rotationTimer && isAutoplay && items.length > 1) {
        rotationTimer = window.setInterval(rotate, speedSeconds * 1000);
      }
    };

    const stopRotation = () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
        rotationTimer = null;
      }
    };

    startRotation();

    bar.addEventListener("mouseenter", stopRotation);
    bar.addEventListener("mouseleave", startRotation);

    if (closeButton) {
      closeButton.addEventListener("click", () => {
        stopRotation();

        bar.remove();
      });
    }
  }

  /* ==========================================================
     Sticky Header
  ========================================================== */

  initStickyHeader() {
    const header = document.querySelector(".j-header--sticky");

    if (!header) return;

    let lastScroll = 0;

    window.addEventListener("scroll", () => {
      const currentScroll = window.pageYOffset;

      /* Shadow */

      if (currentScroll > 10) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }

      /* Always visible at top */

      if (currentScroll <= 0) {
        header.classList.remove("is-hidden");
        lastScroll = 0;
        return;
      }

      /* Hide */

      if (currentScroll > lastScroll && currentScroll > 100) {
        header.classList.add("is-hidden");
      }

      /* Show */

      if (currentScroll < lastScroll) {
        header.classList.remove("is-hidden");
      }

      lastScroll = currentScroll;
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new JerryHeader().init();
});

document.addEventListener("shopify:section:load", (event) => {
  if (event.target.querySelector(".j-announcement")) {
    new JerryHeader().initAnnouncementBar(event.target);
  }
});