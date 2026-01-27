(function () {
  const STORAGE_KEY = "bookingcart_flights_v1";

  const airports = [
    { city: "London", name: "Heathrow", code: "LHR" },
    { city: "London", name: "Gatwick", code: "LGW" },
    { city: "Paris", name: "Charles de Gaulle", code: "CDG" },
    { city: "Amsterdam", name: "Schiphol", code: "AMS" },
    { city: "Frankfurt", name: "Frankfurt", code: "FRA" },
    { city: "Munich", name: "Munich", code: "MUC" },
    { city: "Rome", name: "Fiumicino", code: "FCO" },
    { city: "Madrid", name: "Barajas", code: "MAD" },
    { city: "Barcelona", name: "El Prat", code: "BCN" },
    { city: "Istanbul", name: "Istanbul", code: "IST" },
    { city: "Dubai", name: "Dubai", code: "DXB" },
    { city: "Doha", name: "Hamad", code: "DOH" },
    { city: "Cairo", name: "Cairo", code: "CAI" },
    { city: "Riyadh", name: "King Khalid", code: "RUH" },
    { city: "Jeddah", name: "King Abdulaziz", code: "JED" },
    { city: "Nairobi", name: "Jomo Kenyatta", code: "NBO" },
    { city: "Lagos", name: "Murtala Muhammed", code: "LOS" },
    { city: "Johannesburg", name: "O.R. Tambo", code: "JNB" },
    { city: "New York", name: "JFK", code: "JFK" },
    { city: "New York", name: "Newark", code: "EWR" },
    { city: "Boston", name: "Logan", code: "BOS" },
    { city: "Chicago", name: "O'Hare", code: "ORD" },
    { city: "Los Angeles", name: "LAX", code: "LAX" },
    { city: "San Francisco", name: "SFO", code: "SFO" },
    { city: "Toronto", name: "Pearson", code: "YYZ" },
    { city: "Vancouver", name: "YVR", code: "YVR" },
    { city: "Mexico City", name: "Benito Juárez", code: "MEX" },
    { city: "São Paulo", name: "Guarulhos", code: "GRU" },
    { city: "Tokyo", name: "Haneda", code: "HND" },
    { city: "Tokyo", name: "Narita", code: "NRT" },
    { city: "Seoul", name: "Incheon", code: "ICN" },
    { city: "Singapore", name: "Changi", code: "SIN" },
    { city: "Hong Kong", name: "Hong Kong", code: "HKG" },
    { city: "Bangkok", name: "Suvarnabhumi", code: "BKK" },
    { city: "Delhi", name: "Indira Gandhi", code: "DEL" },
    { city: "Mumbai", name: "Chhatrapati Shivaji", code: "BOM" },
    { city: "Sydney", name: "Kingsford Smith", code: "SYD" },
    { city: "Melbourne", name: "Tullamarine", code: "MEL" }
  ];

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
    steps.forEach((s) => {
      s.setAttribute("data-active", s.getAttribute("data-step-id") === step ? "true" : "false");
    });
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
      console.warn("Duffel airport search failed, using local data:", e);
    }
    return [];
  }

  function initAirportSuggest(input) {
    const root = input.closest(".suggest");
    if (!root) return;
    const list = root.querySelector(".suggest__list");
    if (!list) return;

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

      // Try Amadeus API first
      let results = await searchAmadeusAirports(q);
      
      // If no results from Amadeus, try Duffel
      if (results.length === 0) {
        results = await searchDuffelAirports(q);
      }
      
      // If still no results, use local data
      if (results.length === 0) {
        results = airports.filter((a) => {
          const s = (a.city + " " + a.name + " " + a.code).toLowerCase();
          return s.includes(q.toLowerCase());
        });
      }

      render(results);
    }

    input.addEventListener("input", () => {
      const q = input.value.trim();
      
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
        // For single character, use local data immediately
        const results = airports.filter((a) => {
          const s = (a.city + " " + a.name + " " + a.code).toLowerCase();
          return s.includes(q.toLowerCase());
        });
        render(results);
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
    const inputs = Array.from(document.querySelectorAll("input[data-airport-input]"));
    inputs.forEach(initAirportSuggest);
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

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const mode = (readState().tripType || "round").toString();
      const payload = {
        tripType: mode,
        from: from ? from.value.trim() : "",
        to: to ? to.value.trim() : "",
        depart: depart ? depart.value : "",
        return: ret ? ret.value : "",
        cabin: cabin ? cabin.value : "Economy"
      };

      if (!payload.from || !payload.to) {
        toast("Missing route", "Please choose a departure and destination airport.");
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

  function seedFlights(search) {
    const airlines = [
      { code: "TG", name: "BookingCart Air", logo: "BC" },
      { code: "GN", name: "GreenJet", logo: "GJ" },
      { code: "SK", name: "SkyNova", logo: "SN" },
      { code: "AF", name: "AeroFlow", logo: "AF" },
      { code: "CL", name: "Cloudline", logo: "CL" }
    ];

    const base = 190;
    const cabinMult =
      search.cabin === "Premium" ? 1.25 : search.cabin === "Business" ? 1.85 : search.cabin === "First" ? 2.4 : 1;

    const makeTime = (h, m) => String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");

    const list = [];
    for (let i = 0; i < 18; i++) {
      const a = airlines[i % airlines.length];
      const stops = i % 6 === 0 ? 2 : i % 3 === 0 ? 1 : 0;
      const departH = 6 + (i % 12);
      const departM = i % 2 === 0 ? 15 : 40;
      const durMin = 95 + (i % 9) * 23 + stops * 55;
      const arrTotal = departH * 60 + departM + durMin;
      const arrH = Math.floor((arrTotal / 60) % 24);
      const arrM = arrTotal % 60;

      const price = Math.round((base + i * 17 + stops * 45) * cabinMult);

      const id = a.code + "-" + (100 + i);
      list.push({
        id,
        airline: a,
        departTime: makeTime(departH, departM),
        arriveTime: makeTime(arrH, arrM),
        durationMin: durMin,
        stops,
        price
      });
    }

    return list;
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
        originLocationCode: extractIata(search.from),
        destinationLocationCode: extractIata(search.to),
        departureDate: search.depart,
        returnDate: search.tripType === "round" ? search.return : "",
        adults: state.passengers?.adults || 1,
        children: state.passengers?.children || 0,
        infants: state.passengers?.infants || 0,
        travelClass: toAmadeusTravelClass(search.cabin),
        currencyCode: "USD",
        max: 30
      };

      const resp = await fetch("/api/duffel-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await resp.json().catch(() => null);
      if (data && data.ok && Array.isArray(data.flights)) {
        console.log(`Duffel search successful: ${data.flights.length} flights`);
        return data.flights;
      }
    } catch (e) {
      console.warn("Duffel flight search failed:", e);
    }
    return [];
  }

  async function fetchAmadeusFlights(state, search) {
    const originLocationCode = extractIata(search.from);
    const destinationLocationCode = extractIata(search.to);
    if (!originLocationCode || !destinationLocationCode) {
      throw new Error("Please pick airports from suggestions (IATA codes required). ");
    }

    const pax = state.passengers || { adults: 1, children: 0, infants: 0 };
    const tripType = (state.tripType || search.tripType || "round").toString();

    const body = {
      originLocationCode,
      destinationLocationCode,
      departureDate: search.depart,
      returnDate: tripType === "round" ? search.return : "",
      adults: Number(pax.adults || 1),
      children: Number(pax.children || 0),
      infants: Number(pax.infants || 0),
      travelClass: toAmadeusTravelClass(search.cabin),
      currencyCode: "USD",
      max: 30
    };

    const resp = await fetch("/api/amadeus-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data || !data.ok) {
      const msg = data && data.error ? data.error : "Amadeus search failed";
      throw new Error(msg);
    }

    return Array.isArray(data.flights) ? data.flights : [];
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
        empty.innerHTML = '<div class="card__body"><div class="kpi">No flights match your filters</div><div class="muted" style="margin-top:6px">Try increasing your max price or changing stops/airlines.</div></div>';
        listEl.appendChild(empty);
        return;
      }

      list.forEach((f) => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML =
          '<div class="card__body">' +
          '<div class="row space">' +
          '<div class="row">' +
          '<div class="logo" aria-hidden="true">' +
          f.airline.logo +
          "</div>" +
          '<div style="display:flex;flex-direction:column;gap:2px">' +
          '<div class="kpi">' +
          f.airline.name +
          "</div>" +
          '<div class="muted" style="font-weight:700">' +
          (search.from || "") +
          " → " +
          (search.to || "") +
          "</div>" +
          "</div>" +
          "</div>" +
          '<div style="text-align:right">' +
          '<div class="price">' +
          money(f.price) +
          "</div>" +
          '<div class="muted" style="font-weight:700">per traveler</div>' +
          "</div>" +
          "</div>" +
          '<div class="hr"></div>' +
          '<div class="row space">' +
          '<div class="row" style="gap:10px;flex-wrap:wrap">' +
          '<span class="pill"><span style="font-weight:950">' +
          f.departTime +
          "</span> depart</span>" +
          '<span class="pill"><span style="font-weight:950">' +
          f.arriveTime +
          "</span> arrive</span>" +
          '<span class="pill">' +
          durationLabel(f.durationMin) +
          "</span>" +
          '<span class="pill">' +
          (f.stops === 0 ? "Non-stop" : f.stops + " stop" + (f.stops > 1 ? "s" : "")) +
          "</span>" +
          "</div>" +
          '<a class="btn btn-secondary" href="#" data-flight-link>View details</a>' +
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
        const codes = Array.from(new Set(flights.map((f) => f.airline.code)));
        codes.forEach((c) => {
          const label = flights.find((f) => f.airline.code === c).airline.name;
          const opt = document.createElement("option");
          opt.value = c;
          opt.textContent = label;
          airlineSelect.appendChild(opt);
        });
      }

      const update = () => render(apply(flights));
      const inputs = Array.from(document.querySelectorAll("input[name='maxPrice'], select[name='stops'], select[name='airline'], select[name='departTime'], select[name='sort']"));
      inputs.forEach((i) => i.addEventListener("input", update));
      update();
    }

    (async () => {
      let flights = null;

      if (window.location.protocol === "file:") {
        toast("Amadeus disabled", "To use live results, run via Netlify (not file://). Showing demo flights.");
      } else {
        try {
          // Try Amadeus API first
          flights = await fetchAmadeusFlights(state, search);
          
          // If Amadeus returns no results, try Duffel
          if (!flights || flights.length === 0) {
            console.log("Amadeus returned no results, trying Duffel API...");
            flights = await fetchDuffelFlights(state, search);
          }
          
          if (!flights || flights.length === 0) {
            toast("No offers", "Neither Amadeus nor Duffel returned offers. Showing demo flights.");
            flights = null;
          } else {
            const source = flights[0]?.id?.startsWith('DF-') ? 'Duffel' : 'Amadeus';
            toast(`Live search successful`, `Found ${flights.length} flights via ${source}.`);
          }
        } catch (e) {
          console.error("API search error:", e);
          
          // Try Duffel as fallback
          try {
            flights = await fetchDuffelFlights(state, search);
            if (flights && flights.length > 0) {
              toast("Duffel search successful", `Found ${flights.length} flights via Duffel API.`);
            } else {
              const errorMsg = e && e.message ? e.message : "API request failed";
              toast("Live search unavailable", errorMsg + ". Showing demo flights.");
              flights = null;
            }
          } catch (duffelError) {
            console.error("Duffel API also failed:", duffelError);
            const errorMsg = e && e.message ? e.message : "Both APIs failed";
            toast("Live search unavailable", errorMsg + ". Showing demo flights.");
            flights = null;
          }
        }
      }

      if (!flights) flights = seedFlights(search);
      hydrateResults(flights);
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
    const times = root.querySelector("[data-times]");
    const duration = root.querySelector("[data-duration]");
    const price = root.querySelector("[data-price]");

    if (airline) setText(airline, flight.airline.name);
    if (times) setText(times, flight.departTime + " → " + flight.arriveTime);
    if (duration) setText(duration, durationLabel(flight.durationMin) + " • " + (flight.stops === 0 ? "Non-stop" : flight.stops + " stop" + (flight.stops > 1 ? "s" : "")));
    if (price) setText(price, money(flight.price));

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

    const form = root.querySelector("form[data-payment-form]");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = (form.querySelector("input[name='cardName']") || {}).value || "";
      const num = (form.querySelector("input[name='cardNumber']") || {}).value || "";
      const exp = (form.querySelector("input[name='expiry']") || {}).value || "";
      const cvc = (form.querySelector("input[name='cvc']") || {}).value || "";

      if (!name.trim() || !num.trim() || !exp.trim() || !cvc.trim()) {
        toast("Payment details", "Fill in your payment details to continue.");
        return;
      }

      const bookingRef = "BC" + Math.random().toString(36).slice(2, 8).toUpperCase();
      writeState({ bookingRef });
      window.location.href = "confirmation.html";
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
    const refEl = root.querySelector("[data-booking-ref]");
    if (refEl) setText(refEl, state.bookingRef || "—");

    const totals = computeTotals(state);
    const totalEl = root.querySelector("[data-confirm-total]");
    if (totalEl) setText(totalEl, money(totals.total));

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
