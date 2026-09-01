"use strict";

class JerryHeader {
  init() {
    this.initAnnouncementBar();
    this.initStickyHeader();
    this.initMobileMenu();
    this.initHeaderSearchToggle();
    this.initHeroRevealOnNavHover();
    this.initDesktopDropdowns();
  }

  /* Desktop Dropdown/Mega Menu — keyboard support

     The dropdown itself opens/closes via pure CSS (:hover/:focus-within
     in header.css), which already lets a keyboard user Tab into it. This
     just layers on the two things CSS alone can't do: keep
     aria-expanded in sync for screen readers, and let Escape close an
     open dropdown. :focus-within is true as long as focus is ANYWHERE
     inside .j-nav-item — including the trigger link itself — so
     re-focusing the trigger on Escape wouldn't actually close it; only
     blurring (moving focus out of the item entirely) does. */

  initDesktopDropdowns() {
    const items = document.querySelectorAll(
      ".j-nav-item:has(.j-dropdown)",
    );

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
        // Blur (not re-focus the trigger) — :focus-within stays true, and
        // the dropdown stays open, for as long as focus is anywhere
        // inside .j-nav-item, including the trigger itself.
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

    // Delegated to the whole nav (not each individual link) so moving
    // between adjacent links doesn't flicker the effect off and back on
    // — it only toggles when the cursor actually enters/leaves the nav
    // as a whole.
    nav.addEventListener("mouseenter", () => {
      header.classList.add("is-nav-hovering");
    });
    nav.addEventListener("mouseleave", () => {
      header.classList.remove("is-nav-hovering");
    });
  }

  /* Announcement Bar — continuous scrolling ticker. The scroll itself is
     a pure CSS animation (see .j-announcement__track in header.css) that
     travels from just past the bar's right edge to just past its left
     edge — this measures the bar's and track's actual rendered widths to
     express those two edges as real pixel offsets (a fixed percentage
     can't express "just off-screen" for content of unknown length), and
     turns the total travel distance into a duration so the scroll speed
     (px/second) — not the loop duration — stays visually consistent
     regardless of how much announcement text there is. */

  initAnnouncementBar(root = document) {
    const bar = root.querySelector(".j-announcement");

    if (!bar) return;

    const track = bar.querySelector(".j-announcement__track");
    const closeButton = bar.querySelector(".j-announcement__close");

    if (!track) return;

    // Roughly how many pixels of ticker scroll past per second — higher
    // is faster. Kept as a constant rather than a merchant setting since
    // it needs to combine with the measured distance below to produce a
    // sensible duration; exposing it as a raw "speed" setting alone
    // (the old fade-cycle's rotation_speed) wouldn't account for that.
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

    // Re-measures on resize/font-load-driven reflow — stale start/end
    // offsets computed at a different viewport width would either clip
    // the entrance/exit or leave an oddly long gap.
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

    // Touch equivalent of the desktop :hover pause (see .j-announcement
    // :hover in header.css) — CSS :hover alone can't do this on touch,
    // since a tap leaves :hover "stuck" applied with no matching
    // mouseleave to clear it once the finger lifts. This pauses on
    // touchstart and explicitly resumes on touchend/touchcancel instead.
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

    let lastScroll = 0;

    window.addEventListener(
      "scroll",
      () => {
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
