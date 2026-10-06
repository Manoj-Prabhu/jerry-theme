function initShopByCategoryLoop(grid) {
  if (grid.dataset.loopInitialized) return;
  grid.dataset.loopInitialized = "true";

  const originalCards = Array.from(grid.children);
  if (originalCards.length < 2) return;

  function cloneSet() {
    return originalCards.map((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("tabindex", "-1");
      return clone;
    });
  }

  const setWidth = grid.scrollWidth;

  cloneSet()
    .reverse()
    .forEach((clone) => grid.insertBefore(clone, grid.firstChild));
  cloneSet().forEach((clone) => grid.appendChild(clone));
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

const AUTO_SCROLL_SPEED = 85;

function initShopByCategoryAutoScroll(grid) {
  if (grid.dataset.autoScrollInitialized) return;
  grid.dataset.autoScrollInitialized = "true";

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
    resumeTicking();
  });
  grid.addEventListener("pointerdown", () => {
    isPointerActive = true;
  });
  window.addEventListener("pointerup", () => {
    isPointerActive = false;
    resumeTicking();
  });
  window.addEventListener("pointercancel", () => {
    isPointerActive = false;
    resumeTicking();
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
      currentSpeed *= 0.85;
    } else {
      currentSpeed += (AUTO_SCROLL_SPEED - currentSpeed) * 0.03;
    }

    const isMoving = Math.abs(currentSpeed) > 0.01;
    grid.classList.toggle("is-autoplay-moving", isMoving);

    if (isMoving) {
      grid.scrollLeft += currentSpeed * dt;
    } else if (paused) {
      currentSpeed = 0;
      stopTicking();
    }
  }

  function startTicking() {
    if (rafId !== null) return;
    lastTimestamp = null;
    rafId = requestAnimationFrame(tick);
  }

  function resumeTicking() {
    if (isInView && pageLoaded) startTicking();
  }

  function stopTicking() {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  let isInView = false;
  let pageLoaded = document.readyState === "complete";

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isInView = entry.isIntersecting;
        if (isInView && pageLoaded) {
          startTicking();
        } else if (!isInView) {
          stopTicking();
        }
      });
    },
    { threshold: 0 },
  );
  visibilityObserver.observe(grid);

  if (!pageLoaded) {
    window.addEventListener(
      "load",
      () => {
        pageLoaded = true;
        if (isInView) startTicking();
      },
      { once: true },
    );
  }
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

const CARD_MIN_SCALE = 0.82;
const CARD_MAX_SCALE = 1.15;
const CARD_MAX_ROTATE_DEG = 32;
const cardGeometryCache = new WeakMap();

function measureCardGeometry(grid) {
  const cards = Array.from(grid.querySelectorAll(".j-category-card"));
  const gridWidth = grid.clientWidth;
  if (!cards.length || gridWidth <= 0) return null;
  const gridOffset = cards[0].offsetParent === grid ? 0 : grid.offsetLeft;
  const geometry = {
    gridWidth,
    cards: cards.map((card) => ({
      card,
      center: card.offsetLeft - gridOffset + card.offsetWidth / 2,
      scale: null,
      rotate: null,
      zIndex: null,
    })),
  };
  cardGeometryCache.set(grid, geometry);
  return geometry;
}

function invalidateCardGeometry(grid) {
  cardGeometryCache.delete(grid);
}

function updateCardScales(grid, focusX) {
  const geometry = cardGeometryCache.get(grid) || measureCardGeometry(grid);
  if (!geometry) return;

  const focusOffset =
    focusX == null
      ? geometry.gridWidth / 2
      : focusX - grid.getBoundingClientRect().left;
  const center = grid.scrollLeft + focusOffset;
  const maxDistance = geometry.gridWidth / 2;

  geometry.cards.forEach((entry) => {
    const offset = entry.center - center;
    const distance = Math.abs(offset);
    const proximity = Math.max(0, 1 - distance / maxDistance);
    const scale = (
      CARD_MIN_SCALE +
      proximity * (CARD_MAX_SCALE - CARD_MIN_SCALE)
    ).toFixed(2);
    const rotate = Math.round(
      -Math.sign(offset) * (1 - proximity) * CARD_MAX_ROTATE_DEG,
    );
    const zIndex = Math.round(proximity * 10);
    if (scale !== entry.scale) {
      entry.card.style.setProperty("--card-scale", scale);
      entry.scale = scale;
    }
    if (rotate !== entry.rotate) {
      entry.card.style.setProperty("--card-rotate", `${rotate}deg`);
      entry.rotate = rotate;
    }
    if (zIndex !== entry.zIndex) {
      entry.card.style.zIndex = zIndex;
      entry.zIndex = zIndex;
    }
  });
}

function initShopByCategoryScale(grid) {
  if (grid.dataset.scaleInitialized) return;
  grid.dataset.scaleInitialized = "true";

  let ticking = false;
  let lastUpdateTime = 0;
  const MIN_UPDATE_INTERVAL_MS = window.matchMedia("(pointer: coarse)").matches
    ? 100
    : 40;
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

  const remeasure = () => {
    invalidateCardGeometry(grid);
    lastUpdateTime = 0;
    scheduleUpdate();
  };

  grid.addEventListener("scroll", () => scheduleUpdate(), { passive: true });
  window.addEventListener("resize", remeasure);
  if (document.readyState !== "complete") {
    window.addEventListener("load", remeasure, { once: true });
  }

  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    grid.addEventListener("mousemove", (event) => {
      if (grid.classList.contains("is-dragging")) return;
      scheduleUpdate(event.clientX);
    });
    grid.addEventListener("mouseleave", () => scheduleUpdate());
  }
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

function initShopByCategoryDrag(grid) {
  if (grid.dataset.dragInitialized) return;
  grid.dataset.dragInitialized = "true";

  let isPointerDown = false;
  let isDragging = false;
  let startX = 0;
  let startScrollLeft = 0;

  const DRAG_THRESHOLD = 6;
  grid.addEventListener("dragstart", (event) => event.preventDefault());
  grid.addEventListener("pointerdown", (event) => {
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
      const suppressClick = (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
      };
      grid.addEventListener("click", suppressClick, {
        capture: true,
        once: true,
      });
      setTimeout(
        () =>
          grid.removeEventListener("click", suppressClick, { capture: true }),
        0,
      );

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

document.addEventListener("shopify:section:load", (event) => {
  event.target
    .querySelectorAll(".j-shop-by-category__grid")
    .forEach(initShopByCategoryDrag);
});
