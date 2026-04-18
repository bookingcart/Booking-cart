(function () {
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function flagEmojiFromIso2(iso2) {
    const code = String(iso2 || "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) return "";
    const A = 0x1f1e6;
    const first = code.charCodeAt(0) - 65;
    const second = code.charCodeAt(1) - 65;
    return String.fromCodePoint(A + first, A + second);
  }

  function toOptionLabel(iso2, name) {
    const flag = flagEmojiFromIso2(iso2);
    return flag ? `${flag} ${name}` : name;
  }

  async function apiOnce(path, payload) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    });
    const text = await res.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    return { ok: res.ok, status: res.status, parsed, text, path };
  }

  async function apiWithFallback(paths, payload) {
    let last = null;
    for (const p of paths) {
      try {
        const attempt = await apiOnce(p, payload);
        last = attempt;
        if (attempt.ok) return attempt.parsed;
        // If it isn't a 404, stop early because it's a "real" upstream error
        if (attempt.status && attempt.status !== 404) break;
      } catch (e) {
        last = { ok: false, status: 0, parsed: null, text: String(e && e.message ? e.message : e), path: p };
      }
    }

    if (last && last.parsed && last.parsed.error) {
      throw new Error(last.parsed.error);
    }

    if (last && last.status === 404) {
      throw new Error(
        "Visa API endpoint not found (404). Open the site via http://localhost:3000/visa.html (not file://) and restart your server after changes."
      );
    }

    throw new Error(last ? `Request failed (${last.status || "unknown"})` : "Request failed");
  }

  function renderResult(el, state) {
    if (!el) return;

    if (state.loading) {
      el.style.display = "block";
      el.innerHTML = `<div class="muted">Loading visa rules…</div>`;
      return;
    }

    if (state.error) {
      el.style.display = "block";
      el.innerHTML = `<div class="muted" style="color:#b91c1c;font-weight:800">${escapeHtml(state.error)}</div>`;
      return;
    }

    const data = state.data && state.data.data ? state.data.data : null;
    if (!data || !data.data) {
      el.style.display = "block";
      el.innerHTML = `<div class="muted">No data returned.</div>`;
      return;
    }

    const d = data.data;
    const passport = d.passport || {};
    const dest = d.destination || {};
    const mr = d.mandatory_registration || null;
    const vr = d.visa_rules || {};
    const primary = vr.primary_rule || {};
    const secondary = vr.secondary_rule || null;
    const exception = vr.exception_rule || null;

    const primaryLine = [primary.name, primary.duration].filter(Boolean).join(" — ");
    const secondaryLine = secondary ? [secondary.name, secondary.duration].filter(Boolean).join(" — ") : "";

    el.style.display = "block";
    el.innerHTML = `
      <div class="card" style="box-shadow:none;border:1px solid var(--border);background:#fff">
        <div class="card__body">
          <div class="row" style="justify-content:space-between;gap:12px;flex-wrap:wrap">
            <div>
              <div class="kpi" style="font-size:16px">${escapeHtml(passport.name || "Passport")} → ${escapeHtml(dest.name || "Destination")}</div>
              <div class="muted" style="margin-top:6px">Tourist entry rule</div>
            </div>
            <div class="pill" style="padding:8px 12px;font-size:12px">${escapeHtml(primary.name || "")}</div>
          </div>

          <div class="hr"></div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
            <div>
              <div class="muted" style="font-weight:800">Primary rule</div>
              <div style="margin-top:4px">${escapeHtml(primaryLine || "—")}</div>
            </div>
            ${secondary ? `
              <div>
                <div class="muted" style="font-weight:800">Secondary rule</div>
                <div style="margin-top:4px">${escapeHtml(secondaryLine || "—")}</div>
                ${secondary.link ? `<a href="${escapeHtml(secondary.link)}" target="_blank" rel="noopener" class="muted" style="display:inline-block;margin-top:6px;font-weight:800">Open eVisa / official link</a>` : ""}
              </div>
            ` : ""}
            <div>
              <div class="muted" style="font-weight:800">Passport validity</div>
              <div style="margin-top:4px">${escapeHtml(dest.passport_validity || "—")}</div>
            </div>
            <div>
              <div class="muted" style="font-weight:800">Embassy</div>
              <div style="margin-top:4px">${dest.embassy_url ? `<a href="${escapeHtml(dest.embassy_url)}" target="_blank" rel="noopener" class="muted" style="font-weight:800">View embassy info</a>` : "—"}</div>
            </div>
          </div>

          ${mr ? `
            <div class="hr"></div>
            <div style="background:rgba(250, 204, 21, .15);border:1px solid rgba(250, 204, 21, .35);padding:10px 12px;border-radius:10px">
              <div class="muted" style="font-weight:900">Mandatory registration: ${escapeHtml(mr.name || "")}</div>
              ${mr.link ? `<a href="${escapeHtml(mr.link)}" target="_blank" rel="noopener" class="muted" style="display:inline-block;margin-top:6px;font-weight:800">Open registration link</a>` : ""}
            </div>
          ` : ""}

          ${exception ? `
            <div class="hr"></div>
            <div style="background:rgba(59,130,246,.10);border:1px solid rgba(59,130,246,.25);padding:10px 12px;border-radius:10px">
              <div class="muted" style="font-weight:900">Exception</div>
              <div style="margin-top:6px">${escapeHtml(exception.full_text || exception.name || "")}</div>
              ${exception.link ? `<a href="${escapeHtml(exception.link)}" target="_blank" rel="noopener" class="muted" style="display:inline-block;margin-top:6px;font-weight:800">Source</a>` : ""}
            </div>
          ` : ""}

          <div class="muted" style="margin-top:12px;font-size:12px">Always confirm with the embassy/airline before travel. Data provided by Travel Buddy.</div>
        </div>
      </div>
    `;
  }

  function init() {
    const form = qs('[data-travelbuddy-visa-form]');
    const out = qs('[data-travelbuddy-visa-result]');
    if (!form || !out) return;

    const passportSel = qs('select[name="passport"]', form);
    const destSel = qs('select[name="destination"]', form);
    if (!passportSel || !destSel) return;

    // Populate dropdowns using ISO2_TO_COUNTRY from visa-dataset.js
    if (typeof ISO2_TO_COUNTRY === 'undefined') {
      renderResult(out, { error: 'Visa Tool is not ready (missing ISO2_TO_COUNTRY dataset).' });
      return;
    }

    const entries = Object.entries(ISO2_TO_COUNTRY)
      .map(([code, name]) => ({ code, name }))
      .filter((x) => /^[A-Z]{2}$/.test(x.code))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const { code, name } of entries) {
      const opt1 = document.createElement('option');
      opt1.value = code;
      opt1.textContent = toOptionLabel(code, name);
      passportSel.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = code;
      opt2.textContent = toOptionLabel(code, name);
      destSel.appendChild(opt2);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const passport = String(passportSel.value || '').trim().toUpperCase();
      const destination = String(destSel.value || '').trim().toUpperCase();

      if (!passport || !destination) {
        renderResult(out, { error: 'Select both passport and destination.' });
        return;
      }

      renderResult(out, { loading: true });
      try {
        const res = await apiWithFallback(
          [
            '/api/travelbuddy/visa/check',
            '/.netlify/functions/api/travelbuddy/visa/check'
          ],
          { passport, destination }
        );
        renderResult(out, { data: res });
      } catch (err) {
        renderResult(out, { error: err && err.message ? err.message : 'Failed to fetch visa rules.' });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
