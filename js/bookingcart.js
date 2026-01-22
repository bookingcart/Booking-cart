(function () {
  const STORAGE_KEY = "bookingcart_flights_v1";

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writeState(patch) {
    const current = readState();
    const next = Object.assign({}, current, patch);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function getQuery() {
    const params = new URLSearchParams(window.location.search);
    const obj = {};
    params.forEach((v, k) => {
      obj[k] = v;
    });
    return obj;
  }

  function setText(el, text) {
    if (!el) return;
    el.textContent = text;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function ensureToast() {
    let toast = document.querySelector(".toast");
    if (toast) return toast;
    toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML =
      '<p class="toast__title" id="toastTitle"></p><p class="toast__desc" id="toastDesc"></p>';
    document.body.appendChild(toast);
    return toast;
  }

  function toast(title, desc) {
    const t = ensureToast();
    setText(document.getElementById("toastTitle"), title);
    setText(document.getElementById("toastDesc"), desc);
    t.setAttribute("data-open", "true");
    window.clearTimeout(toast._timer);
    toast._timer = window.setTimeout(() => {
      t.setAttribute("data-open", "false");
    }, 2600);
  }

  function initStepper() {
    const stepEl = document.querySelector("[data-step]");
    if (!stepEl) return;

    const step = stepEl.getAttribute("data-step");
    const steps = Array.from(document.querySelectorAll(".step"));
    const state = readState();
    const allowedIndex = allowedStepIndex(state);
    steps.forEach((s) => {
      const id = s.getAttribute("data-step-id") || "";
      const idx = stepIndex(id);
      s.setAttribute("data-active", id === step ? "true" : "false");
      if (idx > allowedIndex) {
        s.setAttribute("aria-disabled", "true");
        s.addEventListener("click", (e) => {
          e.preventDefault();
          const msg = blockedMessageFor(id);
          toast("Finish required steps", msg);
        });
      } else {
        s.removeAttribute("aria-disabled");
      }
    });
  }

  const STEP_ORDER = [
    { id: "search", href: "index.html" },
    { id: "results", href: "results.html" },
    { id: "details", href: "details.html" },
    { id: "passengers", href: "passengers.html" },
    { id: "extras", href: "extras.html" },
    { id: "payment", href: "payment.html" },
    { id: "confirmation", href: "confirmation.html" }
  ];

  function stepIndex(id) {
    return STEP_ORDER.findIndex((s) => s.id === id);
  }

  function stepHref(id) {
    const s = STEP_ORDER.find((x) => x.id === id);
    return s ? s.href : "index.html";
  }

  function isValidSearch(state) {
    const s = state.search || {};
    const mode = String(state.tripType || s.tripType || "round");
    if (!s.from || !s.to) return false;
    if (!s.fromCode || !s.toCode) return false;
    if (!s.depart) return false;
    if (mode === "round" && !s.return) return false;
    return true;
  }

  function hasFlightSelection(state) {
    return !!(state && state.selectedFlightId);
  }

  function hasPassengerInfo(state) {
    const pax = state.passengers || { adults: 1, children: 0, infants: 0 };
    const totalPax = (pax.adults || 0) + (pax.children || 0) + (pax.infants || 0);
    const travelers = Array.isArray(state.travelers) ? state.travelers : [];
    const email = ((state.contact || {}).email || "").trim();
    if (!email) return false;
    if (travelers.length < totalPax) return false;
    const requiredOk = travelers.slice(0, totalPax).every((t) => {
      return t && t.firstName && t.lastName && t.dob && t.doc;
    });
    return requiredOk;
  }

  function allowedStepIndex(state) {
    if (!isValidSearch(state)) return 0;
    if (!hasFlightSelection(state)) return 1;
    if (!hasPassengerInfo(state)) return 2;
    const hasBookingRef = !!(state && state.bookingRef);
    return hasBookingRef ? 6 : 5;
  }

  function blockedMessageFor(targetStepId) {
    const idx = stepIndex(targetStepId);
    if (idx <= 0) return "Start your search to continue.";
    if (idx === 1) return "Complete the search form (pick airports from the list and select dates).";
    if (idx === 2) return "Select a flight on the Results page first.";
    if (idx === 3) return "Select a flight on the Details page first.";
    if (idx === 6) return "Complete payment first to view confirmation.";
    if (idx >= 4) return "Complete passenger details (traveler info + contact email) first.";
    return "Complete the required fields first.";
  }

  function guardRedirectForStep(currentStepId, state, query) {
    const flights = Array.isArray(state.flights) ? state.flights : [];
    const qFlight = query && query.flight ? String(query.flight) : "";

    if (currentStepId === "results") {
      if (!isValidSearch(state)) return { href: stepHref("search"), code: "search" };
      return null;
    }

    if (currentStepId === "details") {
      if (!isValidSearch(state)) return { href: stepHref("search"), code: "search" };
      if (!flights.length) return { href: stepHref("results"), code: "results" };
      if (!qFlight && !hasFlightSelection(state)) return { href: stepHref("results"), code: "select" };
      return null;
    }

    if (currentStepId === "passengers") {
      if (!isValidSearch(state)) return { href: stepHref("search"), code: "search" };
      if (!flights.length) return { href: stepHref("results"), code: "results" };
      if (!hasFlightSelection(state)) return { href: stepHref("results"), code: "select" };
      return null;
    }

    if (currentStepId === "extras" || currentStepId === "payment") {
      if (!isValidSearch(state)) return { href: stepHref("search"), code: "search" };
      if (!hasFlightSelection(state)) return { href: stepHref("results"), code: "select" };
      if (!hasPassengerInfo(state)) return { href: stepHref("passengers"), code: "passengers" };
      return null;
    }

    if (currentStepId === "confirmation") {
      if (!isValidSearch(state)) return { href: stepHref("search"), code: "search" };
      if (!hasFlightSelection(state)) return { href: stepHref("results"), code: "select" };
      if (!hasPassengerInfo(state)) return { href: stepHref("passengers"), code: "passengers" };
      const hasSessionId = !!(query && query.session_id);
      const hasBookingRef = !!(state && state.bookingRef);
      if (!hasSessionId && !hasBookingRef) return { href: stepHref("payment"), code: "payment" };
      return null;
    }

    return null;
  }

  function applyGuards() {
    const stepEl = document.querySelector("[data-step]");
    if (!stepEl) return;
    const step = stepEl.getAttribute("data-step") || "";
    if (!step) return;
    const st = readState();
    const q = getQuery();
    const redirect = guardRedirectForStep(step, st, q);
    if (!redirect || !redirect.href) return;

    const href = String(redirect.href);
    const code = String(redirect.code || "guard");
    const next = href + (href.indexOf("?") === -1 ? "?" : "&") + "guard=" + encodeURIComponent(code);
    window.location.replace(next);
  }

  function showGuardToast() {
    const q = getQuery();
    const code = q && q.guard ? String(q.guard) : "";
    if (!code) return;
    if (code === "search") toast("Complete search", "Pick airports from the list and select dates to continue.");
    else if (code === "results") toast("Open results first", "Search flights first, then select a flight.");
    else if (code === "select") toast("Select a flight", "Choose a flight on the Results page to continue.");
    else if (code === "passengers") toast("Passenger details required", "Fill traveler details and a contact email to continue.");
    else if (code === "payment") toast("Payment required", "Complete payment to view confirmation.");
  }

  function closeAllDropdowns(except) {
    const panels = Array.from(document.querySelectorAll(".dropdown__panel[data-open='true']"));
    panels.forEach((p) => {
      if (except && except === p) return;
      p.setAttribute("data-open", "false");
    });
  }

  function initDropdowns() {
    const dropdowns = Array.from(document.querySelectorAll("[data-dropdown]"));
    dropdowns.forEach((root) => {
      const trigger = root.querySelector("[data-dropdown-trigger]");
      const panel = root.querySelector(".dropdown__panel");
      if (!trigger || !panel) return;

      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        const isOpen = panel.getAttribute("data-open") === "true";
        closeAllDropdowns(isOpen ? null : panel);
        panel.setAttribute("data-open", isOpen ? "false" : "true");
      });
    });

    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const inside = target.closest("[data-dropdown]");
      if (!inside) closeAllDropdowns(null);
    });
  }

  async function searchAmadeusAirports(keyword) {
    if (!keyword || keyword.length < 2) return [];
    try {
      const resp = await fetch(`/api/amadeus-airports?keyword=${encodeURIComponent(keyword)}`);
      const data = await resp.json().catch(() => null);
      if (data && data.ok && Array.isArray(data.airports)) {
        return data.airports;
      }
    } catch (e) {
      console.warn("Amadeus airport search failed, using local data:", e);
    }
    return [];
  }

  async function searchDuffelAirports(keyword) {
    if (!keyword || keyword.length < 2) return [];
    try {
      const resp = await fetch(`/api/duffel-airports?keyword=${encodeURIComponent(keyword)}`);
      const data = await resp.json().catch(() => null);
      if (data && data.ok && Array.isArray(data.airports)) {
        return data.airports;
      }
    } catch (e) {
      console.warn("Duffel airport search failed:", e);
      toast("Error", "Failed to search for airports");
    }
    return [];
  }

  function initAirportSuggest(root) {
    const input = root.querySelector("input[data-airport-input]");
    const list = root.querySelector("[data-airport-list]") || root.querySelector(".suggest__list");
    if (!input || !list) return;

    let searchTimeout = null;

    function render(items) {
      list.innerHTML = "";
      if (!items.length) {
        list.setAttribute("data-open", "false");
        return;
      }
      items.slice(0, 8).forEach((a) => {
        const li = document.createElement("li");
        li.className = "suggest__item";
        li.setAttribute("role", "option");
        li.setAttribute("tabindex", "0");
        const displayName = a.name && a.name !== a.city ? a.name : "";
        li.innerHTML =
          '<span>' +
          a.city +
          (displayName ? ' <span class="small">' + displayName + "</span>" : "") +
          "</span><span class=\"suggest__code\">" +
          a.code +
          "</span>";
        li.addEventListener("click", () => {
          input.value = a.city + " (" + a.code + ")";
          input.setAttribute("data-airport-code", a.code);
          list.setAttribute("data-open", "false");
        });
        li.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            li.click();
          }
        });
        list.appendChild(li);
      });
      list.setAttribute("data-open", "true");
    }

    async function performSearch(q) {
      if (q.length < 1) {
        render([]);
        return;
      }

      // Use Duffel API only
      let results = await searchDuffelAirports(q);
      
      // If no results from Duffel, show empty
      if (results.length === 0) {
        console.log(`No airports found for "${q}" in Duffel API`);
      }

      render(results);
    }

    input.addEventListener("input", () => {
      const q = input.value.trim();
      input.removeAttribute("data-airport-code");
      
      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Debounce API calls
      if (q.length >= 2) {
        searchTimeout = setTimeout(() => performSearch(q), 300);
      } else if (q.length === 0) {
        render([]);
      } else {
        render([]);
      }
    });

    input.addEventListener("focus", () => {
      if (input.value.trim().length) input.dispatchEvent(new Event("input"));
    });

    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const inside = t.closest(".suggest");
      if (inside !== root) list.setAttribute("data-open", "false");
    });
  }

  function initAirportSuggestAll() {
    const roots = Array.from(document.querySelectorAll(".suggest"));
    roots.forEach(initAirportSuggest);
  }

  function initTripTabs() {
    const tabs = Array.from(document.querySelectorAll(".tab[data-trip]"));
    if (!tabs.length) return;

    const multi = document.querySelector("[data-multicity]");
    const returnField = document.querySelector("[data-return-field]");

    function setMode(mode) {
      tabs.forEach((t) => t.setAttribute("aria-selected", t.getAttribute("data-trip") === mode ? "true" : "false"));
      if (returnField) {
        returnField.style.display = mode === "round" ? "flex" : "none";
      }
      if (multi) {
        multi.style.display = mode === "multi" ? "block" : "none";
      }
      writeState({ tripType: mode });
    }

    tabs.forEach((t) => {
      t.addEventListener("click", () => setMode(t.getAttribute("data-trip")));
    });

    const st = readState();
    setMode(st.tripType || "round");
  }

  function initPassengerControls() {
    const root = document.querySelector("[data-passengers]");
    if (!root) return;

    const adultsEl = root.querySelector("[data-count='adults']");
    const childrenEl = root.querySelector("[data-count='children']");
    const infantsEl = root.querySelector("[data-count='infants']");

    const trigger = document.querySelector("[data-passengers-trigger]");
    const hidden = document.querySelector("input[name='passengers']");

    function readCounts() {
      const st = readState();
      const c = st.passengers || { adults: 1, children: 0, infants: 0 };
      c.adults = clamp(Number(c.adults || 1), 1, 9);
      c.children = clamp(Number(c.children || 0), 0, 9);
      c.infants = clamp(Number(c.infants || 0), 0, c.adults);
      return c;
    }

    function writeCounts(c) {
      writeState({ passengers: c });
      if (adultsEl) setText(adultsEl, String(c.adults));
      if (childrenEl) setText(childrenEl, String(c.children));
      if (infantsEl) setText(infantsEl, String(c.infants));

      const label = c.adults + c.children + c.infants === 1 ? "1 passenger" : c.adults + c.children + c.infants + " passengers";
      if (trigger) setText(trigger, label);
      if (hidden) hidden.value = JSON.stringify(c);
    }

    function bind(kind) {
      const minus = root.querySelector("[data-minus='" + kind + "']");
      const plus = root.querySelector("[data-plus='" + kind + "']");
      if (minus)
        minus.addEventListener("click", (e) => {
          e.preventDefault();
          const c = readCounts();
          c[kind] = c[kind] - 1;
          if (kind === "adults") c.adults = clamp(c.adults, 1, 9);
          if (kind === "children") c.children = clamp(c.children, 0, 9);
          if (kind === "infants") c.infants = clamp(c.infants, 0, c.adults);
          if (c.infants > c.adults) c.infants = c.adults;
          writeCounts(c);
        });
      if (plus)
        plus.addEventListener("click", (e) => {
          e.preventDefault();
          const c = readCounts();
          c[kind] = c[kind] + 1;
          if (kind === "adults") c.adults = clamp(c.adults, 1, 9);
          if (kind === "children") c.children = clamp(c.children, 0, 9);
          if (kind === "infants") c.infants = clamp(c.infants, 0, c.adults);
          writeCounts(c);
        });
    }

    bind("adults");
    bind("children");
    bind("infants");

    writeCounts(readCounts());
  }

  function initSearchForm() {
    const form = document.querySelector("form[data-search-form]");
    if (!form) return;

    const st = readState();
    const from = form.querySelector("input[name='from']");
    const to = form.querySelector("input[name='to']");
    const depart = form.querySelector("input[name='depart']");
    const ret = form.querySelector("input[name='return']");
    const cabin = form.querySelector("select[name='cabin']");

    if (from && st.search && st.search.from) from.value = st.search.from;
    if (to && st.search && st.search.to) to.value = st.search.to;
    if (depart && st.search && st.search.depart) depart.value = st.search.depart;
    if (ret && st.search && st.search.return) ret.value = st.search.return;
    if (cabin && st.search && st.search.cabin) cabin.value = st.search.cabin;
    if (from && st.search && st.search.fromCode) from.setAttribute("data-airport-code", st.search.fromCode);
    if (to && st.search && st.search.toCode) to.setAttribute("data-airport-code", st.search.toCode);

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const mode = (readState().tripType || "round").toString();
      const fromCode = from ? (from.getAttribute("data-airport-code") || "") : "";
      const toCode = to ? (to.getAttribute("data-airport-code") || "") : "";
      const payload = {
        tripType: mode,
        from: from ? from.value.trim() : "",
        to: to ? to.value.trim() : "",
        fromCode,
        toCode,
        depart: depart ? depart.value : "",
        return: ret ? ret.value : "",
        cabin: cabin ? cabin.value : "Economy"
      };

      if (!payload.from || !payload.to) {
        toast("Missing route", "Please choose a departure and destination airport.");
        return;
      }

      if (!payload.fromCode || !payload.toCode) {
        toast("Pick from list", "Please click an airport from the suggestions list (IATA code required).");
        return;
      }

      if (!payload.depart) {
        toast("Missing date", "Please select a departure date.");
        return;
      }

      if (payload.tripType === "round" && !payload.return) {
        toast("Missing return date", "Select a return date or switch to one-way.");
        return;
      }

      writeState({ search: payload });
      window.location.href = "results.html";
    });
  }

  function money(n) {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
    } catch (e) {
      return "$" + n;
    }
  }

  function durationLabel(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h + "h " + String(m).padStart(2, "0") + "m";
  }

  function extractIata(value) {
    if (typeof value !== "string") return "";
    const m = value.toUpperCase().match(/\(([A-Z]{3})\)\s*$/);
    if (m && m[1]) return m[1];
    const m2 = value.toUpperCase().match(/\b([A-Z]{3})\b/);
    return m2 && m2[1] ? m2[1] : "";
  }

  function toAmadeusTravelClass(cabin) {
    const c = String(cabin || "").toLowerCase();
    if (c === "first") return "FIRST";
    if (c === "business") return "BUSINESS";
    if (c === "premium") return "PREMIUM_ECONOMY";
    return "ECONOMY";
  }

  async function fetchDuffelFlights(state, search) {
    try {
      const payload = {
        originLocationCode: search.fromCode || extractIata(search.from),
        destinationLocationCode: search.toCode || extractIata(search.to),
        departureDate: search.depart,
        returnDate: search.tripType === "round" ? search.return : "",
        adults: state.passengers?.adults || 1,
        children: state.passengers?.children || 0,
        infants: state.passengers?.infants || 0,
        travelClass: toAmadeusTravelClass(search.cabin),
        currencyCode: "USD",
        max: 100
      };

      const resp = await fetch("/api/duffel-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data || !data.ok) {
        const msg = data && data.error ? data.error : `Duffel search failed (${resp.status})`;
        throw new Error(msg);
      }

      if (Array.isArray(data.flights)) {
        console.log(`Duffel search successful: ${data.flights.length} flights`);
        return data.flights;
      }
      return [];
    } catch (e) {
      console.error("Duffel API error:", e);
      throw e;
    }
  }

  function initResults() {
    const root = document.querySelector("[data-results]");
    if (!root) return;

    const state = readState();
    const search = state.search || {};

    const headerRoute = document.querySelector("[data-route]");
    const headerMeta = document.querySelector("[data-meta]");
    if (headerRoute) setText(headerRoute, (search.from || "") + " → " + (search.to || ""));
    if (headerMeta) {
      const pax = state.passengers || { adults: 1, children: 0, infants: 0 };
      const total = pax.adults + pax.children + pax.infants;
      const trip = (state.tripType || "round") === "oneway" ? "One-way" : (state.tripType || "round") === "multi" ? "Multi-city" : "Round-trip";
      setText(headerMeta, trip + " • " + (search.depart || "") + (search.return ? " → " + search.return : "") + " • " + total + " pax • " + (search.cabin || "Economy"));
    }

    const listEl = root.querySelector("[data-results-list]");
    const sortEl = document.querySelector("select[name='sort']");

    const filters = {
      maxPrice: 1200,
      stops: "any",
      airline: "any",
      departBucket: "any"
    };

    function readFiltersFromUI() {
      const p = document.querySelector("input[name='maxPrice']");
      const s = document.querySelector("select[name='stops']");
      const a = document.querySelector("select[name='airline']");
      const d = document.querySelector("select[name='departTime']");
      if (p) filters.maxPrice = Number(p.value || 1200);
      if (s) filters.stops = s.value;
      if (a) filters.airline = a.value;
      if (d) filters.departBucket = d.value;
    }

    function inDepartBucket(time, bucket) {
      if (bucket === "any") return true;
      const h = Number(time.split(":")[0] || 0);
      if (bucket === "morning") return h >= 5 && h < 12;
      if (bucket === "afternoon") return h >= 12 && h < 18;
      if (bucket === "evening") return h >= 18 || h < 5;
      return true;
    }

    function apply(list) {
      readFiltersFromUI();
      let out = list.filter((f) => {
        if (f.price > filters.maxPrice) return false;
        if (filters.stops !== "any" && String(f.stops) !== String(filters.stops)) return false;
        if (filters.airline !== "any" && f.airline.code !== filters.airline) return false;
        if (!inDepartBucket(f.departTime, filters.departBucket)) return false;
        return true;
      });

      const sort = sortEl ? sortEl.value : "price";
      out = out.slice().sort((a, b) => {
        if (sort === "price") return a.price - b.price;
        if (sort === "duration") return a.durationMin - b.durationMin;
        if (sort === "depart") return a.departTime.localeCompare(b.departTime);
        return 0;
      });

      return out;
    }

    function render(list) {
      if (!listEl) return;
      listEl.innerHTML = "";
      if (!list.length) {
        const empty = document.createElement("div");
        empty.className = "card";
        empty.innerHTML =
          flights && flights.length
            ? '<div class="card__body"><div class="kpi">No flights match your filters</div><div class="muted" style="margin-top:6px">Try increasing your max price or changing stops/airlines.</div></div>'
            : '<div class="card__body"><div class="kpi">No flights found for this search</div><div class="muted" style="margin-top:6px">Try different airports or a later date.</div></div>';
        listEl.appendChild(empty);
        return;
      }

      list.forEach((f) => {
        const card = document.createElement("div");
        card.className = "card result-card";

        const airlineLogoMarkup = f.airline.logoUrl
          ? '<img class="airline-logo" src="' +
            String(f.airline.logoUrl).replace(/"/g, "&quot;") +
            '" alt="' +
            String(f.airline.name || "Airline").replace(/"/g, "&quot;") +
            '" loading="lazy" />'
          : (f.airline.logo || "");

        const hasReturn = !!(f.returnDepartTime && f.returnArriveTime);
        const stopsLabel = f.stops === 0 ? "Non-stop" : f.stops + " stop" + (f.stops > 1 ? "s" : "");
        const returnStopsLabel = (f.returnStops || 0) === 0 ? "Non-stop" : (f.returnStops || 0) + " stop" + ((f.returnStops || 0) > 1 ? "s" : "");
        const returnBlock = hasReturn
          ? '<div class="result-return">' +
            '<div class="result-subtitle">Return</div>' +
            '<div class="result-times">' +
            '<div class="result-time">' +
            f.returnDepartTime +
            "</div>" +
            '<div class="result-line" aria-hidden="true"><span class="result-dot"></span><span class="result-bar"></span><span class="result-dot"></span></div>' +
            '<div class="result-time" style="text-align:right">' +
            f.returnArriveTime +
            "</div>" +
            "</div>" +
            '<div class="result-sub">' +
            durationLabel(f.returnDurationMin || 0) +
            " • " +
            returnStopsLabel +
            "</div>" +
            "</div>"
          : "";

        const isRoundTrip = (state.tripType || "round") === "round";

        card.innerHTML =
          '<div class="card__body">' +
          '<div class="result-top">' +
          '<div class="result-airline">' +
          '<div class="logo" aria-hidden="true">' +
          airlineLogoMarkup +
          "</div>" +
          '<div class="result-airline__meta">' +
          '<div class="kpi">' +
          f.airline.name +
          "</div>" +
          '<div class="result-sub">' +
          durationLabel(f.durationMin) +
          " • " +
          stopsLabel +
          "</div>" +
          "</div>" +
          "</div>" +
          '<div class="result-price">' +
          '<div class="price">' +
          money(f.price) +
          "</div>" +
          '<div class="result-sub">per traveler</div>' +
          "</div>" +
          "</div>" +
          '<div class="result-mid">' +
          '<div class="result-subtitle">Outbound</div>' +
          '<div class="result-times">' +
          '<div class="result-time">' +
          f.departTime +
          "</div>" +
          '<div class="result-line" aria-hidden="true"><span class="result-dot"></span><span class="result-bar"></span><span class="result-dot"></span></div>' +
          '<div class="result-time" style="text-align:right">' +
          f.arriveTime +
          "</div>" +
          "</div>" +
          '<div class="result-airports">' +
          (search.from || "") +
          " → " +
          (search.to || "") +
          "</div>" +
          "</div>" +
          (isRoundTrip ? returnBlock : "") +
          '<div class="result-actions">' +
          '<a class="btn btn-primary" href="#" data-flight-link>Select</a>' +
          "</div>" +
          "</div>";

        const link = card.querySelector("[data-flight-link]");
        if (link) link.setAttribute("href", "details.html?flight=" + encodeURIComponent(f.id));

        listEl.appendChild(card);
      });
    }

    if (listEl) {
      listEl.innerHTML = "";
      for (let i = 0; i < 4; i++) {
        const sk = document.createElement("div");
        sk.className = "skeleton";
        listEl.appendChild(sk);
      }
    }

    function hydrateResults(flights) {
      writeState({ flights });

      const maxPriceEl = document.querySelector("input[name='maxPrice']");
      if (maxPriceEl) {
        const mx = Math.max(300, ...flights.map((f) => Number(f.price || 0)));
        const sliderMax = Math.ceil(mx / 50) * 50;
        maxPriceEl.max = String(sliderMax);
        maxPriceEl.value = String(sliderMax);
        filters.maxPrice = sliderMax;
      }

      const airlineSelect = document.querySelector("select[name='airline']");
      if (airlineSelect) {
        while (airlineSelect.options.length > 1) airlineSelect.remove(1);

        const byCode = new Map();
        flights.forEach((f) => {
          const code = f && f.airline && f.airline.code ? String(f.airline.code) : "";
          if (!code) return;
          if (!byCode.has(code)) {
            const name = f.airline && f.airline.name ? String(f.airline.name) : code;
            byCode.set(code, name);
          }
        });

        const entries = Array.from(byCode.entries()).sort((a, b) => String(a[1]).localeCompare(String(b[1])));
        entries.forEach(([code, name]) => {
          const opt = document.createElement("option");
          opt.value = code;
          opt.textContent = `${name} (${code})`;
          airlineSelect.appendChild(opt);
        });

        // If current selected airline is no longer available, reset to Any
        if (airlineSelect.value !== "any" && !byCode.has(airlineSelect.value)) {
          airlineSelect.value = "any";
        }
      }

      const update = () => render(apply(flights));
      const inputs = Array.from(document.querySelectorAll("input[name='maxPrice'], select[name='stops'], select[name='airline'], select[name='departTime'], select[name='sort']"));
      inputs.forEach((i) => i.addEventListener("input", update));
      update();
    }

    (async () => {
      let flights = null;

      if (window.location.protocol === "file:") {
        toast("Live search disabled", "To use live results, run via the server (not file://).");
      } else {
        try {
          // Use Duffel API only
          flights = await fetchDuffelFlights(state, search);
          
          if (!flights || flights.length === 0) {
            toast("No offers", "Booking Cart found no offers for this search. Please try different airports or dates.");
            flights = [];
          } else {
            toast("Search successful", `Booking Cart found ${flights.length} flights.`);
          }
        } catch (e) {
          console.error("Duffel API error:", e);
          const errorMsg = e && e.message ? e.message : "API request failed";
          toast("Live search unavailable", errorMsg + ". Please try again later.");
          flights = [];
        }
      }

      // No mock data fallback - only use real API results
      hydrateResults(flights || []);
    })();
  }

  function initDetails() {
    const root = document.querySelector("[data-details]");
    if (!root) return;

    const q = getQuery();
    const state = readState();
    const flights = state.flights || [];
    const id = (q.flight || "").toString();

    const flight = flights.find((f) => f.id === id) || flights[0];
    if (!flight) {
      toast("No selection", "Go back to results and pick a flight.");
      return;
    }

    writeState({ selectedFlightId: flight.id });

    const airline = root.querySelector("[data-airline]");
    const airlineLogo = root.querySelector("[data-airline-logo]");
    const times = root.querySelector("[data-times]");
    const duration = root.querySelector("[data-duration]");
    const price = root.querySelector("[data-price]");
    const breakdown = root.querySelector("[data-trip-breakdown]");

    function esc(v) {
      return String(v == null ? "" : v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;");
    }

    function fmtTime(iso) {
      if (!iso) return "";
      const d = new Date(iso);
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
    }

    function fmtDate(iso) {
      if (!iso) return "";
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "2-digit" });
    }

    function fmtDateTime(iso) {
      if (!iso) return "";
      const d = new Date(iso);
      const date = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "2-digit" });
      const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
      return `${date} • ${time}`;
    }

    function minsBetween(a, b) {
      if (!a || !b) return 0;
      const da = new Date(a);
      const db = new Date(b);
      const diff = Math.round((db - da) / 60000);
      return Number.isFinite(diff) ? diff : 0;
    }

    function layoverLabel(mins) {
      const m = Math.max(0, mins);
      const h = Math.floor(m / 60);
      const mm = m % 60;
      if (h <= 0) return `${mm}m`;
      return `${h}h ${String(mm).padStart(2, "0")}m`;
    }

    function renderLeg(title, segs) {
      const safeSegs = Array.isArray(segs) ? segs.filter(Boolean) : [];

      const wrapper = document.createElement("div");
      wrapper.className = "card itin-leg";

      if (!safeSegs.length) {
        wrapper.innerHTML =
          '<div class="itin-leg__head">' +
          '<div class="itin-leg__title">' +
          esc(title) +
          "</div>" +
          "</div>" +
          '<div class="itin-timeline">' +
          '<div class="muted" style="font-weight:700">No segment data available.</div>' +
          "</div>";
        return wrapper;
      }

      const first = safeSegs[0];
      const last = safeSegs[safeSegs.length - 1];
      const stops = Math.max(0, safeSegs.length - 1);
      const totalMin = minsBetween(first.departure?.at, last.arrival?.at);

      wrapper.innerHTML =
        '<div class="itin-leg__head">' +
        '<div class="itin-leg__title">' +
        esc(title) +
        "</div>" +
        '<div class="itin-leg__pills">' +
        '<span class="pill">' + esc((first.departure?.iataCode || "") + " → " + (last.arrival?.iataCode || "")) + "</span>" +
        '<span class="pill">' + esc(durationLabel(Math.max(0, totalMin))) + "</span>" +
        '<span class="pill">' + esc(stops === 0 ? "Non-stop" : stops + " stop" + (stops > 1 ? "s" : "")) + "</span>" +
        "</div>" +
        "</div>" +
        '<div class="itin-timeline" data-itin-timeline></div>';

      const timeline = wrapper.querySelector("[data-itin-timeline]");
      if (!timeline) return wrapper;

      safeSegs.forEach((s, idx) => {
        const isLast = idx === safeSegs.length - 1;
        const flightNo = ((s.carrierCode || "") + (s.number || "")).trim();
        const segMin = minsBetween(s.departure?.at, s.arrival?.at);

        const item = document.createElement("div");
        item.className = "itin-item";
        item.innerHTML =
          '<div class="itin-marker' + (isLast ? " itin-marker--end" : "") + '">' +
          '<div class="itin-dot"></div>' +
          "</div>" +
          '<div class="itin-content">' +
          '<div class="itin-row">' +
          '<div class="itin-point">' +
          '<div class="itin-time">' + esc(fmtTime(s.departure?.at)) + "</div>" +
          '<div class="itin-airport">' + esc(s.departure?.iataCode || "") + "</div>" +
          "</div>" +
          '<div class="itin-arrow">→</div>' +
          '<div class="itin-point" style="text-align:right">' +
          '<div class="itin-time">' + esc(fmtTime(s.arrival?.at)) + "</div>" +
          '<div class="itin-airport">' + esc(s.arrival?.iataCode || "") + "</div>" +
          "</div>" +
          "</div>" +
          '<div class="itin-sub">' +
          esc(fmtDate(s.departure?.at)) +
          (segMin > 0 ? " • " + esc(durationLabel(segMin)) : "") +
          "</div>" +
          '<div class="itin-chips">' +
          (flightNo ? '<span class="itin-chip">Flight ' + esc(flightNo) + "</span>" : "") +
          (s.duration ? '<span class="itin-chip">' + esc(String(s.duration)) + "</span>" : "") +
          "</div>" +
          "</div>";

        timeline.appendChild(item);

        if (idx < safeSegs.length - 1) {
          const next = safeSegs[idx + 1];
          const layMin = minsBetween(s.arrival?.at, next.departure?.at);

          const lay = document.createElement("div");
          lay.className = "itin-item";
          lay.innerHTML =
            '<div class="itin-marker">' +
            '<div class="itin-dot itin-dot--layover"></div>' +
            "</div>" +
            '<div class="itin-content">' +
            '<div class="itin-layover">Layover in ' +
            esc(s.arrival?.iataCode || "") +
            " • " +
            esc(layoverLabel(layMin)) +
            "</div>" +
            "</div>";
          timeline.appendChild(lay);
        }
      });

      return wrapper;
    }

    if (airline) setText(airline, flight.airline.name);
    if (airlineLogo) {
      if (flight.airline && flight.airline.logoUrl) {
        airlineLogo.innerHTML =
          '<img class="airline-logo" src="' +
          String(flight.airline.logoUrl).replace(/"/g, "&quot;") +
          '" alt="' +
          String(flight.airline.name || "Airline").replace(/"/g, "&quot;") +
          '" loading="lazy" />';
      } else {
        setText(airlineLogo, (flight.airline && flight.airline.logo) || "");
      }
    }
    if (times) {
      const hasReturn = !!(flight.returnDepartTime && flight.returnArriveTime);
      setText(times, hasReturn ? `${flight.departTime} → ${flight.arriveTime} • Return ${flight.returnDepartTime} → ${flight.returnArriveTime}` : `${flight.departTime} → ${flight.arriveTime}`);
    }
    if (duration) {
      const outPart = durationLabel(flight.durationMin) + " • " + (flight.stops === 0 ? "Non-stop" : flight.stops + " stop" + (flight.stops > 1 ? "s" : ""));
      const hasReturn = !!(flight.returnDepartTime && flight.returnArriveTime);
      const retPart = hasReturn ? " • Return " + durationLabel(flight.returnDurationMin || 0) + " • " + ((flight.returnStops || 0) === 0 ? "Non-stop" : (flight.returnStops || 0) + " stop" + ((flight.returnStops || 0) > 1 ? "s" : "")) : "";
      setText(duration, outPart + retPart);
    }
    if (price) setText(price, money(flight.price));

    if (breakdown) {
      breakdown.innerHTML = "";
      breakdown.appendChild(renderLeg("Outbound", flight.segments || []));
      if (Array.isArray(flight.returnSegments) && flight.returnSegments.length) {
        breakdown.appendChild(renderLeg("Return", flight.returnSegments));
      }
    }

    const cta = root.querySelector("[data-select-flight]");
    if (cta)
      cta.addEventListener("click", (e) => {
        e.preventDefault();
        toast("Flight selected", "Next: traveler details.");
        window.setTimeout(() => {
          window.location.href = "passengers.html";
        }, 450);
      });
  }

  function initPassengers() {
    const root = document.querySelector("[data-passenger-page]");
    if (!root) return;

    const state = readState();
    const pax = state.passengers || { adults: 1, children: 0, infants: 0 };
    const total = pax.adults + pax.children + pax.infants;

    const list = root.querySelector("[data-travelers]");
    if (!list) return;

    function travelerCard(i) {
      const wrap = document.createElement("div");
      wrap.className = "card";
      wrap.innerHTML =
        '<div class="card__body">' +
        '<div class="kpi">Traveler ' +
        (i + 1) +
        "</div>" +
        '<div class="small" style="margin-top:6px">Enter the passenger details exactly as on the travel document.</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">' +
        '<div class="field"><div class="label">First name</div><input class="control" name="firstName" placeholder="e.g., Amina" required></div>' +
        '<div class="field"><div class="label">Last name</div><input class="control" name="lastName" placeholder="e.g., Hassan" required></div>' +
        '<div class="field"><div class="label">Date of birth</div><input class="control" name="dob" type="date" required></div>' +
        '<div class="field"><div class="label">Passport/ID</div><input class="control" name="doc" placeholder="Passport number" required></div>' +
        "</div>" +
        "</div>";
      return wrap;
    }

    list.innerHTML = "";
    for (let i = 0; i < total; i++) list.appendChild(travelerCard(i));

    const form = root.querySelector("form[data-passenger-form]");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const travelerEls = Array.from(list.querySelectorAll(".card"));
      const travelers = travelerEls.map((c) => {
        const f = c.querySelector("input[name='firstName']");
        const l = c.querySelector("input[name='lastName']");
        const d = c.querySelector("input[name='dob']");
        const doc = c.querySelector("input[name='doc']");
        return {
          firstName: f ? f.value.trim() : "",
          lastName: l ? l.value.trim() : "",
          dob: d ? d.value : "",
          doc: doc ? doc.value.trim() : ""
        };
      });

      const contactEmail = (form.querySelector("input[name='email']") || {}).value || "";
      const phone = (form.querySelector("input[name='phone']") || {}).value || "";

      if (!contactEmail.trim()) {
        toast("Contact required", "Please enter an email for ticket delivery.");
        return;
      }

      if (travelers.some((t) => !t.firstName || !t.lastName || !t.dob || !t.doc)) {
        toast("Missing traveler info", "Fill all required traveler fields.");
        return;
      }

      writeState({ travelers, contact: { email: contactEmail.trim(), phone: (phone || "").trim() } });
      window.location.href = "extras.html";
    });
  }

  function computeTotals(state) {
    const pax = state.passengers || { adults: 1, children: 0, infants: 0 };
    const totalPax = pax.adults + pax.children + pax.infants;
    const flight = (state.flights || []).find((f) => f.id === state.selectedFlightId) || (state.flights || [])[0];
    const base = flight ? flight.price * totalPax : 0;

    const extras = state.extras || {};
    const baggage = Number(extras.baggage || 0) * 45;
    const seats = extras.seat === "standard" ? 14 * totalPax : extras.seat === "extra" ? 28 * totalPax : 0;
    const insurance = extras.insurance ? 19 * totalPax : 0;
    const meals = extras.meal === "premium" ? 12 * totalPax : extras.meal === "standard" ? 7 * totalPax : 0;

    const subtotal = base + baggage + seats + insurance + meals;
    const taxes = Math.round(subtotal * 0.11);
    const total = subtotal + taxes;

    return { totalPax, base, baggage, seats, insurance, meals, taxes, total };
  }

  function initExtras() {
    const root = document.querySelector("[data-extras]");
    if (!root) return;

    const state = readState();
    const extras = state.extras || { baggage: 0, seat: "none", insurance: false, meal: "none" };

    const baggage = root.querySelector("input[name='baggage']");
    const seat = root.querySelector("select[name='seat']");
    const insurance = root.querySelector("input[name='insurance']");
    const meal = root.querySelector("select[name='meal']");

    if (baggage) baggage.value = String(extras.baggage || 0);
    if (seat) seat.value = extras.seat || "none";
    if (insurance) insurance.checked = Boolean(extras.insurance);
    if (meal) meal.value = extras.meal || "none";

    const summary = {
      base: document.querySelector("[data-sum-base]"),
      extras: document.querySelector("[data-sum-extras]"),
      taxes: document.querySelector("[data-sum-taxes]"),
      total: document.querySelector("[data-sum-total]"),
    };

    function refresh() {
      const next = {
        baggage: baggage ? Number(baggage.value || 0) : 0,
        seat: seat ? seat.value : "none",
        insurance: insurance ? Boolean(insurance.checked) : false,
        meal: meal ? meal.value : "none"
      };
      writeState({ extras: next });

      const totals = computeTotals(readState());
      const extrasCost = totals.baggage + totals.seats + totals.insurance + totals.meals;
      if (summary.base) setText(summary.base, money(totals.base));
      if (summary.extras) setText(summary.extras, money(extrasCost));
      if (summary.taxes) setText(summary.taxes, money(totals.taxes));
      if (summary.total) setText(summary.total, money(totals.total));
    }

    [baggage, seat, insurance, meal].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", refresh);
      el.addEventListener("change", refresh);
    });

    refresh();

    const form = root.querySelector("form[data-extras-form]");
    if (form)
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        window.location.href = "payment.html";
      });
  }

  function initPayment() {
    const root = document.querySelector("[data-payment]");
    if (!root) return;

    const totals = computeTotals(readState());
    const totalEl = document.querySelector("[data-pay-total]");
    if (totalEl) setText(totalEl, money(totals.total));

    const q = getQuery();
    if (q && q.canceled === "1") {
      toast("Payment canceled", "You canceled Stripe Checkout. You can try again.");
    }

    const form = root.querySelector("form[data-payment-form]");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const existing = readState();
      const bookingRef = existing.bookingRef || "BC" + Math.random().toString(36).slice(2, 8).toUpperCase();

      const s = existing.search || {};
      const desc =
        "BookingCart " +
        ((s.fromCode || extractIata(s.from) || "") + "→" + (s.toCode || extractIata(s.to) || "")) +
        (s.depart ? " " + s.depart : "");

      const latestTotals = computeTotals(existing);
      const amountCents = Math.round(Number(latestTotals.total || 0) * 100);
      if (!Number.isFinite(amountCents) || amountCents <= 0) {
        toast("Payment", "Invalid checkout total.");
        return;
      }

      const btn = form.querySelector("button[type='submit']");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Redirecting…";
      }

      fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          currency: "usd",
          description: desc,
          bookingRef,
          successPath: "/confirmation.html",
          cancelPath: "/payment.html"
        })
      })
        .then(async (r) => {
          const data = await r.json().catch(() => null);
          if (!r.ok) {
            const msg = data && data.error ? String(data.error) : `Request failed (${r.status})`;
            throw new Error(msg);
          }
          if (!data || !data.ok || !data.url) {
            const msg = data && data.error ? String(data.error) : "Stripe Checkout failed";
            throw new Error(msg);
          }
          return data;
        })
        .then((data) => {
          writeState({ bookingRef });
          window.location.href = data.url;
        })
        .catch((err) => {
          console.error("Stripe checkout error:", err);
          toast("Payment unavailable", (err && err.message ? err.message : "Stripe error") + ".");
          if (btn) {
            btn.disabled = false;
            btn.textContent = "Pay & Confirm Booking";
          }
        });
    });

    const walletBtns = Array.from(root.querySelectorAll("[data-wallet]"));
    walletBtns.forEach((b) =>
      b.addEventListener("click", (e) => {
        e.preventDefault();
        toast("Wallet checkout", "Wallet payments are a UI demo in this version.");
      })
    );
  }

  function initConfirmation() {
    const root = document.querySelector("[data-confirmation]");
    if (!root) return;

    const state = readState();
    const q = getQuery();
    const refEl = root.querySelector("[data-booking-ref]");
    if (refEl) setText(refEl, state.bookingRef || "—");

    const totals = computeTotals(state);
    const totalEl = root.querySelector("[data-confirm-total]");
    if (totalEl) setText(totalEl, money(totals.total));

    const payStatusEl = root.querySelector("[data-payment-status]");
    if (payStatusEl) {
      setText(payStatusEl, "Verifying payment…");
      const sessionId = q && q.session_id ? String(q.session_id) : "";
      if (!sessionId) {
        setText(payStatusEl, "No Stripe session found.");
      } else {
        fetch("/api/stripe/session?session_id=" + encodeURIComponent(sessionId))
          .then((r) => r.json().catch(() => null))
          .then((data) => {
            if (!data || !data.ok) {
              const msg = data && data.error ? data.error : "Unable to verify payment";
              throw new Error(msg);
            }
            const paid = String(data.payment_status || "") === "paid";
            const amount = typeof data.amount_total === "number" ? (data.amount_total / 100).toFixed(2) : "";
            const cur = String(data.currency || "").toUpperCase();
            setText(payStatusEl, paid ? `Paid • ${cur} ${amount}` : `Not paid • status: ${data.payment_status || data.status}`);
          })
          .catch((err) => {
            console.error("Stripe verify error:", err);
            setText(payStatusEl, (err && err.message) ? err.message : "Unable to verify payment");
          });
      }
    }

    const flight = (state.flights || []).find((f) => f.id === state.selectedFlightId) || (state.flights || [])[0];
    const flightEl = root.querySelector("[data-confirm-flight]");
    if (flightEl && flight) {
      const s = state.search || {};
      setText(
        flightEl,
        (s.from || "") +
        " → " +
        (s.to || "") +
        " • " +
        flight.airline.name +
        " • " +
        flight.departTime +
        " → " +
        flight.arriveTime
      );
    }

    const downloadBtn = root.querySelector("[data-download]");
    if (downloadBtn)
      downloadBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const lines = [];
        const s = state.search || {};
        lines.push("Booking Reference: " + (state.bookingRef || ""));
        lines.push("Route: " + (s.from || "") + " -> " + (s.to || ""));
        lines.push("Dates: " + (s.depart || "") + (s.return ? " -> " + s.return : ""));
        if (flight) lines.push("Flight: " + flight.airline.name + " (" + flight.id + ") " + flight.departTime + " -> " + flight.arriveTime);
        lines.push("Total Paid: " + money(totals.total));
        lines.push("Contact: " + ((state.contact || {}).email || ""));

        const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ticket-" + (state.bookingRef || "booking") + ".txt";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });

    const emailBtn = root.querySelector("[data-email]");
    if (emailBtn)
      emailBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const email = ((state.contact || {}).email || "").trim();
        if (!email) {
          toast("No email", "Go back and add a contact email.");
          return;
        }
        toast("Ticket queued", "Demo: ticket would be emailed to " + email + ".");
      });
  }

  function init() {
    applyGuards();
    showGuardToast();
    initStepper();
    initDropdowns();
    initAirportSuggestAll();
    initTripTabs();
    initPassengerControls();
    initSearchForm();
    initResults();
    initDetails();
    initPassengers();
    initExtras();
    initPayment();
    initConfirmation();
  }

  document.addEventListener("DOMContentLoaded", init);

  window.BookingCart = {
    readState,
    writeState,
    airports,
    money,
    toast
  };
})();
