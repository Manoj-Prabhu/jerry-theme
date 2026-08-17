// Infinite loop — clones the full set of cards once before and once
// after the real set, then silently snaps scrollLeft back by exactly one
// set's width whenever the visitor scrolls (via drag, touch, trackpad, or
// scroll-snap settling) far enough into a cloned set that it's about to
// run out. Because the clone is pixel-identical to the real set it just
// jumped past, the snap is invisible — it reads as an endless row rather
// than a scroll that stops at the last category. Runs first in this file
// (and so first on DOMContentLoaded, ahead of the coverflow/drag
// listeners below) so the clones already exist in the DOM by the time
// those measure the grid.
function initShopByCategoryLoop(grid) {
  if (grid.dataset.loopInitialized) return;
  grid.dataset.loopInitialized = "true";

  const originalCards = Array.from(grid.children);
  // Looping only makes sense with more than one card — and cloning a
  // single card would just make it look duplicated, not endless.
  if (originalCards.length < 2) return;

  function cloneSet() {
    return originalCards.map((card) => {
      const clone = card.cloneNode(true);
      // Duplicates exist purely for the visual wrap-around — hiding them
      // from assistive tech and tab order keeps keyboard/screen reader
      // navigation limited to the one real copy of each category.
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("tabindex", "-1");
      return clone;
    });
  }

  // Read this BEFORE inserting the clones below, while the grid still
  // only contains the original set — scrollWidth at that point already
  // equals exactly one set's width, with no division needed. Reading it
  // afterward (dividing by 3) would force the browser to synchronously
  // lay out the two freshly-inserted clone sets just to answer this one
  // query, which is the "Forced reflow" Lighthouse flagged here.
  const setWidth = grid.scrollWidth;

  cloneSet()
    .reverse()
    .forEach((clone) => grid.insertBefore(clone, grid.firstChild));
  cloneSet().forEach((clone) => grid.appendChild(clone));

  // Starts the visitor inside the middle (real) set, at the same
  // position the row would have opened at before looping existed — no
  // visible difference on first paint.
  grid.scrollLeft = setWidth;

  grid.addEventListener(
    "scroll",
    () => {
      if (grid.scrollLeft < setWidth * 0.5) {
        grid.scrollLeft += setWidth;
      } else if (grid.scrollLeft > setWidth * 1.5) {
        grid.scrollLeft -= setWidth;
      }
    },
    { passive: true },
  );
}

function initAllShopByCategoryLoop() {
  document
    .querySelectorAll(".j-shop-by-category__grid")
    .forEach(initShopByCategoryLoop);
}

document.addEventListener("DOMContentLoaded", initAllShopByCategoryLoop);

document.addEventListener("shopify:section:load", (event) => {
  event.target
    .querySelectorAll(".j-shop-by-category__grid")
    .forEach(initShopByCategoryLoop);
});

// Continuous auto-scroll — the row drifts on its own by default (using
// the infinite loop above, so it never hits a hard stop), pausing the
// instant the cursor hovers any card and easing back up to speed instead
// of snapping to full speed the instant the cursor leaves. Runs after
// the loop init above (registered second, so it fires second on
// DOMContentLoaded) since it needs the clones and the starting
// scrollLeft already in place before it starts nudging that value.
const AUTO_SCROLL_SPEED = 28; // px/second at full speed

function initShopByCategoryAutoScroll(grid) {
  if (grid.dataset.autoScrollInitialized) return;
  grid.dataset.autoScrollInitialized = "true";

  // Respects the same "no unprompted motion" preference the hero
  // slideshow already honors elsewhere in this theme — autoplay never
  // starts for visitors who've asked their OS to minimize motion. Manual
  // drag/scroll/loop still work fine without it.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let isHovering = false;
  let isPointerActive = false;
  let currentSpeed = 0;
  let lastTimestamp = null;
  let rafId = null;

  grid.addEventListener("mouseenter", () => {
    isHovering = true;
  });
  grid.addEventListener("mouseleave", () => {
    isHovering = false;
  });
  grid.addEventListener("pointerdown", () => {
    isPointerActive = true;
  });
  window.addEventListener("pointerup", () => {
    isPointerActive = false;
  });
  window.addEventListener("pointercancel", () => {
    isPointerActive = false;
  });

  function tick(timestamp) {
    rafId = requestAnimationFrame(tick);

    if (lastTimestamp === null) {
      lastTimestamp = timestamp;
      return;
    }

    const dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    const paused =
      isHovering || isPointerActive || grid.classList.contains("is-dragging");

    if (paused) {
      // Eases down quickly rather than freezing mid-frame — a smooth
      // stop instead of an abrupt one, without being slow enough to feel
      // laggy in response to the hover.
      currentSpeed *= 0.85;
    } else {
      // Eases up gradually toward full speed instead of resuming at full
      // speed instantly — this is the "loop smoothly slowly" resume the
      // hover-off should feel like.
      currentSpeed += (AUTO_SCROLL_SPEED - currentSpeed) * 0.03;
    }

    const isMoving = Math.abs(currentSpeed) > 0.01;
    // scroll-snap (even proximity) can hold scrollLeft still against
    // increments this small, netting zero visible movement — suspending
    // it only while actually driving the scroll keeps snapping intact
    // for manual drags/swipes.
    grid.classList.toggle("is-autoplay-moving", isMoving);

    if (isMoving) {
      grid.scrollLeft += currentSpeed * dt;
    }
  }

  function startTicking() {
    if (rafId !== null) return;
    lastTimestamp = null;
    rafId = requestAnimationFrame(tick);
  }

  function stopTicking() {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  // This row sits below the hero, off-screen at page load on most
  // viewports — running the tick loop from load onward burned main-thread
  // time (and triggered layout on every frame via the scrollLeft write)
  // animating a section nobody could see yet. Gating it to only run while
  // actually in view removes that load-time cost with no visible
  // difference for real visitors, since it was never seen moving before
  // it scrolled into view anyway.
  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startTicking();
        } else {
          stopTicking();
        }
      });
    },
    { threshold: 0 },
  );
  visibilityObserver.observe(grid);
}

