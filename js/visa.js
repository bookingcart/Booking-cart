(function () {
  const USER_APP_IDS_KEY = "bookingcart_visa_app_ids_v1";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function safeJsonParse(s) {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  }

  function readAppIds() {
    const raw = localStorage.getItem(USER_APP_IDS_KEY);
    const parsed = safeJsonParse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  }

  function writeAppIds(ids) {
    localStorage.setItem(USER_APP_IDS_KEY, JSON.stringify(ids));
  }

  function addAppId(id) {
    const ids = readAppIds();
    if (!ids.includes(id)) ids.unshift(id);
    writeAppIds(ids.slice(0, 50));
  }

  function setHtml(el, html) {
    if (!el) return;
    el.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function money(n) {
    const v = Number(n || 0);
    return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
  }

  function badge(text) {
    return `<span class="pill" style="padding:6px 10px;font-size:12px">${escapeHtml(text)}</span>`;
  }

  const COUNTRIES = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo",
    "Costa Rica",
    "Cote d'Ivoire",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czech Republic",
    "Democratic Republic of the Congo",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe"
  ];

  function localVisaRules() {
    return {
      "United Arab Emirates": {
        tourism: { type: "eVisa", governmentFee: 95, documents: ["Passport bio page", "Passport photo", "Accommodation details", "Return ticket (recommended)"] },
        business: { type: "eVisa", governmentFee: 125, documents: ["Passport bio page", "Passport photo", "Invitation letter (if applicable)"] },
        transit: { type: "Visa-free / Transit rules", governmentFee: 0, documents: ["Valid passport", "Onward ticket"] }
      },
      Turkey: {
        tourism: { type: "eVisa", governmentFee: 60, documents: ["Passport bio page", "Passport photo"] },
        business: { type: "eVisa", governmentFee: 75, documents: ["Passport bio page", "Passport photo"] },
        transit: { type: "Visa-free / Transit rules", governmentFee: 0, documents: ["Valid passport", "Onward ticket"] }
      },
      Kenya: {
        tourism: { type: "eTA", governmentFee: 35, documents: ["Passport bio page", "Passport photo", "Accommodation details", "Return ticket"] },
        business: { type: "eTA", governmentFee: 35, documents: ["Passport bio page", "Passport photo", "Invitation letter (if applicable)"] },
        transit: { type: "Visa-free / Transit rules", governmentFee: 0, documents: ["Valid passport", "Onward ticket"] }
      },
      India: {
        tourism: { type: "eVisa", governmentFee: 40, documents: ["Passport bio page", "Passport photo"] },
        business: { type: "eVisa", governmentFee: 80, documents: ["Passport bio page", "Passport photo", "Business card / invitation (if applicable)"] },
        transit: { type: "Embassy visa", governmentFee: 0, documents: ["Passport bio page", "Passport photo", "Onward ticket"] }
      }
    };
  }

  function computeEligibilityLocal(payload) {
    const nationality = String(payload.nationality || "").trim();
    const destination = String(payload.destination || "").trim();
    const purpose = String(payload.purpose || "tourism").trim();

    if (!nationality || !destination) {
      return {
        destination,
        nationality,
        purpose,
        visaType: "Visa required",
        summary: "Please provide nationality and destination.",
        processingOptions: [],
        requiredDocuments: []
      };
    }

    if (destination.toLowerCase() === nationality.toLowerCase()) {
      return {
        destination,
        nationality,
        purpose,
        visaType: "Visa-free",
        summary: "Based on your input, you may not need a visa to travel domestically. Confirm with official government guidance.",
        processingOptions: [{ label: "Standard", daysMin: 0, daysMax: 0, governmentFee: 0, serviceFee: 0, note: "No visa required" }],
        requiredDocuments: ["Valid passport"]
      };
    }

    const rules = localVisaRules();
    const byDest = rules[destination] || null;
    const rule = byDest ? byDest[purpose] || byDest.tourism : null;
    const visaType = rule ? rule.type : "Embassy visa";
    const govFee = rule ? Number(rule.governmentFee || 0) : 0;
    const docs = rule ? rule.documents : ["Passport bio page", "Passport photo"];

    const serviceBase = visaType === "Visa-free" ? 0 : 49;
    const serviceRush = visaType === "Visa-free" ? 0 : 89;

    const processingOptions = visaType === "Visa-free"
      ? [{ label: "Standard", daysMin: 0, daysMax: 0, governmentFee: 0, serviceFee: 0, note: "No visa required" }]
      : [
          {
            label: "Standard",
            daysMin: visaType === "Embassy visa" ? 10 : 3,
            daysMax: visaType === "Embassy visa" ? 20 : 7,
            governmentFee: govFee,
            serviceFee: serviceBase,
            note: "We prepare, review, and submit your application to the official portal."
          },
          {
            label: "Rush",
            daysMin: visaType === "Embassy visa" ? 7 : 1,
            daysMax: visaType === "Embassy visa" ? 14 : 3,
            governmentFee: govFee,
            serviceFee: serviceRush,
            note: "Prioritized review and submission support. Subject to portal availability."
          }
        ];

    return {
      destination,
      nationality,
      purpose,
      visaType,
      summary: "This is guidance only. Final requirements, fees, and approval are determined by the destination government.",
      processingOptions,
      requiredDocuments: docs
    };
  }

  function populateCountrySelect(selectEl, countries) {
    if (!selectEl) return;
    const current = String(selectEl.value || "");
    const firstOption = selectEl.querySelector("option");
    const placeholderHtml = firstOption ? firstOption.outerHTML : '<option value="">Select</option>';
    const options = countries
      .slice()
      .sort((a, b) => a.localeCompare(b))
      .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
      .join("");
    selectEl.innerHTML = placeholderHtml + options;
    if (current) selectEl.value = current;
  }

  async function api(path, options) {
    const resp = await fetch(path, options);
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data || !data.ok) {
      const msg = data && data.error ? data.error : `Request failed (${resp.status})`;
      throw new Error(msg);
    }
    return data;
  }

  function renderEligibilityResult(container, result) {
    const docs = Array.isArray(result.requiredDocuments) ? result.requiredDocuments : [];
    const proc = Array.isArray(result.processingOptions) ? result.processingOptions : [];

    const procHtml = proc
      .map((p) => {
        const label = `${p.label} (${p.daysMin}-${p.daysMax} days)`;
        const fees = `${money(p.governmentFee)} + ${money(p.serviceFee)} service`;
        return `<div class="row space" style="gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div>
            <div class="kpi">${escapeHtml(label)}</div>
            <div class="muted" style="margin-top:6px">${escapeHtml(p.note || "")}</div>
          </div>
          <div style="text-align:right">
            <div class="kpi">${escapeHtml(fees)}</div>
            <div class="muted" style="margin-top:6px">Total: ${money((p.governmentFee || 0) + (p.serviceFee || 0))}</div>
          </div>
        </div>`;
      })
      .join('<div class="hr"></div>');

    const docsHtml = docs.map((d) => `<div class="row" style="gap:10px"><div class="result-dot"></div><div>${escapeHtml(d)}</div></div>`).join("");

    setHtml(
      container,
      `<div class="card">
        <div class="card__body">
          <div class="row space" style="gap:12px;flex-wrap:wrap">
            <div>
              <div class="kpi" style="font-size:18px">${escapeHtml(result.destination)} — ${escapeHtml(result.visaType)}</div>
              <div class="muted" style="margin-top:6px">${escapeHtml(result.summary || "")}</div>
            </div>
            <div class="row" style="gap:8px;flex-wrap:wrap">
              ${badge(`Purpose: ${result.purpose}`)}
              ${badge(`From: ${result.nationality}`)}
            </div>
          </div>

          <div class="hr"></div>

          <div class="kpi">Processing options</div>
          <div style="margin-top:10px;display:grid;gap:12px">${procHtml}</div>

          <div class="hr"></div>

          <div class="kpi">Required documents</div>
          <div class="muted" style="margin-top:6px">We will verify document requirements during expert review and submit through the official portal.</div>
          <div style="margin-top:10px;display:grid;gap:8px">${docsHtml}</div>

          <div class="hr"></div>

          <div class="row" style="gap:12px;flex-wrap:wrap;align-items:flex-start">
            <div style="flex:1;min-width:240px">
              <div class="kpi">Disclosure</div>
              <div class="muted" style="margin-top:6px">Government fees are mandatory. Service fees cover application preparation, review, and submission support. We are not affiliated with governments and do not issue visas.</div>
            </div>
            <div style="width:min(320px,100%)">
              <button class="btn btn-primary" type="button" data-start-visa style="width:100%">Start application</button>
              <a class="btn btn-secondary" href="visa-dashboard.html" style="margin-top:10px;width:100%;height:44px">Go to dashboard</a>
            </div>
          </div>
        </div>
      </div>`
    );
  }

  function initVisaChecker() {
    const root = qs("[data-visa-checker]");
    if (!root) return;

    const form = qs("[data-visa-form]", root);
    const resultEl = qs("[data-visa-result]", root);
    if (!form || !resultEl) return;

    const nationalitySelect = qs("select[name='nationality']", form);
    const destinationSelect = qs("select[name='destination']", form);
    populateCountrySelect(nationalitySelect, COUNTRIES);
    populateCountrySelect(destinationSelect, COUNTRIES);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = {
        nationality: String(fd.get("nationality") || ""),
        destination: String(fd.get("destination") || ""),
        purpose: String(fd.get("purpose") || ""),
        arrivalDate: String(fd.get("arrivalDate") || "")
      };

      if (!payload.nationality || !payload.destination || !payload.purpose || !payload.arrivalDate) {
        return;
      }

      resultEl.style.display = "block";
      setHtml(resultEl, `<div class="skeleton"></div>`);

      try {
        let result;
        try {
          const data = await api("/api/visa/eligibility", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          result = data.result;
        } catch {
          result = computeEligibilityLocal(payload);
        }

        renderEligibilityResult(resultEl, result);

        const startBtn = qs("[data-start-visa]", resultEl);
        if (startBtn) {
          startBtn.addEventListener("click", async () => {
            startBtn.disabled = true;
            try {
              const created = await api("/api/visa/application/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eligibility: result })
              });
              addAppId(created.id);
              window.location.href = `visa-dashboard.html?app=${encodeURIComponent(created.id)}`;
            } catch (err) {
              const localId = `local_${Date.now()}`;
              addAppId(localId);
              try {
                localStorage.setItem(`bookingcart_visa_local_app_${localId}`, JSON.stringify({
                  id: localId,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  status: "Draft",
                  eligibility: result
                }));
              } catch {
                // ignore
              }
              startBtn.disabled = false;
              alert((err && err.message ? err.message : "Failed to create application") + "\n\nSaved locally for demo mode.");
              window.location.href = `visa-dashboard.html?app=${encodeURIComponent(localId)}`;
            }
          });
        }
      } catch (err) {
        setHtml(
          resultEl,
          `<div class="card"><div class="card__body"><div class="kpi">Unable to check eligibility</div><div class="muted" style="margin-top:6px">${escapeHtml(
            err && err.message ? err.message : "Unknown error"
          )}</div></div></div>`
        );
      }
    });

    const dateInput = qs("input[name='arrivalDate']", form);
    if (dateInput && !dateInput.value) {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
  }

  function renderDashboardItem(app) {
    const status = app.status || "Draft";
    const dest = app.eligibility?.destination || "";
    const nat = app.eligibility?.nationality || "";
    const visaType = app.eligibility?.visaType || "";
    const createdAt = app.createdAt ? new Date(app.createdAt).toLocaleString() : "";

    return `<div class="card" style="box-shadow:none;margin-top:12px">
      <div class="card__body">
        <div class="row space" style="gap:12px;flex-wrap:wrap">
          <div>
            <div class="kpi">${escapeHtml(dest)} — ${escapeHtml(visaType)}</div>
            <div class="muted" style="margin-top:6px">From ${escapeHtml(nat)} · Created ${escapeHtml(createdAt)}</div>
          </div>
          <div class="row" style="gap:10px;flex-wrap:wrap">
            ${badge(`Status: ${status}`)}
            <a class="btn btn-secondary" href="visa.html" style="height:42px">Edit</a>
          </div>
        </div>
      </div>
    </div>`;
  }

  async function initVisaDashboard() {
    const root = qs("[data-visa-dashboard]");
    if (!root) return;

    const listEl = qs("[data-visa-dashboard-list]", root);
    if (!listEl) return;

    const ids = readAppIds();
    if (!ids.length) {
      setHtml(
        listEl,
        `<div class="muted">No applications yet. Start with the eligibility checker on <a href="visa.html" style="text-decoration:underline">Visa</a>.</div>`
      );
      return;
    }

    setHtml(listEl, `<div class="skeleton"></div>`);

    const apps = [];
    for (const id of ids) {
      try {
        if (String(id).startsWith("local_")) {
          const localRaw = localStorage.getItem(`bookingcart_visa_local_app_${id}`);
          const localApp = safeJsonParse(localRaw || "{}");
          if (localApp && localApp.id) apps.push(localApp);
        } else {
          const data = await api(`/api/visa/application?id=${encodeURIComponent(id)}`, { method: "GET" });
          apps.push(data.application);
        }
      } catch {
        // ignore missing
      }
    }

    if (!apps.length) {
      setHtml(
        listEl,
        `<div class="muted">No applications found. Start with the eligibility checker on <a href="visa.html" style="text-decoration:underline">Visa</a>.</div>`
      );
      return;
    }

    setHtml(listEl, apps.map(renderDashboardItem).join(""));
  }

  function renderAdminRow(app) {
    const status = app.status || "Draft";
    const id = app.id || "";
    const dest = app.eligibility?.destination || "";
    const nat = app.eligibility?.nationality || "";
    const createdAt = app.createdAt ? new Date(app.createdAt).toLocaleString() : "";

    const statuses = ["Draft", "Needs correction", "Ready to submit", "Submitted", "Under government review", "Approved", "Rejected"];

    return `<div class="card" style="box-shadow:none;margin-top:12px">
      <div class="card__body">
        <div class="row space" style="gap:12px;flex-wrap:wrap">
          <div>
            <div class="kpi">${escapeHtml(dest)} — ${escapeHtml(nat)}</div>
            <div class="muted" style="margin-top:6px">${escapeHtml(id)} · Created ${escapeHtml(createdAt)}</div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            <select class="control select" data-status style="height:42px">
              ${statuses
                .map((s) => `<option value="${escapeHtml(s)}" ${s === status ? "selected" : ""}>${escapeHtml(s)}</option>`)
                .join("")}
            </select>
            <button class="btn btn-primary" type="button" data-save style="height:42px">Save</button>
          </div>
        </div>
        <div class="field" style="margin-top:12px">
          <div class="label">Notes to applicant (optional)</div>
          <input class="control" data-notes placeholder="Request missing docs, corrections, etc" />
        </div>
      </div>
    </div>`;
  }

  async function initVisaAdmin() {
    const root = qs("[data-visa-admin]");
    if (!root) return;

    const tokenInput = qs("[data-admin-token]", root);
    const loadBtn = qs("[data-admin-load]", root);
    const listEl = qs("[data-visa-admin-list]", root);

    if (!tokenInput || !loadBtn || !listEl) return;

    const saved = sessionStorage.getItem("bookingcart_admin_token") || "";
    tokenInput.value = saved;

    async function load() {
      const token = String(tokenInput.value || "").trim();
      if (!token) {
        alert("Admin token required");
        return;
      }

      sessionStorage.setItem("bookingcart_admin_token", token);
      setHtml(listEl, `<div class="skeleton"></div>`);

      try {
        const data = await api("/api/visa/admin/applications", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` }
        });

        const apps = Array.isArray(data.applications) ? data.applications : [];
        if (!apps.length) {
          setHtml(listEl, `<div class="muted">No applications yet.</div>`);
          return;
        }

        setHtml(listEl, apps.map(renderAdminRow).join(""));

        qsa("[data-save]", listEl).forEach((btn) => {
          btn.addEventListener("click", async () => {
            const card = btn.closest(".card");
            if (!card) return;
            const statusSel = qs("[data-status]", card);
            const notesInput = qs("[data-notes]", card);
            const idLine = qs(".muted", card);
            const id = idLine ? (idLine.textContent || "").split(" · ")[0].trim() : "";
            const status = statusSel ? String(statusSel.value || "") : "";
            const notes = notesInput ? String(notesInput.value || "") : "";
            if (!id) return;

            btn.disabled = true;
            try {
              await api("/api/visa/admin/update", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id, status, notes })
              });
              btn.disabled = false;
              btn.textContent = "Saved";
              setTimeout(() => {
                btn.textContent = "Save";
              }, 900);
            } catch (err) {
              btn.disabled = false;
              alert(err && err.message ? err.message : "Failed to update");
            }
          });
        });
      } catch (err) {
        setHtml(
          listEl,
          `<div class="card"><div class="card__body"><div class="kpi">Unable to load admin queue</div><div class="muted" style="margin-top:6px">${escapeHtml(
            err && err.message ? err.message : "Unknown error"
          )}</div></div></div>`
        );
      }
    }

    loadBtn.addEventListener("click", load);
  }

  initVisaChecker();
  initVisaDashboard();
  initVisaAdmin();
})();
