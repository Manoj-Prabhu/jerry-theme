window.JerryFlyToCart = (() => {
  const SHRINK_DURATION_MS = 300;
  const SPIN_DURATION_MS = 550;
  const FLY_DURATION_MS = 500;

  const STAR_SVG = `
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="jFlyStarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f7d774"/>
          <stop offset="100%" stop-color="#b8873a"/>
        </linearGradient>
      </defs>
      <path
        d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 19.771l-7.416 3.642 1.48-8.279L0 9.306l8.332-1.151z"
        fill="url(#jFlyStarGradient)"
        stroke="#8a611f"
        stroke-width="0.5"
      />
    </svg>
  `;

  function ensureStyles() {
    if (document.getElementById("j-fly-to-cart-styles")) return;

    const style = document.createElement("style");
    style.id = "j-fly-to-cart-styles";
    style.textContent = `
      @keyframes jFlyStarGlow {
        0%, 100% {
          filter: drop-shadow(0 4px 10px rgba(184, 135, 58, .5)) drop-shadow(0 0 4px rgba(247, 215, 116, .5));
        }
        50% {
          filter: drop-shadow(0 4px 18px rgba(184, 135, 58, .8)) drop-shadow(0 0 16px rgba(247, 215, 116, .9));
        }
      }
      @keyframes jFlyTwinkle {
        0%, 100% { opacity: 0; transform: scale(.2); }
        50% { opacity: 1; transform: scale(1); }
      }
      @keyframes jFlyTrailFade {
        0% { opacity: .85; transform: scale(1); }
        100% { opacity: 0; transform: scale(.15); }
      }
    `;
    document.head.appendChild(style);
  }

  function addTwinkles(wrapper, centerX, centerY, radius, count) {
    const twinkles = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const distance = radius * (0.75 + Math.random() * 0.5);
      const size = 5 + Math.random() * 5;

      const twinkle = document.createElement("div");
      twinkle.style.position = "absolute";
      twinkle.style.left = `${centerX + Math.cos(angle) * distance - size / 2}px`;
      twinkle.style.top = `${centerY + Math.sin(angle) * distance - size / 2}px`;
      twinkle.style.width = `${size}px`;
      twinkle.style.height = `${size}px`;
      twinkle.style.borderRadius = "50%";
      twinkle.style.background =
        "radial-gradient(circle, #fff7dd 0%, #f7d774 45%, rgba(247, 215, 116, 0) 75%)";
      twinkle.style.opacity = "0";
      twinkle.style.animation = `jFlyTwinkle ${600 + Math.random() * 500}ms ease-in-out ${
        Math.random() * 400
      }ms infinite`;
      wrapper.appendChild(twinkle);
      twinkles.push(twinkle);
    }
    return twinkles;
  }

  function dropTrailSparkle(x, y) {
    const size = 6 + Math.random() * 6;
    const spark = document.createElement("div");
    spark.style.position = "fixed";
    spark.style.left = `${x - size / 2}px`;
    spark.style.top = `${y - size / 2}px`;
    spark.style.width = `${size}px`;
    spark.style.height = `${size}px`;
    spark.style.borderRadius = "50%";
    spark.style.zIndex = "9999";
    spark.style.pointerEvents = "none";
    spark.style.background =
      "radial-gradient(circle, #fff7dd 0%, #f0c14b 50%, rgba(240, 193, 75, 0) 75%)";
    spark.style.animation = "jFlyTrailFade 450ms ease-out forwards";
    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 450);
  }

  function bumpCartIcon() {
    const cartButton = document.querySelector(".j-header__cart");
    if (!cartButton) return;

    cartButton.classList.remove("is-bumping");
    void cartButton.offsetWidth;
    cartButton.classList.add("is-bumping");
    cartButton.addEventListener(
      "animationend",
      () => cartButton.classList.remove("is-bumping"),
      { once: true },
    );
  }

  return function flyToCart(sourceImg) {
    const cartButton = document.querySelector(".j-header__cart");
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!cartButton) return Promise.resolve();

    if (!sourceImg || sourceImg.tagName !== "IMG" || prefersReducedMotion) {
      bumpCartIcon();
      return Promise.resolve();
    }

    const startRect = sourceImg.getBoundingClientRect();
    if (startRect.width === 0 || startRect.height === 0) {
      bumpCartIcon();
      return Promise.resolve();
    }

    ensureStyles();

    const endRect = cartButton.getBoundingClientRect();
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = `${startRect.left}px`;
    wrapper.style.top = `${startRect.top}px`;
    wrapper.style.width = `${startRect.width}px`;
    wrapper.style.height = `${startRect.height}px`;
    wrapper.style.zIndex = "10000";
    wrapper.style.pointerEvents = "none";
    wrapper.style.perspective = "500px";
    wrapper.style.transformOrigin = "center center";
    wrapper.style.transition = `transform ${SHRINK_DURATION_MS}ms ease`;
    wrapper.setAttribute("aria-hidden", "true");

    const starSize = Math.min(
      Math.max(Math.min(startRect.width, startRect.height) * 0.4, 40),
      90,
    );

    const star = document.createElement("div");
    star.innerHTML = STAR_SVG;
    star.style.position = "absolute";
    star.style.top = "50%";
    star.style.left = "50%";
    star.style.width = `${starSize}px`;
    star.style.height = `${starSize}px`;
    star.style.marginLeft = `${-starSize / 2}px`;
    star.style.marginTop = `${-starSize / 2}px`;
    star.style.transformOrigin = "center center";
    star.style.transformStyle = "preserve-3d";
    star.style.transition = `transform ${SHRINK_DURATION_MS}ms ease`;
    star.style.animation = "jFlyStarGlow 700ms ease-in-out infinite";

    wrapper.appendChild(star);
    const twinkles = addTwinkles(
      wrapper,
      startRect.width / 2,
      startRect.height / 2,
      starSize * 0.7,
      6,
    );
    document.body.appendChild(wrapper);

    const starEndScale = Math.min(
      Math.max(
        (Math.min(endRect.width, endRect.height) * 0.9) / starSize,
        0.35,
      ),
      1,
    );

    const startCenterX = startRect.left + startRect.width / 2;
    const startCenterY = startRect.top + startRect.height / 2;
    const endCenterX = endRect.left + endRect.width / 2;
    const endCenterY = endRect.top + endRect.height / 2;
    const translateX = endCenterX - startCenterX;
    const translateY = endCenterY - startCenterY;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        star.style.transform = `scale(${starEndScale}) rotateY(360deg)`;
      });
    });

    setTimeout(() => {
      star.style.transition = `transform ${SPIN_DURATION_MS}ms linear`;
      star.style.transform = `scale(${starEndScale}) rotateY(1080deg)`;
    }, SHRINK_DURATION_MS);

    let trailIntervalId = null;

    setTimeout(() => {
      wrapper.style.transition = `transform ${FLY_DURATION_MS}ms cubic-bezier(0.5, -0.2, 0.7, 0.4), opacity ${FLY_DURATION_MS}ms ease`;
      wrapper.style.transform = `translate(${translateX}px, ${translateY}px)`;
      wrapper.style.opacity = "0.3";
      star.style.transition = `transform ${FLY_DURATION_MS}ms linear`;
      star.style.transform = `scale(${starEndScale}) rotateY(1440deg)`;
      twinkles.forEach((twinkle) => {
        twinkle.style.animation = "none";
        twinkle.style.opacity = "0";
      });

      trailIntervalId = setInterval(() => {
        const starRect = star.getBoundingClientRect();
        dropTrailSparkle(
          starRect.left + starRect.width / 2,
          starRect.top + starRect.height / 2,
        );
      }, 45);
    }, SHRINK_DURATION_MS + SPIN_DURATION_MS);

    return new Promise((resolve) => {
      setTimeout(
        () => {
          if (trailIntervalId) clearInterval(trailIntervalId);
          wrapper.remove();
          bumpCartIcon();
          resolve();
        },
        SHRINK_DURATION_MS + SPIN_DURATION_MS + FLY_DURATION_MS,
      );
    });
  };
})();