function initAllShopByCategoryAutoScroll() {
  document
    .querySelectorAll(".j-shop-by-category__grid")
    .forEach(initShopByCategoryAutoScroll);
}

document.addEventListener("DOMContentLoaded", initAllShopByCategoryAutoScroll);

document.addEventListener("shopify:section:load", (event) => {
  event.target
    .querySelectorAll(".j-shop-by-category__grid")
    .forEach(initShopByCategoryAutoScroll);
});

// Coverflow-style "in focus" effect — whichever card sits nearest the
// focus point scales up and sits flat, while cards further to either side
// scale down and tilt away in 3D (like fanned-out pages), tapering
// smoothly back to flat/full-size as a card approaches the focus point.
//
// The focus point is the row's horizontal center while scrolling/settled
// (recomputed on every "scroll" event, so it responds to drag scrolling,
// native touch/trackpad scrolling, and scroll-snap settling alike — all
// three fire the same event, no separate wiring needed per input
// method) — but while the mouse is hovering the row without scrolling it
// (e.g. just moving the cursor down from the header into this section),
// the focus point instead follows the cursor's x position, so the effect
// still responds to something even when there's no scroll happening.
const CARD_MIN_SCALE = 0.82;
const CARD_MAX_SCALE = 1.15;
const CARD_MAX_ROTATE_DEG = 32;

function updateCardScales(grid, focusX) {
  const cards = grid.querySelectorAll(".j-category-card");
  if (!cards.length) return;

  const gridRect = grid.getBoundingClientRect();
  const center = focusX ?? gridRect.left + gridRect.width / 2;
  // Half the row's width is the natural falloff distance — a card
  // centered at the row's edge is as far from focus as this effect goes.
  const maxDistance = gridRect.width / 2;

  // Read phase — measure every card's position before writing any
  // styles. Reading a card's rect right after writing a previous card's
  // style (the old shape of this loop) forces the browser to
  // synchronously recompute layout on every iteration, since the write
  // invalidates the geometry the next read needs — that's the "Forced
  // reflow" Lighthouse flags. Batching all the reads first, then all the
  // writes, means no read in this function ever follows a write.
  const measurements = Array.from(cards, (card) => {
    const cardRect = card.getBoundingClientRect();
    return { card, cardCenter: cardRect.left + cardRect.width / 2 };
  });

  // Write phase — no geometry reads below this point.
  measurements.forEach(({ card, cardCenter }) => {
    const offset = cardCenter - center;
    const distance = Math.abs(offset);
    const proximity = Math.max(0, 1 - distance / maxDistance);
    const scale = CARD_MIN_SCALE + proximity * (CARD_MAX_SCALE - CARD_MIN_SCALE);
    // Opposite sign of proximity's falloff — 0deg at dead center, ramping
    // up to the max tilt the further a card sits to either side. Cards
    // left of center tilt one way, cards right of center tilt the other,
    // like pages fanned open around the focused one.
    const rotate = -Math.sign(offset) * (1 - proximity) * CARD_MAX_ROTATE_DEG;

    card.style.setProperty("--card-scale", scale.toFixed(3));
    card.style.setProperty("--card-rotate", `${rotate.toFixed(2)}deg`);
    // Keeps the focused (scaled-up) card visually on top of its
    // neighbors instead of the later-in-DOM card always winning.
    card.style.zIndex = Math.round(proximity * 10);
  });
}

