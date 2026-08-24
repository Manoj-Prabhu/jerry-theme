document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".j-product__recipient").forEach((root) => {
    const checkbox = root.querySelector(".j-product__recipient-checkbox");
    const fields = root.querySelector(".j-product__recipient-fields");
    const offsetInput = root.querySelector(".j-product__recipient-offset");

    if (!checkbox || !fields) return;

    function sync(open) {
      fields.hidden = !open;

      fields.querySelectorAll("input, textarea").forEach((field) => {
        field.disabled = !open;
      });

      if (offsetInput) {
        offsetInput.value = open ? String(new Date().getTimezoneOffset()) : "";
      }
    }

    checkbox.addEventListener("change", () => sync(checkbox.checked));

    sync(checkbox.checked);
  });
});
