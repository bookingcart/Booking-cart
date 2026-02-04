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

  async function searchDuffelAirports(keyword) {
    if (!keyword || keyword.length < 2) return [];
    try {
      console.log("Searching Duffel airports for:", keyword); // Debug log
      const resp = await fetch(`http://localhost:3002/api/duffel-airports?keyword=${encodeURIComponent(keyword)}`);
      console.log("Duffel API response status:", resp.status); // Debug log
      const data = await resp.json().catch(() => null);
      console.log("Duffel API data:", data); // Debug log
      if (data && data.ok && Array.isArray(data.airports)) {
        return data.airports;
      }
    } catch (e) {
      console.warn("Duffel airport search failed:", e);
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
          console.log("Airport selected:", a.city, a.code); // Debug log
          input.value = a.city + " (" + a.code + ")";
          input.setAttribute("data-airport-code", a.code);
          console.log("Set data-airport-code to:", a.code); // Debug log
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

      // Only use Duffel API
      let results = await searchDuffelAirports(q);

      // Only use API results - no local fallback
      render(results);
    }

    input.addEventListener("input", () => {
      const q = input.value.trim();

      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Only search with API calls for 2+ characters
      if (q.length >= 2) {
        searchTimeout = setTimeout(() => performSearch(q), 300);
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
    const inputs = Array.from(document.querySelectorAll("input[data-airport-input]"));
    inputs.forEach(initAirportSuggest);
  }

  function initTripTabs() {
    const tabs = Array.from(document.querySelectorAll(".tab[data-trip]"));
    if (!tabs.length) return;

    const multi = document.querySelector("[data-multicity]");
    const returnField = document.querySelector("[data-return-field]");

    function setMode(mode) {
      tabs.forEach((t) => {
        const isActive = t.getAttribute("data-trip") === mode;
        t.setAttribute("aria-selected", isActive ? "true" : "false");

        // Explicit Styling Management for Reliability
        if (isActive) {
          t.classList.remove("text-slate-500", "hover:text-slate-900", "hover:bg-white/50");
          t.classList.add("text-blue-600", "bg-blue-50/50");
        } else {
          t.classList.remove("text-blue-600", "bg-blue-50/50");
          t.classList.add("text-slate-500", "hover:text-slate-900", "hover:bg-white/50");
        }
      });

      if (returnField) {
        returnField.classList.toggle("hidden", mode !== "round");
        returnField.classList.toggle("block", mode === "round");
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
    console.log("Search form found:", !!form); // Debug log
    if (!form) return;

    // Set minimum dates to today
    const today = new Date().toISOString().split('T')[0];
    const departInput = form.querySelector("input[name='depart']");
    const returnInput = form.querySelector("input[name='return']");
    if (departInput) departInput.min = today;
    if (returnInput) returnInput.min = today;

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
      console.log("Form submitted"); // Debug log
      
      const mode = (readState().tripType || "round").toString();
      const payload = {
        tripType: mode,
        from: from ? from.value.trim() : "",
        to: to ? to.value.trim() : "",
        depart: depart ? depart.value : "",
        return: ret ? ret.value : "",
        cabin: cabin ? cabin.value : "Economy"
      };
      
      console.log("Form payload:", payload); // Debug log

      if (!payload.from || !payload.to) {
        console.log("Missing route validation failed"); // Debug log
        toast("Missing route", "Please choose a departure and destination airport.");
        return;
      }

      if (!payload.depart) {
        console.log("Missing date validation failed"); // Debug log
        toast("Missing date", "Please select a departure date.");
        return;
      }

      if (payload.tripType === "round" && !payload.return) {
        console.log("Missing return date validation failed"); // Debug log
        toast("Missing return date", "Select a return date or switch to one-way.");
        return;
      }

      console.log("Writing state and redirecting to results.html"); // Debug log
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
        travelClass: search.cabin || "Economy",
        currencyCode: "USD",
        max: 30
      };

      const resp = await fetch("http://localhost:3002/api/duffel-search", {
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
      console.error("Duffel API error:", e);
    }
    return [];
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
        empty.className = "bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm";
        empty.innerHTML = '<div class="text-lg font-medium text-slate-900 mb-2">No flights match your filters</div><div class="text-slate-500">Try increasing your max price or changing stops/airlines.</div>';
        listEl.appendChild(empty);
        return;
      }

      list.forEach((f) => {
        const card = document.createElement("div");
        card.className = "bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all overflow-hidden group";
        card.innerHTML =
          '<div class="p-5">' +
          '<div class="flex justify-between items-start mb-6">' +
          '<div class="flex items-center gap-4">' +
          '<div class="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm">' +
          (f.airline.logoUrl ? '<img src="' + f.airline.logoUrl + '" alt="' + f.airline.name + '" class="w-full h-full object-contain" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">' + 
            '<div class="w-full h-full items-center justify-center text-slate-900 font-medium" style="display:none;">' + f.airline.logo + '</div>' : 
            '<div class="w-full h-full flex items-center justify-center text-slate-900 font-medium">' + f.airline.logo + '</div>') +
          '</div>' +
          '<div>' +
          '<div class="font-medium text-slate-900">' + f.airline.name + '</div>' +
          '<div class="text-xs font-semibold text-slate-400 mt-0.5">' + (search.from || "ABC") + " → " + (search.to || "XYZ") + '</div>' +
          '</div>' +
          '</div>' +
          '<div class="text-right">' +
          '<div class="text-xl font-semibold text-green-600">' + money(f.price) + '</div>' +
          '<div class="text-xs text-slate-400 font-medium">per traveler</div>' +
          '</div>' +
          '</div>' + // end header

          '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">' +
          '<div class="bg-slate-50 rounded-lg p-2.5 text-center">' +
          '<div class="font-medium text-slate-700">' + f.departTime + '</div>' +
          '<div class="text-xs text-slate-400 font-medium">Depart</div>' +
          '</div>' +
          '<div class="bg-slate-50 rounded-lg p-2.5 text-center">' +
          '<div class="font-medium text-slate-700">' + f.arriveTime + '</div>' +
          '<div class="text-xs text-slate-400 font-medium">Arrive</div>' +
          '</div>' +
          '<div class="bg-slate-50 rounded-lg p-2.5 text-center">' +
          '<div class="font-medium text-slate-700">' + durationLabel(f.durationMin) + '</div>' +
          '<div class="text-xs text-slate-400 font-medium">Duration</div>' +
          '</div>' +
          '<div class="bg-slate-50 rounded-lg p-2.5 text-center">' +
          '<div class="font-medium text-slate-700">' + (f.stops === 0 ? "Non-stop" : f.stops + " stop" + (f.stops > 1 ? "s" : "")) + '</div>' +
          '<div class="text-xs text-slate-400 font-medium">Stops</div>' +
          '</div>' +
          '</div>' +
          '</div>' + // end body

          '<div class="bg-slate-50/50 border-t border-slate-100 p-3 flex justify-end">' +
          '<a class="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg transition-colors" href="#" data-flight-link>' +
          'Select Flight <i class="ph-bold ph-arrow-right"></i>' +
          '</a>' +
          '</div>';

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

      try {
        // Only use Duffel API
        flights = await fetchDuffelFlights(state, search);

        if (!flights || flights.length === 0) {
          toast("No flights found", "No flights available for this route and dates. Please try different airports or dates.");
          return;
        } else {
          toast("Duffel search successful", `Found ${flights.length} flights via Duffel API.`);
        }
      } catch (e) {
        console.error("API error:", e);
        const errorMsg = e && e.message ? e.message : "API request failed";
        toast("Search failed", errorMsg + ". Please try again later.");
        return;
      }

      // Only use real flight data - no demo fallback
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
    const airlineLogo = root.querySelector("[data-airline-logo]");
    const times = root.querySelector("[data-times]");
    const duration = root.querySelector("[data-duration]");
    const price = root.querySelector("[data-price]");

    if (airline) setText(airline, flight.airline.name);
    if (airlineLogo) {
      if (flight.airline.logoUrl) {
        airlineLogo.innerHTML = '<img src="' + flight.airline.logoUrl + '" alt="' + flight.airline.name + '" class="w-full h-full object-contain" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">' + 
          '<div class="w-full h-full flex items-center justify-center text-slate-900 font-medium" style="display:none;">' + flight.airline.logo + '</div>';
      } else {
        airlineLogo.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-900 font-medium">' + flight.airline.logo + '</div>';
      }
    }
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
      wrap.className = "bg-white rounded-2xl border border-slate-200 shadow-sm p-6";
      wrap.innerHTML =
        '<div class="font-medium text-lg text-slate-900 mb-2">Traveler ' + (i + 1) + '</div>' +
        '<div class="text-xs text-slate-500 font-medium mb-6">Enter details exactly as they appear on the travel document.</div>' +
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">' +
        '<div><label class="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">First Name</label><input class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-green-500 outline-none" name="firstName" placeholder="e.g., Amina" required></div>' +
        '<div><label class="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Last Name</label><input class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-green-500 outline-none" name="lastName" placeholder="e.g., Hassan" required></div>' +
        '<div><label class="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Date of Birth</label><input class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-green-500 outline-none" name="dob" type="date" required></div>' +
        '<div><label class="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Passport / ID</label><input class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-green-500 outline-none" name="doc" placeholder="Passport Number" required></div>' +
        '</div>';
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