function initShopByCategoryScale(grid) {
  if (grid.dataset.scaleInitialized) return;
  grid.dataset.scaleInitialized = "true";

  let ticking = false;
  let lastUpdateTime = 0;
  // Continuous auto-scroll (see initShopByCategoryAutoScroll above) fires
  // a native "scroll" event on nearly every animation frame, which drove
  // this at the same ~60fps rate for as long as the row kept drifting —
  // a coverflow scale/rotate effect doesn't need that much precision to
  // read as smooth, and this measures every card's position via
  // getBoundingClientRect() on every update, so capping it well below
  // 60fps meaningfully cuts the layout-read cost this was accumulating
  // continuously in the background.
  const MIN_UPDATE_INTERVAL_MS = 40; // ~25fps ceiling
  const scheduleUpdate = (focusX) => {
    if (ticking) return;
    if (performance.now() - lastUpdateTime < MIN_UPDATE_INTERVAL_MS) return;
    ticking = true;
    requestAnimationFrame(() => {
      lastUpdateTime = performance.now();
      updateCardScales(grid, focusX);
      ticking = false;
    });
  };

  grid.addEventListener("scroll", () => scheduleUpdate(), { passive: true });
  window.addEventListener("resize", () => scheduleUpdate());

  // Mouse-hover follows the cursor instead of the scroll position — a
  // fine/hover-capable pointer only, so this doesn't fight the
  // drag-to-scroll gesture (dragging already updates via the "scroll"
  // listener above once it moves grid.scrollLeft) or misfire from a
  // touch tap, which reports as a pointer event too but has no
  // meaningful "hover" concept.
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    grid.addEventListener("mousemove", (event) => {
      if (grid.classList.contains("is-dragging")) return;
      scheduleUpdate(event.clientX);
    });

    // Falls back to the scroll-based centered state once the cursor
    // leaves, rather than leaving cards frozen wherever the mouse last
    // pointed.
    grid.addEventListener("mouseleave", () => scheduleUpdate());
  }

  // Runs once up front so cards start in their correct scaled state
  // (the initially-centered/first card focused) instead of all sitting
  // at the default scale until the first scroll happens.
  scheduleUpdate();
}

function initAllShopByCategoryScale() {
  document
    .querySelectorAll(".j-shop-by-category__grid")
    .forEach(initShopByCategoryScale);
}

document.addEventListener("DOMContentLoaded", initAllShopByCategoryScale);

document.addEventListener("shopify:section:load", (event) => {
  event.target
    .querySelectorAll(".j-shop-by-category__grid")
    .forEach(initShopByCategoryScale);
});

// Native overflow-x: auto already gives touch/trackpad users swipe
// scrolling for free — this only adds click-and-drag support for mouse
// users, who have no built-in way to drag a horizontal scroll container.
function initShopByCategoryDrag(grid) {
  if (grid.dataset.dragInitialized) return;
  grid.dataset.dragInitialized = "true";

  let isPointerDown = false;
  let isDragging = false;
  let startX = 0;
  let startScrollLeft = 0;

  // Distinguishes an intentional drag from a click that happens to have a
  // pixel or two of jitter — below this, the card's link should still
  // navigate normally on release.
  const DRAG_THRESHOLD = 6;

  // Belt-and-suspenders alongside the cards' draggable="false" attribute
  // (see shop-by-category.liquid) — a browser's native "drag this link"
  // gesture can otherwise capture the pointer before pointermove ever
  // reports movement, silently defeating the custom drag below.
  grid.addEventListener("dragstart", (event) => event.preventDefault());

  grid.addEventListener("pointerdown", (event) => {
    // Only the primary mouse button drags — touch/pen already scroll
    // natively via overflow-x, and dragging with those too would fight
    // the browser's own gesture handling.
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    isPointerDown = true;
    isDragging = false;
    startX = event.clientX;
    startScrollLeft = grid.scrollLeft;
  });

  grid.addEventListener("pointermove", (event) => {
    if (!isPointerDown) return;

    const delta = event.clientX - startX;

    if (!isDragging && Math.abs(delta) > DRAG_THRESHOLD) {
      isDragging = true;
      grid.classList.add("is-dragging");
      grid.setPointerCapture(event.pointerId);
    }

    if (!isDragging) return;

    event.preventDefault();
    grid.scrollLeft = startScrollLeft - delta;
  });

  function endDrag(event) {
    if (isDragging) {
      // Suppresses the click that would otherwise fire on release —
      // without this, ending a drag on top of a category card would
      // navigate to it even though the visitor was just scrolling.
      const suppressClick = (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
      };
      grid.addEventListener("click", suppressClick, { capture: true, once: true });
      setTimeout(() => grid.removeEventListener("click", suppressClick, { capture: true }), 0);

      if (event && grid.hasPointerCapture(event.pointerId)) {
        grid.releasePointerCapture(event.pointerId);
      }
    }

    isPointerDown = false;
    isDragging = false;
    grid.classList.remove("is-dragging");
  }

  grid.addEventListener("pointerup", endDrag);
  grid.addEventListener("pointercancel", endDrag);
  grid.addEventListener("pointerleave", (event) => {
    if (isPointerDown) endDrag(event);
  });
}

function initAllShopByCategoryDrag() {
  document
    .querySelectorAll(".j-shop-by-category__grid")
    .forEach(initShopByCategoryDrag);
}

document.addEventListener("DOMContentLoaded", initAllShopByCategoryDrag);

// The theme editor replaces a section's markup wholesale on block
// add/remove/reorder, leaving fresh elements with no listeners attached.
document.addEventListener("shopify:section:load", (event) => {
  event.target
    .querySelectorAll(".j-shop-by-category__grid")
    .forEach(initShopByCategoryDrag);
});
