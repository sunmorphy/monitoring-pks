function showToast(message, type = "danger") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container position-fixed top-0 end-0 p-3";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
  }

  const bgMap = {
    danger: "bg-danger text-white",
    warning: "bg-warning text-dark",
    success: "bg-success text-white",
    info: "bg-primary text-white"
  };

  const bgClass = bgMap[type] || "bg-danger text-white";
  const closeBtnClass = type === "warning" ? "btn-close me-2 m-auto" : "btn-close btn-close-white me-2 m-auto";

  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center ${bgClass} border-0 show shadow-lg mb-2`;
  toastEl.role = "alert";
  toastEl.ariaLive = "assertive";
  toastEl.ariaAtomic = "true";
  toastEl.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  toastEl.style.minWidth = "300px";

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body py-3 px-3">
        <div class="fw-semibold">${message}</div>
      </div>
      <button type="button" class="${closeBtnClass}" aria-label="Close"></button>
    </div>
  `;

  toastEl.querySelector(".btn-close").addEventListener("click", () => {
    toastEl.style.opacity = "0";
    setTimeout(() => toastEl.remove(), 300);
  });

  container.appendChild(toastEl);

  setTimeout(() => {
    toastEl.style.opacity = "0";
    setTimeout(() => toastEl.remove(), 300);
  }, 4500);
}

function redirectWithToast(url, message, type = "danger") {
  sessionStorage.setItem("toast_notice", JSON.stringify({ message, type }));
  window.location.href = url;
}

window.addEventListener("DOMContentLoaded", () => {
  const pendingToast = sessionStorage.getItem("toast_notice");
  if (pendingToast) {
    sessionStorage.removeItem("toast_notice");
    try {
      const parsed = JSON.parse(pendingToast);
      showToast(parsed.message, parsed.type || "danger");
    } catch {
      showToast(pendingToast, "danger");
    }
  }
});
