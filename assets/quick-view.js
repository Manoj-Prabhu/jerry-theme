/* ==========================================================
   Jerry Theme Quick View
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("QuickViewModal");
  const content = document.getElementById("QuickViewContent");
  const overlay = document.querySelector(".j-quick-view-overlay");
  const close = document.querySelector(".j-quick-view-close");

  if (!modal) return;

  function closeModal() {
    modal.classList.remove("is-open");
    content.innerHTML = "";
  }

  if (overlay) {
    overlay.addEventListener("click", closeModal);
  }

  if (close) {
    close.addEventListener("click", closeModal);
  }

  document.querySelectorAll(".j-quick-view-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const handle = button.dataset.handle;

      try {
        const response = await fetch(`/products/${handle}.js`);
        const product = await response.json();

        content.innerHTML = `
        <div class="j-quick-view">

            <div class="j-quick-view__image">
            <img
                src="${product.featured_image}"
                alt="${product.title}"
            >
            </div>

            <div class="j-quick-view__details">

            <h2>${product.title}</h2>

            <p class="j-quick-view__price">
                $${(product.price / 100).toFixed(2)}
            </p>

            <a
                href="/products/${product.handle}"
                class="j-button"
            >
                View Product
            </a>

            </div>

        </div>
        `;

        modal.classList.add("is-open");
      } catch (error) {
        console.error(error);
      }
    });
  });
});
