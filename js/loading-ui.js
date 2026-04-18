(function () {
  "use strict";

  if (window.bookingcartLoading) return;

  const STYLE_ID = "bookingcart-loading-ui-styles";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .bc-skeleton {
        position: relative;
        overflow: hidden;
        background: linear-gradient(90deg, #ecf2ee 0%, #dfe8e2 50%, #ecf2ee 100%);
        background-size: 240% 100%;
        animation: bcShimmer 1.2s ease-in-out infinite;
      }

      .bc-skeleton::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.26) 50%, transparent 100%);
        transform: translateX(-100%);
      }

      .bc-skeleton-line {
        border-radius: 999px;
      }

      .bc-skeleton-card,
      .bc-skeleton-panel,
      .bc-skeleton-table-row,
      .bc-skeleton-metric {
        border-radius: 24px;
        border: 1px solid rgba(226, 232, 240, 0.9);
        background: #fff;
      }

      .bc-skeleton-table-row {
        border-radius: 18px;
      }

      .bc-skeleton-media {
        border-radius: 20px;
      }

      [aria-busy="true"] {
        cursor: progress;
      }

      [data-loading="true"] {
        pointer-events: none;
      }

      @keyframes bcShimmer {
        0% {
          background-position: 100% 0;
        }
        100% {
          background-position: 0 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .bc-skeleton {
          animation: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function line(width, height, radius) {
    return `<div class="bc-skeleton bc-skeleton-line" style="width:${width};height:${height}px;border-radius:${radius}px"></div>`;
  }

  function block(width, height, radius) {
    return `<div class="bc-skeleton" style="width:${width};height:${height}px;border-radius:${radius}px"></div>`;
  }

  function flightCard() {
    return `
      <div class="bc-skeleton-card" style="padding:24px;">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:18px;">
          ${line("42%", 18, 999)}
          ${block("92px", 26, 999)}
        </div>
        ${block("100%", 150, 22)}
        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:16px;">
          ${[0, 1, 2, 3].map(() => block("100%", 56, 14)).join("")}
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:18px;">
          ${block("170px", 42, 14)}
        </div>
      </div>`;
  }

  function dealCard() {
    return `
      <div class="bc-skeleton-card" style="overflow:hidden;">
        ${block("100%", 176, 0)}
        <div style="padding:20px;">
          <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:14px;">
            ${line("58%", 18, 999)}
            ${line("22%", 18, 999)}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
            ${block("78px", 28, 10)}
            ${block("96px", 28, 10)}
            ${block("66px", 28, 10)}
          </div>
          ${block("100%", 42, 14)}
        </div>
      </div>`;
  }

  function eventCard() {
    return `
      <div class="bc-skeleton-card" style="display:grid;grid-template-columns:160px 1fr;gap:18px;padding:16px;align-items:start;">
        ${block("100%", 160, 16)}
        <div style="padding-top:8px;">
          ${line("72%", 18, 999)}
          <div style="margin-top:12px;">${line("46%", 14, 999)}</div>
          <div style="margin-top:12px;">${line("55%", 14, 999)}</div>
          <div style="margin-top:12px;">${line("38%", 14, 999)}</div>
          <div style="margin-top:16px;">${block("90%", 56, 14)}</div>
        </div>
      </div>`;
  }

  function hotelCard() {
    return `
      <div class="bc-skeleton-card" style="padding:0;overflow:hidden;">
        <div style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:0;">
          ${block("100%", 240, 0)}
          <div style="padding:22px;">
            ${line("66%", 18, 999)}
            <div style="margin-top:12px;">${line("44%", 14, 999)}</div>
            <div style="margin-top:10px;">${line("58%", 14, 999)}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;">
              ${block("76px", 28, 10)}
              ${block("92px", 28, 10)}
              ${block("68px", 28, 10)}
            </div>
            <div style="margin-top:18px;">${block("52%", 16, 8)}</div>
            <div style="margin-top:18px;">${block("100%", 44, 14)}</div>
          </div>
        </div>
      </div>`;
  }

  function bookingCard() {
    return `
      <div class="bc-skeleton-card" style="padding:20px;">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:16px;">
          ${line("38%", 18, 999)}
          ${block("88px", 24, 999)}
        </div>
        ${block("100%", 120, 18)}
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">
          ${block("120px", 38, 14)}
          ${block("120px", 38, 14)}
        </div>
      </div>`;
  }

  function metricCard() {
    return `
      <div class="bc-skeleton-metric" style="padding:20px;min-height:90px;">
        ${line("68%", 12, 999)}
        <div style="margin-top:14px;">${line("42%", 28, 10)}</div>
      </div>`;
  }

  function tableRow(cols) {
    const cells = [];
    for (let i = 0; i < cols; i += 1) {
      const width = i === 0 ? "72%" : i === cols - 1 ? "56%" : `${48 + ((i * 13) % 32)}%`;
      cells.push(`
        <td style="padding:16px 24px;">
          ${line(width, 14, 999)}
        </td>
      `);
    }
    return `<tr class="bc-skeleton-table-row">${cells.join("")}</tr>`;
  }

  function panel(lines = 3) {
    const items = [];
    for (let i = 0; i < lines; i += 1) {
      items.push(`<div style="margin-top:${i === 0 ? 0 : 12}px;">${line(`${80 - i * 12}%`, 14, 999)}</div>`);
    }
    return `
      <div class="bc-skeleton-panel" style="padding:20px;">
        ${line("48%", 18, 999)}
        <div style="margin-top:16px;">${items.join("")}</div>
      </div>`;
  }

  function renderSkeletons(container, kind, count) {
    ensureStyles();
    if (!container) return;
    const mode = kind || "card";
    const total = Number(count || 4);
    const blocks = [];
    for (let i = 0; i < total; i += 1) {
      if (mode === "deal") blocks.push(dealCard());
      else if (mode === "event") blocks.push(eventCard());
      else if (mode === "hotel") blocks.push(hotelCard());
      else if (mode === "booking") blocks.push(bookingCard());
      else if (mode === "metric") blocks.push(metricCard());
      else if (mode === "panel") blocks.push(panel(3));
      else if (mode === "table") blocks.push(tableRow(6));
      else blocks.push(flightCard());
    }
    container.setAttribute("aria-busy", "true");
    container.setAttribute("data-loading", "true");
    container.innerHTML = blocks.join("");
  }

  function renderTableSkeletons(tbody, rows, cols) {
    ensureStyles();
    if (!tbody) return;
    const totalRows = Number(rows || 6);
    const totalCols = Number(cols || 6);
    tbody.setAttribute("aria-busy", "true");
    tbody.setAttribute("data-loading", "true");
    tbody.innerHTML = Array.from({ length: totalRows }, () => tableRow(totalCols)).join("");
  }

  function setBusy(target, busy, label) {
    if (!target) return;
    if (busy) {
      target.setAttribute("aria-busy", "true");
      target.setAttribute("data-loading", "true");
      if (label) target.setAttribute("aria-label", label);
    } else {
      target.removeAttribute("aria-busy");
      target.removeAttribute("data-loading");
      if (label) target.removeAttribute("aria-label");
    }
  }

  window.bookingcartLoading = {
    renderSkeletons,
    renderTableSkeletons,
    setBusy,
    ensureStyles,
  };
})();
