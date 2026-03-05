async function copyToClipboard(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const temp = document.createElement("textarea");
  temp.value = value;
  temp.setAttribute("readonly", "");
  temp.style.position = "absolute";
  temp.style.left = "-9999px";
  document.body.appendChild(temp);
  temp.select();
  document.execCommand("copy");
  document.body.removeChild(temp);
}

const couponButtons = document.querySelectorAll("[data-coupon-copy]");
if (couponButtons.length) {
  couponButtons.forEach((couponButton) => {
    const scopedCoupon = couponButton
      .closest("section, div, header, main")
      ?.querySelector("[data-coupon]");
    const couponText = scopedCoupon || document.querySelector("[data-coupon]");
    const statusId = couponButton.getAttribute("aria-controls");
    const couponStatus = statusId
      ? document.getElementById(statusId)
      : document.querySelector("#coupon-status");

    if (!couponText) return;

    couponButton.addEventListener("click", async () => {
      try {
        await copyToClipboard(couponText.textContent.trim());
        if (couponStatus) {
          couponStatus.textContent = "Cupom copiado com sucesso.";
        }
      } catch (err) {
        if (couponStatus) {
          couponStatus.textContent = "Nao foi possivel copiar o cupom.";
        }
      }
    });
  });
}

const plateInput = document.querySelector("[data-plate-input]");
if (plateInput) {
  plateInput.addEventListener("input", (event) => {
    const cleaned = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 7);
    event.target.value = cleaned;
  });
}

const statsElements = document.querySelectorAll("[data-stat]");
if (statsElements.length) {
  const statsData = window.ACHECAR_STATS || null;
  statsElements.forEach((stat) => {
    const key = stat.getAttribute("data-key");
    const valueEl = stat.querySelector(".stat-value");
    if (!valueEl) return;

    if (statsData && statsData[key]) {
      valueEl.textContent = statsData[key];
    } else {
      valueEl.textContent = "Atualize";
    }
  });
}

const forms = document.querySelectorAll("form");
forms.forEach((form) => {
  form.addEventListener("submit", () => {
    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.classList.add("is-loading");
      submitBtn.setAttribute("aria-busy", "true");
      if (!submitBtn.dataset.originalText) {
        submitBtn.dataset.originalText = submitBtn.textContent;
      }
      submitBtn.textContent = "Enviando...";
    }
  });
});

const urlParams = new URLSearchParams(window.location.search);
const plateParam = urlParams.get("plate");
if (plateParam) {
  const cleanedPlate = plateParam.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  document.querySelectorAll("[data-plate]").forEach((el) => {
    el.textContent = cleanedPlate || "---";
  });
  document.querySelectorAll("[data-plate-input]").forEach((input) => {
    if (!input.value) input.value = cleanedPlate;
  });
  document.querySelectorAll("[data-plate-link]").forEach((link) => {
    try {
      const url = new URL(link.getAttribute("href"), window.location.href);
      url.searchParams.set("plate", cleanedPlate);
      link.setAttribute("href", url.toString());
    } catch (err) {
      // ignore invalid URLs
    }
  });
}
