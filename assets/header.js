"use strict";

class JerryHeader {
  init() {
    this.initAnnouncementBar();
    this.initStickyHeader();
    this.initMobileMenu();
    this.initHeaderSearchToggle();
    this.initHeroRevealOnNavHover();
    this.initDesktopDropdowns();
    this.initAnimatedSearchPlaceholder();
  }

  initAnimatedSearchPlaceholder() {
    const wrapper = document.getElementById("SearchAnimatedPlaceholder");
    const input = document.getElementById("PredictiveSearchInput");

    if (!wrapper || !input) return;

    const phrases = Array.from(wrapper.children);
    if (phrases.length < 2) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    input.setAttribute("placeholder", "");

    const ROTATE_INTERVAL = 2600;
    const LEAVE_DURATION = 350;

    let index = 0;
    let intervalId = null;

    const rotate = () => {
      const current = phrases[index];
      const next = phrases[(index + 1) % phrases.length];

      current.classList.add("is-leaving");
      current.classList.remove("is-active");

      window.setTimeout(() => {
        current.classList.remove("is-leaving");
      }, LEAVE_DURATION);

      next.classList.add("is-active");
      index = (index + 1) % phrases.length;
    };

    const start = () => {
      if (intervalId !== null) return;
      intervalId = window.setInterval(rotate, ROTATE_INTERVAL);
    };

    const stop = () => {
      if (intervalId === null) return;
      window.clearInterval(intervalId);
      intervalId = null;
    };

    start();

    input.addEventListener("focus", stop);
    input.addEventListener("input", () => {
      if (input.value) stop();
    });
    input.addEventListener("blur", () => {
      if (!input.value) start();
    });
  }

  initDesktopDropdowns() {
    const items = document.querySelectorAll(".j-nav-item:has(.j-dropdown)");

    if (!items.length) return;

    items.forEach((item) => {
      const trigger = item.querySelector(".j-nav-link");
      if (!trigger) return;

      const setExpanded = (expanded) => {
        trigger.setAttribute("aria-expanded", String(expanded));
      };

      item.addEventListener("mouseenter", () => setExpanded(true));
      item.addEventListener("mouseleave", () => setExpanded(false));
      item.addEventListener("focusin", () => setExpanded(true));
      item.addEventListener("focusout", (event) => {
        if (!item.contains(event.relatedTarget)) setExpanded(false);
      });

      item.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        setExpanded(false);
        if (item.contains(document.activeElement)) {
          document.activeElement.blur();
        }
      });
    });
  }

  /* Hero Reveal on Nav Hover (homepage only — see header.css/hero.css) */

  initHeroRevealOnNavHover() {
    if (!document.body.classList.contains("j-body--home")) return;

    const header = document.querySelector(".j-site-header-wrapper");
    const nav = document.getElementById("HeaderNav");

    if (!header || !nav) return;
    nav.addEventListener("mouseenter", () => {
      header.classList.add("is-nav-hovering");
    });
    nav.addEventListener("mouseleave", () => {
      header.classList.remove("is-nav-hovering");
    });
  }

  /* Announcement Bar */

  initAnnouncementBar(root = document) {
    const bar = root.querySelector(".j-announcement");

    if (!bar) return;

    const track = bar.querySelector(".j-announcement__track");
    const closeButton = bar.querySelector(".j-announcement__close");

    if (!track) return;
    const PIXELS_PER_SECOND = 70;

    const setMarqueePosition = () => {
      const barWidth = bar.getBoundingClientRect().width;
      const trackWidth = track.getBoundingClientRect().width;
      if (barWidth <= 0 || trackWidth <= 0) return;

      const startX = barWidth;
      const endX = -trackWidth;
      const distance = startX - endX;
      const duration = Math.max(distance / PIXELS_PER_SECOND, 6);

      bar.style.setProperty("--marquee-start", `${startX}px`);
      bar.style.setProperty("--marquee-end", `${endX}px`);
      bar.style.setProperty("--marquee-duration", `${duration}s`);
      bar.setAttribute("data-marquee-ready", "true");
    };

    setMarqueePosition();

    if (typeof ResizeObserver === "function") {
      new ResizeObserver(setMarqueePosition).observe(bar);
    } else {
      let resizeTimer = null;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(setMarqueePosition, 150);
      });
    }

    if (closeButton) {
      closeButton.addEventListener("click", () => {
        bar.remove();
      });
    }

    bar.addEventListener(
      "touchstart",
      () => bar.classList.add("is-touch-paused"),
      { passive: true },
    );
    bar.addEventListener("touchend", () =>
      bar.classList.remove("is-touch-paused"),
    );
    bar.addEventListener("touchcancel", () =>
      bar.classList.remove("is-touch-paused"),
    );
  }

  /* Sticky Header */

  initStickyHeader() {
    const header = document.querySelector(".j-header--sticky");

    if (!header) return;

    const section = header.closest(".shopify-section");

    if (section) {
      const syncOffset = () => {
        const bar = section.querySelector(".j-announcement");
        const height = bar ? bar.getBoundingClientRect().height : 0;
        section.style.setProperty("--announcement-height", `${height}px`);
      };

      syncOffset();

      if (typeof ResizeObserver === "function") {
        new ResizeObserver(syncOffset).observe(section);
      } else {
        window.addEventListener("resize", syncOffset);
      }
    }

    window.addEventListener(
      "scroll",
      () => {
        if (window.pageYOffset > 10) {
          header.classList.add("is-scrolled");
        } else {
          header.classList.remove("is-scrolled");
        }
      },
      { passive: true },
    );
  }

  /* Mobile Menu */

  initMobileMenu() {
    const toggle = document.querySelector(".j-menu-toggle");
    const closeButton = document.querySelector(".j-menu-close");
    const nav = document.getElementById("HeaderNav");
    const overlay = document.querySelector(".j-nav-overlay");

    if (!toggle || !nav || !overlay) return;

    const isMobile = () => window.matchMedia("(max-width: 992px)").matches;

    let lastMenuTrigger = null;

    const getNavFocusable = () =>
      Array.from(
        nav.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);

    const trapNavFocus = (event) => {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getNavFocusable();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const openMenu = () => {
      lastMenuTrigger = document.activeElement;
      nav.classList.add("is-open");
      overlay.classList.add("is-open");
      toggle.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", trapNavFocus);

      if (closeButton) closeButton.focus();
    };

    const closeMenu = () => {
      nav.classList.remove("is-open");
      overlay.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", trapNavFocus);

      nav.querySelectorAll(".j-nav-item.is-open").forEach((item) => {
        item.classList.remove("is-open");
      });

      if (lastMenuTrigger) {
        lastMenuTrigger.focus();
        lastMenuTrigger = null;
      }
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

  /* Header Search Toggle */

  initHeaderSearchToggle() {
    const toggle = document.querySelector(".j-header__search-toggle");
    const searchForm = document.getElementById("HeaderSearchForm");

    if (!toggle || !searchForm) return;

    const closeSearch = () => {
      searchForm.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    };

    toggle.addEventListener("click", () => {
      const isOpen = searchForm.classList.toggle("is-open");

      toggle.setAttribute("aria-expanded", String(isOpen));

      if (isOpen) {
        searchForm.querySelector("input")?.focus();
      }
    });

    searchForm.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSearch();
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
