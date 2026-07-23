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
    this.initMobileMenu();
    this.initHeaderSearchToggle();
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

  /* ==========================================================
     Mobile Menu
  ========================================================== */

  initMobileMenu() {
    const toggle = document.querySelector(".j-menu-toggle");
    const closeButton = document.querySelector(".j-menu-close");
    const nav = document.getElementById("HeaderNav");
    const overlay = document.querySelector(".j-nav-overlay");

    if (!toggle || !nav || !overlay) return;

    const isMobile = () => window.matchMedia("(max-width: 992px)").matches;

    const openMenu = () => {
      nav.classList.add("is-open");
      overlay.classList.add("is-open");
      toggle.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    };

    const closeMenu = () => {
      nav.classList.remove("is-open");
      overlay.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";

      nav.querySelectorAll(".j-nav-item.is-open").forEach((item) => {
        item.classList.remove("is-open");
      });
    };

    toggle.addEventListener("click", () => {
      if (nav.classList.contains("is-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (closeButton) {
      closeButton.addEventListener("click", closeMenu);
    }

    overlay.addEventListener("click", closeMenu);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (!isMobile()) closeMenu();
    });

    /* On mobile, tapping a parent link with children expands the
       dropdown instead of navigating away; desktop keeps :hover. */

    nav.querySelectorAll(".j-nav-item").forEach((item) => {
      const link = item.querySelector(".j-nav-link");
      const dropdown = item.querySelector(".j-dropdown");

      if (!dropdown) return;

      link.addEventListener("click", (event) => {
        if (!isMobile()) return;

        event.preventDefault();
        item.classList.toggle("is-open");
      });
    });
  }

  /* ==========================================================
     Header Search Toggle
  ========================================================== */

  initHeaderSearchToggle() {
    const toggle = document.querySelector(".j-header__search-toggle");
    const searchForm = document.getElementById("HeaderSearchForm");

    if (!toggle || !searchForm) return;

    toggle.addEventListener("click", () => {
      const isOpen = searchForm.classList.toggle("is-open");

      toggle.setAttribute("aria-expanded", String(isOpen));

      if (isOpen) {
        searchForm.querySelector("input")?.focus();
      }
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
