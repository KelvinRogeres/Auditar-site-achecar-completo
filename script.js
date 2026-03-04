const couponButton = document.querySelector("[data-coupon-copy]");
const couponText = document.querySelector("[data-coupon]");
const couponStatus = document.querySelector("#coupon-status");

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

if (couponButton && couponText) {
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
