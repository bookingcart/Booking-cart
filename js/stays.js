(function () {
  const STORAGE_KEY = "bookingcart_stays_v1";

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function writeState(patch) {
    const current = readState();
    const next = Object.assign({}, current, patch);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function setText(el, text) {
    if (!el) return;
    el.textContent = text;
  }

  function money(n) {
    const v = Number(n || 0);
    return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function getQuery() {
    const params = new URLSearchParams(window.location.search);
    const obj = {};
    params.forEach((v, k) => {
      obj[k] = v;
    });
    return obj;
  }

  function ensureToast() {
    let toast = document.querySelector(".toast");
    if (toast) return toast;
    toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = '<p class="toast__title" id="toastTitle"></p><p class="toast__desc" id="toastDesc"></p>';
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
    }, 2800);
  }

  function nightsBetween(checkIn, checkOut) {
    const a = new Date(checkIn);
    const b = new Date(checkOut);
    if (!checkIn || !checkOut || Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    const diff = b.getTime() - a.getTime();
    const nights = Math.round(diff / (1000 * 60 * 60 * 24));
    return nights;
  }

  function todayIso() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function svgPlaceholder(label, hue) {
    const safe = encodeURIComponent(String(label || "Hotel"));
    const bg = encodeURIComponent(`hsl(${hue}, 70%, 94%)`);
    const fg = encodeURIComponent(`hsl(${hue}, 45%, 24%)`);
    return `data:image/svg+xml;utf8,` +
      `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>` +
      `<defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>` +
      `<stop offset='0' stop-color='${bg}'/>` +
      `<stop offset='1' stop-color='white'/>` +
      `</linearGradient></defs>` +
      `<rect width='1200' height='800' fill='url(%23g)'/>` +
      `<circle cx='920' cy='240' r='140' fill='rgba(14,165,166,.18)'/>` +
      `<circle cx='980' cy='280' r='80' fill='rgba(59,130,246,.15)'/>` +
      `<text x='70' y='140' font-family='Arial' font-size='54' fill='${fg}'>${safe}</text>` +
      `<text x='70' y='210' font-family='Arial' font-size='28' fill='rgba(11,43,58,.6)'>Stays preview</text>` +
      `</svg>`;
  }

  const DESTINATIONS = [
    { name: "Dubai", hint: "United Arab Emirates" },
    { name: "Nairobi", hint: "Kenya" },
    { name: "London", hint: "United Kingdom" },
    { name: "Paris", hint: "France" },
    { name: "New York", hint: "United States" },
    { name: "Mombasa", hint: "Kenya" },
    { name: "Zanzibar", hint: "Tanzania" },
    { name: "Cape Town", hint: "South Africa" }
  ];

  const HOTELS = [
    {
      id: "h1",
      name: "Harborview Grand Hotel",
      stars: 5,
      city: "Dubai",
      address: "Dubai Marina, Dubai, UAE",
      distanceKm: 1.2,
      rating: 9.2,
      reviews: 1894,
      propertyType: "Hotel",
      amenities: ["wifi", "breakfast", "pool", "parking"],
      tags: ["Free cancellation", "Pay at hotel"],
      images: [svgPlaceholder("Harborview Grand", 200), svgPlaceholder("Lobby", 190), svgPlaceholder("Pool", 180)],
      description: "A modern waterfront stay with skyline views, spacious rooms, and premium amenities.",
      houseRules: ["No smoking", "Quiet hours 10pm–7am", "ID required at check-in"],
      policies: { checkIn: "From 15:00", checkOut: "Until 11:00", cancellation: "Free cancellation up to 24 hours before check-in." },
      rooms: [
        { id: "r1", name: "Deluxe King", bed: "1 King bed", maxGuests: 2, cancellation: "Free cancellation", payAtHotel: true, pricePerNight: 189 },
        { id: "r2", name: "Family Suite", bed: "1 King + 2 Twins", maxGuests: 4, cancellation: "Free cancellation", payAtHotel: false, pricePerNight: 259 }
      ]
    },
    {
      id: "h2",
      name: "CityCenter Boutique",
      stars: 4,
      city: "London",
      address: "Soho, London, UK",
      distanceKm: 0.6,
      rating: 8.7,
      reviews: 742,
      propertyType: "Hotel",
      amenities: ["wifi", "breakfast"],
      tags: ["Free cancellation"],
      images: [svgPlaceholder("CityCenter Boutique", 210), svgPlaceholder("Room", 205), svgPlaceholder("Breakfast", 200)],
      description: "Compact luxury in the heart of the city. Walkable to major attractions and transit.",
      houseRules: ["No parties", "Pets not allowed"],
      policies: { checkIn: "From 14:00", checkOut: "Until 12:00", cancellation: "Free cancellation up to 48 hours before check-in." },
      rooms: [
        { id: "r1", name: "Standard Queen", bed: "1 Queen bed", maxGuests: 2, cancellation: "Free cancellation", payAtHotel: false, pricePerNight: 149 },
        { id: "r2", name: "City View Double", bed: "1 Double bed", maxGuests: 2, cancellation: "Non-refundable", payAtHotel: false, pricePerNight: 129 }
      ]
    },
    {
      id: "h3",
      name: "Seaside Apartments",
      stars: 3,
      city: "Zanzibar",
      address: "Nungwi Beach, Zanzibar",
      distanceKm: 4.8,
      rating: 9.0,
      reviews: 512,
      propertyType: "Apartment",
      amenities: ["wifi", "pool", "parking"],
      tags: ["Pay at hotel"],
      images: [svgPlaceholder("Seaside Apartments", 175), svgPlaceholder("Balcony", 170), svgPlaceholder("Beach", 165)],
      description: "Beachfront apartment-style stays with kitchenette and relaxed island vibes.",
      houseRules: ["Respect neighbors", "No loud music after 9pm"],
      policies: { checkIn: "From 13:00", checkOut: "Until 10:00", cancellation: "Free cancellation up to 72 hours before check-in." },
      rooms: [
        { id: "r1", name: "Studio", bed: "1 Queen bed", maxGuests: 2, cancellation: "Free cancellation", payAtHotel: true, pricePerNight: 88 },
        { id: "r2", name: "Two-bedroom", bed: "2 Queen beds", maxGuests: 4, cancellation: "Free cancellation", payAtHotel: true, pricePerNight: 132 }
      ]
    },
    {
      id: "h4",
      name: "Parkside Lodge",
      stars: 4,
      city: "Nairobi",
      address: "Westlands, Nairobi, Kenya",
      distanceKm: 2.4,
      rating: 8.4,
      reviews: 391,
      propertyType: "Lodge",
      amenities: ["wifi", "parking"],
      tags: ["Free cancellation", "Pay at hotel"],
      images: [svgPlaceholder("Parkside Lodge", 185), svgPlaceholder("Garden", 178), svgPlaceholder("Suite", 172)],
      description: "A quiet, secure lodge near the city with garden views and easy airport access.",
      houseRules: ["No smoking", "Pets allowed on request"],
      policies: { checkIn: "From 12:00", checkOut: "Until 11:00", cancellation: "Free cancellation up to 24 hours before check-in." },
      rooms: [
        { id: "r1", name: "Comfort Double", bed: "1 Double bed", maxGuests: 2, cancellation: "Free cancellation", payAtHotel: true, pricePerNight: 74 },
        { id: "r2", name: "Premium King", bed: "1 King bed", maxGuests: 2, cancellation: "Free cancellation", payAtHotel: false, pricePerNight: 102 }
      ]
    }
  ];

  function initDestSuggest(root) {
    const input = root.querySelector("[data-dest-input]");
    const list = root.querySelector("[data-dest-list]");
    if (!input || !list) return;

    function close() {
      list.innerHTML = "";
      list.style.display = "none";
    }

    function open(items) {
      list.innerHTML = "";
      items.forEach((d) => {
        const li = document.createElement("li");
        li.className = "suggest__item";
        li.setAttribute("role", "option");
        li.innerHTML = `<div style='font-weight:850'>${d.name}</div><div class='small'>${d.hint}</div>`;
        li.addEventListener("mousedown", (e) => {
          e.preventDefault();
          input.value = d.name;
          close();
        });
        list.appendChild(li);
      });
      list.style.display = items.length ? "block" : "none";
    }

    input.addEventListener("input", () => {
      const q = String(input.value || "").trim().toLowerCase();
      if (!q) return close();
      const items = DESTINATIONS.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 7);
      open(items);
    });

    input.addEventListener("blur", () => {
      window.setTimeout(close, 120);
    });
  }

  function initGuests(root) {
    const wrap = root.querySelector("[data-guests]");
    const trigger = root.querySelector("[data-guests-trigger]");
    const panel = root.querySelector("[data-guests-panel]");
    if (!wrap || !trigger || !panel) return;

    const state = readState();
    const current = state.guests || { adults: 2, children: 0, rooms: 1 };

    function setCounts(next) {
      const a = clamp(Number(next.adults || 0), 1, 12);
      const c = clamp(Number(next.children || 0), 0, 10);
      const r = clamp(Number(next.rooms || 0), 1, 8);
      writeState({ guests: { adults: a, children: c, rooms: r } });
      setText(panel.querySelector("[data-count='adults']"), String(a));
      setText(panel.querySelector("[data-count='children']"), String(c));
      setText(panel.querySelector("[data-count='rooms']"), String(r));
      trigger.textContent = `${a} adult${a === 1 ? "" : "s"} • ${c} child${c === 1 ? "" : "ren"} • ${r} room${r === 1 ? "" : "s"}`;
    }

    setCounts(current);

    trigger.addEventListener("click", () => {
      const open = wrap.getAttribute("data-open") === "true";
      wrap.setAttribute("data-open", open ? "false" : "true");
    });

    panel.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-plus], button[data-minus]");
      if (!btn) return;
      const kind = btn.getAttribute("data-plus") || btn.getAttribute("data-minus");
      const delta = btn.hasAttribute("data-plus") ? 1 : -1;
      const st = readState();
      const g = st.guests || { adults: 2, children: 0, rooms: 1 };
      const next = Object.assign({}, g);
      next[kind] = Number(next[kind] || 0) + delta;
      setCounts(next);
    });

    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) wrap.setAttribute("data-open", "false");
    });
  }

  function initStaySearch() {
    const root = document.querySelector("[data-stays-search]");
    if (!root) return;

    initDestSuggest(root);
    initGuests(root);

    const form = root.querySelector("form[data-stays-form]");
    if (!form) return;

    const dest = form.querySelector("input[name='destination']");
    const checkIn = form.querySelector("input[name='checkIn']");
    const checkOut = form.querySelector("input[name='checkOut']");

    const min = todayIso();
    if (checkIn) checkIn.min = min;
    if (checkOut) checkOut.min = min;

    function validateDates() {
      const inVal = checkIn ? String(checkIn.value || "") : "";
      const outVal = checkOut ? String(checkOut.value || "") : "";
      if (!inVal || !outVal) return { ok: true };
      const nights = nightsBetween(inVal, outVal);
      if (nights < 1) {
        return { ok: false, msg: "Check-out must be at least 1 night after check-in." };
      }
      return { ok: true };
    }

    if (checkIn)
      checkIn.addEventListener("change", () => {
        const inVal = String(checkIn.value || "");
        if (!inVal) return;
        const d = new Date(inVal);
        d.setDate(d.getDate() + 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const minOut = `${yyyy}-${mm}-${dd}`;
        if (checkOut) {
          checkOut.min = minOut;
          if (String(checkOut.value || "") && String(checkOut.value) < minOut) checkOut.value = "";
        }
      });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = String(dest ? dest.value : "").trim();
      if (!d) {
        toast("Destination required", "Enter a city, hotel name, or landmark.");
        return;
      }
      const inVal = String(checkIn ? checkIn.value : "");
      const outVal = String(checkOut ? checkOut.value : "");
      if (!inVal || !outVal) {
        toast("Dates required", "Choose check-in and check-out dates.");
        return;
      }
      const v = validateDates();
      if (!v.ok) {
        toast("Invalid dates", v.msg);
        return;
      }
      const st = readState();
      const guests = st.guests || { adults: 2, children: 0, rooms: 1 };
      writeState({
        search: { destination: d, checkIn: inVal, checkOut: outVal },
        guests,
        selectedHotelId: "",
        selectedRoomId: "",
        booking: null
      });
      window.location.href = "stays-results.html";
    });
  }

  function initSuggestions() {
    const root = document.querySelector("[data-stays-suggestions]");
    if (!root) return;

    const topBookedEl = root.querySelector("[data-top-booked]");
    const topLocationsEl = root.querySelector("[data-top-locations]");
    if (!topBookedEl && !topLocationsEl) return;

    const searchRoot = document.querySelector("[data-stays-search]");
    const destInput = searchRoot ? searchRoot.querySelector("input[name='destination']") : null;
    const checkIn = searchRoot ? searchRoot.querySelector("input[name='checkIn']") : null;
    const checkOut = searchRoot ? searchRoot.querySelector("input[name='checkOut']") : null;

    function assetUrl(relPath) {
      try {
        return new URL(relPath, window.location.href).toString();
      } catch {
        return relPath;
      }
    }

    const FALLBACK_PHOTO = assetUrl("images/stays.png");
    const PROMO_PHOTOS = [assetUrl("images/stays.png"), assetUrl("images/hero-bg.jpg")];

    function promoPhoto(seed) {
      const idx = Math.abs(Number(seed || 0)) % PROMO_PHOTOS.length;
      return PROMO_PHOTOS[idx] || FALLBACK_PHOTO;
    }

    function setImgWithFallback(imgEl, sources) {
      if (!imgEl) return;
      const list = (sources || []).filter(Boolean);
      let i = 0;

      function set() {
        if (i >= list.length) return;
        imgEl.src = list[i];
      }

      imgEl.addEventListener("error", () => {
        i += 1;
        set();
      });

      set();
    }

    function bindCard(el, onActivate) {
      if (!el) return;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        onActivate();
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      });
    }

    if (topBookedEl) {
      const items = HOTELS.slice().sort((a, b) => Number(b.reviews || 0) - Number(a.reviews || 0)).slice(0, 6);
      topBookedEl.innerHTML = "";
      items.forEach((h) => {
        const topImg = promoPhoto(String(h.id || "").length + Number(h.stars || 0));
        const from = ((h.rooms || [])[0] || {}).pricePerNight || 0;

        const card = document.createElement("div");
        card.className = "suggest-card";
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.innerHTML =
          `<div class='suggest-card__media'>
             <img src='${topImg}' alt='${h.name}' loading='lazy'/>
             <div class='suggest-card__overlay'>
               <div class='pill pill--info' style='font-size:12px;padding:6px 10px'>${Number(h.rating || 0).toFixed(1)}</div>
             </div>
           </div>
           <div class='suggest-card__body'>
             <div class='kpi suggest-card__title'>${h.name}</div>
             <div class='suggest-card__hint'>${h.city} • ${renderStars(h.stars)} • From ${money(from)} / night</div>
             <div class='small'>${h.reviews} reviews</div>
           </div>`;

        const imgEl = card.querySelector("img");
        const hotelImg = (h.images || [])[0];
        setImgWithFallback(imgEl, [hotelImg, topImg, FALLBACK_PHOTO]);

        bindCard(card, () => {
          window.location.href = `stays-details.html?hotel=${encodeURIComponent(h.id)}`;
        });

        topBookedEl.appendChild(card);
      });
    }

    if (topLocationsEl) {
      const picked = DESTINATIONS.slice(0, 6);
      topLocationsEl.innerHTML = "";
      picked.forEach((d, idx) => {
        const img = promoPhoto(idx + 1);

        const card = document.createElement("div");
        card.className = "suggest-card";
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.innerHTML =
          `<div class='suggest-card__media'>
             <img src='${img}' alt='${d.name}' loading='lazy'/>
             <div class='suggest-card__overlay'>
               <div class='pill' style='font-size:12px;padding:6px 10px'>Top location</div>
             </div>
           </div>
           <div class='suggest-card__body'>
             <div class='kpi suggest-card__title'>${d.name}</div>
             <div class='suggest-card__hint'>${d.hint}</div>
             <div class='small'>Tap to search stays in ${d.name}</div>
           </div>`;

        const imgEl = card.querySelector("img");
        setImgWithFallback(imgEl, [img, FALLBACK_PHOTO]);

        bindCard(card, () => {
          if (destInput) destInput.value = d.name;
          if (checkIn && !String(checkIn.value || "")) checkIn.focus();
          else if (checkOut && !String(checkOut.value || "")) checkOut.focus();
          else toast("Destination selected", `Search stays in ${d.name} when you're ready.`);
          if (searchRoot) searchRoot.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        topLocationsEl.appendChild(card);
      });
    }
  }

  function renderStars(n) {
    const count = clamp(Number(n || 0), 0, 5);
    return "★".repeat(count) + "☆".repeat(Math.max(0, 5 - count));
  }

  function initResults() {
    const root = document.querySelector("[data-stays-results]");
    if (!root) return;

    const state = readState();
    const search = state.search || {};
    const guests = state.guests || { adults: 2, children: 0, rooms: 1 };
    const nights = nightsBetween(search.checkIn, search.checkOut);

    const routeEl = root.querySelector("[data-stays-route]");
    const metaEl = root.querySelector("[data-stays-meta]");
    if (routeEl) setText(routeEl, search.destination ? `${search.destination}` : "Stays");
    if (metaEl) setText(metaEl, nights ? `${search.checkIn} → ${search.checkOut} • ${nights} night${nights === 1 ? "" : "s"} • ${guests.rooms} room${guests.rooms === 1 ? "" : "s"}` : "Choose dates to continue");

    const listEl = root.querySelector("[data-hotel-list]");
    if (!listEl) return;

    const filter = {
      maxPrice: 450,
      stars: new Set(["3", "4", "5"]),
      minRating: 0,
      amenities: new Set(),
      types: new Set(["Hotel", "Apartment", "Lodge"]),
      sort: "popularity"
    };

    const maxPriceEl = root.querySelector("input[name='maxPrice']");
    const minRatingEl = root.querySelector("input[name='minRating']");
    const sortEl = root.querySelector("select[name='sort']");

    if (maxPriceEl) {
      maxPriceEl.value = String(filter.maxPrice);
      maxPriceEl.addEventListener("input", () => {
        filter.maxPrice = Number(maxPriceEl.value || 0);
        render();
      });
    }

    if (minRatingEl) {
      minRatingEl.value = String(filter.minRating);
      minRatingEl.addEventListener("input", () => {
        filter.minRating = Number(minRatingEl.value || 0);
        render();
      });
    }

    if (sortEl) {
      sortEl.value = filter.sort;
      sortEl.addEventListener("change", () => {
        filter.sort = String(sortEl.value || "popularity");
        render();
      });
    }

    root.querySelectorAll("input[name='stars']").forEach((cb) => {
      cb.addEventListener("change", () => {
        const v = String(cb.value || "");
        if (cb.checked) filter.stars.add(v);
        else filter.stars.delete(v);
        render();
      });
    });

    root.querySelectorAll("input[name='amenities']").forEach((cb) => {
      cb.addEventListener("change", () => {
        const v = String(cb.value || "");
        if (cb.checked) filter.amenities.add(v);
        else filter.amenities.delete(v);
        render();
      });
    });

    root.querySelectorAll("input[name='type']").forEach((cb) => {
      cb.addEventListener("change", () => {
        const v = String(cb.value || "");
        if (cb.checked) filter.types.add(v);
        else filter.types.delete(v);
        render();
      });
    });

    function priceFor(h) {
      const r = (h.rooms || [])[0];
      const nightly = r ? Number(r.pricePerNight || 0) : 0;
      const total = nightly * Math.max(1, nights || 1) * Math.max(1, guests.rooms || 1);
      return { nightly, total };
    }

    function matches(h) {
      const q = String(search.destination || "").trim().toLowerCase();
      const qOk = !q || h.city.toLowerCase().includes(q) || h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q);
      if (!qOk) return false;
      if (!filter.types.has(h.propertyType)) return false;
      if (!filter.stars.has(String(h.stars))) return false;
      if (Number(h.rating || 0) < Number(filter.minRating || 0)) return false;
      const p = priceFor(h);
      if (p.nightly > filter.maxPrice) return false;
      for (const a of filter.amenities) {
        if (!h.amenities.includes(a)) return false;
      }
      return true;
    }

    function sortHotels(items) {
      const copy = items.slice();
      if (filter.sort === "price") {
        copy.sort((a, b) => priceFor(a).nightly - priceFor(b).nightly);
      } else if (filter.sort === "rating") {
        copy.sort((a, b) => Number(b.rating) - Number(a.rating));
      } else {
        copy.sort((a, b) => Number(b.reviews) - Number(a.reviews));
      }
      return copy;
    }

    function amenityLabel(a) {
      if (a === "wifi") return "Wi‑Fi";
      if (a === "breakfast") return "Breakfast";
      if (a === "parking") return "Parking";
      if (a === "pool") return "Pool";
      return a;
    }

    function buildCard(h) {
      const prices = priceFor(h);
      const topImg = (h.images || [])[0] || svgPlaceholder(h.name, 200);
      const tagHtml = (h.tags || []).slice(0, 2).map((t) => `<span class='pill pill--info'>${t}</span>`).join("");
      const roomPreview = (h.rooms || [])[0] ? (h.rooms[0].name + " • " + h.rooms[0].bed) : "Room options available";
      const amenities = (h.amenities || []).slice(0, 4).map((a) => `<span class='pill'>${amenityLabel(a)}</span>`).join("");

      const el = document.createElement("article");
      el.className = "hotel-card";
      el.innerHTML =
        `<div class='hotel-card__media' data-carousel>
          <img class='hotel-card__img' src='${topImg}' alt='${h.name}' loading='lazy'/>
          <div class='carousel__nav'>
            <button class='icon-btn' type='button' data-carousel-prev aria-label='Previous image'>‹</button>
            <button class='icon-btn' type='button' data-carousel-next aria-label='Next image'>›</button>
          </div>
        </div>
        <div class='hotel-card__body'>
          <div class='row space' style='gap:10px;flex-wrap:wrap'>
            <div>
              <div class='kpi' style='font-size:18px'>${h.name}</div>
              <div class='small' style='margin-top:4px'>${renderStars(h.stars)} • ${h.propertyType}</div>
              <div class='muted' style='margin-top:6px'>${h.address} • ${h.distanceKm.toFixed(1)} km from center</div>
            </div>
            <div class='rating-badge' aria-label='Guest rating'>
              <div class='kpi' style='font-size:16px'>${Number(h.rating).toFixed(1)}</div>
              <div class='small'>${h.reviews} reviews</div>
            </div>
          </div>

          <div class='row' style='gap:8px;flex-wrap:wrap;margin-top:10px'>${tagHtml}</div>

          <div class='small' style='margin-top:10px'>${roomPreview}</div>

          <div class='row' style='gap:8px;flex-wrap:wrap;margin-top:10px'>${amenities}</div>

          <div class='hr'></div>

          <div class='row space' style='flex-wrap:wrap'>
            <div>
              <div class='small'>From</div>
              <div class='price' style='font-size:20px'>${money(prices.nightly)} <span class='small'>/ night</span></div>
              <div class='muted' style='margin-top:6px'>Total: ${money(prices.total)}</div>
            </div>
            <div class='row' style='gap:10px;flex-wrap:wrap;justify-content:flex-end'>
              <a class='btn btn-secondary' href='stays-details.html?hotel=${encodeURIComponent(h.id)}'>View details</a>
            </div>
          </div>
        </div>`;

      const media = el.querySelector("[data-carousel]");
      const imgEl = el.querySelector("img.hotel-card__img");
      const prev = el.querySelector("[data-carousel-prev]");
      const next = el.querySelector("[data-carousel-next]");
      const imgs = Array.isArray(h.images) && h.images.length ? h.images : [topImg];
      let idx = 0;

      function update() {
        if (imgEl) imgEl.src = imgs[idx];
      }

      if (prev)
        prev.addEventListener("click", () => {
          idx = (idx - 1 + imgs.length) % imgs.length;
          update();
        });
      if (next)
        next.addEventListener("click", () => {
          idx = (idx + 1) % imgs.length;
          update();
        });

      if (media)
        media.addEventListener("click", (e) => {
          const a = e.target.closest("a");
          if (a) return;
        });

      return el;
    }

    function render() {
      const items = sortHotels(HOTELS.filter(matches));
      listEl.innerHTML = "";
      if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "card";
        empty.innerHTML = `<div class='card__body'><div class='kpi'>No stays found</div><div class='muted' style='margin-top:6px'>Try changing filters, dates, or destination.</div></div>`;
        listEl.appendChild(empty);
        return;
      }
      items.forEach((h) => listEl.appendChild(buildCard(h)));
    }

    render();
  }

  function initDetails() {
    const root = document.querySelector("[data-stays-details]");
    if (!root) return;

    const q = getQuery();
    const id = String(q.hotel || "").trim();
    const hotel = HOTELS.find((h) => h.id === id) || HOTELS[0];
    if (!hotel) return;

    writeState({ selectedHotelId: hotel.id, selectedRoomId: "" });

    const titleEl = root.querySelector("[data-hotel-name]");
    const subEl = root.querySelector("[data-hotel-sub]");
    const ratingEl = root.querySelector("[data-hotel-rating]");
    const addrEl = root.querySelector("[data-hotel-address]");
    const gallery = root.querySelector("[data-hotel-gallery]");
    const amenityEl = root.querySelector("[data-hotel-amenities]");
    const descEl = root.querySelector("[data-hotel-desc]");
    const rulesEl = root.querySelector("[data-hotel-rules]");
    const polEl = root.querySelector("[data-hotel-policies]");
    const roomEl = root.querySelector("[data-room-list]");

    if (titleEl) setText(titleEl, hotel.name);
    if (subEl) setText(subEl, `${renderStars(hotel.stars)} • ${hotel.propertyType}`);
    if (ratingEl) setText(ratingEl, `${hotel.rating.toFixed(1)} • ${hotel.reviews} reviews`);
    if (addrEl) setText(addrEl, `${hotel.address} • ${hotel.distanceKm.toFixed(1)} km from center`);

    if (gallery) {
      gallery.innerHTML = "";
      (hotel.images || []).slice(0, 6).forEach((src) => {
        const img = document.createElement("img");
        img.src = src;
        img.loading = "lazy";
        img.alt = hotel.name;
        img.className = "gallery__img";
        gallery.appendChild(img);
      });
    }

    function amenityLabel(a) {
      if (a === "wifi") return "Wi‑Fi";
      if (a === "breakfast") return "Breakfast included";
      if (a === "parking") return "Parking";
      if (a === "pool") return "Pool";
      return a;
    }

    if (amenityEl) {
      amenityEl.innerHTML = (hotel.amenities || []).map((a) => `<span class='pill'>${amenityLabel(a)}</span>`).join("");
    }

    if (descEl) setText(descEl, hotel.description || "");

    if (rulesEl) {
      rulesEl.innerHTML = (hotel.houseRules || []).map((r) => `<div class='row space' style='flex-wrap:wrap'><div class='muted' style='font-weight:850'>Rule</div><div class='kpi'>${r}</div></div>`).join("<div class='hr'></div>");
    }

    if (polEl) {
      const p = hotel.policies || {};
      polEl.innerHTML =
        `<div class='row space' style='flex-wrap:wrap'><div class='muted' style='font-weight:850'>Check-in</div><div class='kpi'>${p.checkIn || "—"}</div></div>
         <div class='hr'></div>
         <div class='row space' style='flex-wrap:wrap'><div class='muted' style='font-weight:850'>Check-out</div><div class='kpi'>${p.checkOut || "—"}</div></div>
         <div class='hr'></div>
         <div class='row space' style='flex-wrap:wrap'><div class='muted' style='font-weight:850'>Cancellation</div><div class='kpi'>${p.cancellation || "—"}</div></div>`;
    }

    const st = readState();
    const search = st.search || {};
    const guests = st.guests || { adults: 2, children: 0, rooms: 1 };
    const nights = nightsBetween(search.checkIn, search.checkOut);

    function priceRow(room) {
      const nightly = Number(room.pricePerNight || 0);
      const total = nightly * Math.max(1, nights || 1) * Math.max(1, guests.rooms || 1);
      return { nightly, total };
    }

    if (roomEl) {
      roomEl.innerHTML = "";
      (hotel.rooms || []).forEach((r) => {
        const p = priceRow(r);
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML =
          `<div class='card__body'>
            <div class='row space' style='flex-wrap:wrap'>
              <div>
                <div class='kpi'>${r.name}</div>
                <div class='muted' style='margin-top:6px'>${r.bed} • Max ${r.maxGuests} guest${r.maxGuests === 1 ? "" : "s"}</div>
                <div class='row' style='gap:8px;flex-wrap:wrap;margin-top:10px'>
                  <span class='pill pill--info'>${r.cancellation}</span>
                  ${r.payAtHotel ? "<span class='pill pill--info'>Pay at hotel</span>" : ""}
                </div>
              </div>
              <div style='text-align:right'>
                <div class='small'>From</div>
                <div class='price' style='font-size:20px'>${money(p.nightly)} <span class='small'>/ night</span></div>
                <div class='muted' style='margin-top:6px'>Total: ${money(p.total)}</div>
                <div style='margin-top:10px'>
                  <a class='btn btn-primary' href='#' data-select-room='${r.id}' style='display:inline-flex;align-items:center;justify-content:center'>Select room</a>
                </div>
              </div>
            </div>
          </div>`;
        card.querySelector("[data-select-room]").addEventListener("click", (e) => {
          e.preventDefault();
          writeState({ selectedHotelId: hotel.id, selectedRoomId: r.id });
          window.location.href = "stays-checkout.html";
        });
        roomEl.appendChild(card);
      });
    }

    const mapEl = root.querySelector("[data-map]");
    if (mapEl) {
      mapEl.innerHTML =
        `<div class='map-preview'>
          <div class='map-preview__pin'></div>
          <div class='map-preview__meta'>${hotel.city}</div>
        </div>`;
    }
  }

  function initCheckout() {
    const root = document.querySelector("[data-stays-checkout]");
    if (!root) return;

    const st = readState();
    const search = st.search || {};
    const guests = st.guests || { adults: 2, children: 0, rooms: 1 };
    const nights = nightsBetween(search.checkIn, search.checkOut);

    const hotel = HOTELS.find((h) => h.id === st.selectedHotelId);
    if (!hotel) {
      toast("Missing selection", "Select a hotel first.");
      window.location.href = "stays-results.html";
      return;
    }
    const room = (hotel.rooms || []).find((r) => r.id === st.selectedRoomId) || (hotel.rooms || [])[0];
    if (!room) {
      toast("Missing room", "Select a room to continue.");
      window.location.href = `stays-details.html?hotel=${encodeURIComponent(hotel.id)}`;
      return;
    }

    const nightly = Number(room.pricePerNight || 0);
    const subtotal = nightly * Math.max(1, nights || 1) * Math.max(1, guests.rooms || 1);
    const taxes = Math.round(subtotal * 0.12);
    const total = subtotal + taxes;

    setText(root.querySelector("[data-sum-hotel]"), hotel.name);
    setText(root.querySelector("[data-sum-room]"), room.name);
    setText(root.querySelector("[data-sum-dates]"), `${search.checkIn} → ${search.checkOut} (${Math.max(1, nights)} night${nights === 1 ? "" : "s"})`);
    setText(root.querySelector("[data-sum-guests]"), `${guests.adults} adult${guests.adults === 1 ? "" : "s"}, ${guests.children} child${guests.children === 1 ? "" : "ren"} • ${guests.rooms} room${guests.rooms === 1 ? "" : "s"}`);

    setText(root.querySelector("[data-sum-nightly]"), money(nightly));
    setText(root.querySelector("[data-sum-taxes]"), money(taxes));
    setText(root.querySelector("[data-sum-total]"), money(total));

    const payEl = root.querySelector("[data-pay-options]");
    if (payEl) {
      const canPayAtHotel = !!room.payAtHotel;
      const payAtHotelRow = canPayAtHotel
        ? `<label class='row' style='gap:10px;align-items:flex-start'>
            <input type='radio' name='paymentMethod' value='hotel' />
            <div>
              <div style='font-weight:850'>Pay at hotel</div>
              <div class='small'>Pay during check‑in (subject to property policy).</div>
            </div>
          </label>`
        : "";

      payEl.innerHTML =
        `<div style='display:grid;gap:10px'>
          <label class='row' style='gap:10px;align-items:flex-start'>
            <input type='radio' name='paymentMethod' value='card' checked />
            <div>
              <div style='font-weight:850'>Credit / Debit card</div>
              <div class='small'>Secure payment (UI demo).</div>
            </div>
          </label>
          <label class='row' style='gap:10px;align-items:flex-start'>
            <input type='radio' name='paymentMethod' value='mobile' />
            <div>
              <div style='font-weight:850'>Mobile money</div>
              <div class='small'>Optional payment method (UI demo).</div>
            </div>
          </label>
          ${payAtHotelRow}
        </div>`;
    }

    const form = root.querySelector("form[data-stays-checkout-form]");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const fullName = String((form.querySelector("input[name='fullName']") || {}).value || "").trim();
      const email = String((form.querySelector("input[name='email']") || {}).value || "").trim();
      const phone = String((form.querySelector("input[name='phone']") || {}).value || "").trim();
      const requests = String((form.querySelector("textarea[name='requests']") || {}).value || "").trim();
      const terms = !!(form.querySelector("input[name='terms']") || {}).checked;
      const methodEl = form.querySelector("input[name='paymentMethod']:checked");
      const method = methodEl ? String(methodEl.value || "card") : "card";

      if (!fullName) {
        toast("Guest details", "Enter your full name.");
        return;
      }
      if (!email) {
        toast("Guest details", "Enter a valid email.");
        return;
      }
      if (!terms) {
        toast("Terms required", "Please accept Terms & Conditions to continue.");
        return;
      }

      const ref = "ST" + Math.random().toString(36).slice(2, 10).toUpperCase();
      const paymentStatus = method === "hotel" ? "Pay at hotel" : "Paid (demo)";

      const booking = {
        ref,
        hotelId: hotel.id,
        roomId: room.id,
        search,
        guests,
        totals: { nightly, subtotal, taxes, total },
        guest: { fullName, email, phone, requests },
        payment: { method, status: paymentStatus },
        cancellation: room.cancellation
      };

      writeState({ booking });
      window.location.href = "stays-confirmation.html";
    });
  }

  function initStayConfirmation() {
    const root = document.querySelector("[data-stays-confirmation]");
    if (!root) return;

    const st = readState();
    const booking = st.booking;
    if (!booking) {
      toast("No booking", "Start a new stay search to continue.");
      window.location.href = "stays.html";
      return;
    }

    const hotel = HOTELS.find((h) => h.id === booking.hotelId);
    const room = hotel ? (hotel.rooms || []).find((r) => r.id === booking.roomId) : null;

    setText(root.querySelector("[data-confirm-ref]"), booking.ref);
    setText(root.querySelector("[data-confirm-hotel]"), hotel ? hotel.name : "—");
    setText(root.querySelector("[data-confirm-room]"), room ? room.name : "—");
    setText(root.querySelector("[data-confirm-dates]"), `${booking.search.checkIn} → ${booking.search.checkOut}`);
    setText(root.querySelector("[data-confirm-payment]"), booking.payment.status);
    setText(root.querySelector("[data-confirm-policy]"), booking.cancellation);
    setText(root.querySelector("[data-confirm-total]"), money(booking.totals.total));

    const download = root.querySelector("[data-download-receipt]");
    if (download)
      download.addEventListener("click", (e) => {
        e.preventDefault();
        const lines = [];
        lines.push("BookingCart Stays Receipt");
        lines.push("Confirmation: " + booking.ref);
        lines.push("Hotel: " + (hotel ? hotel.name : ""));
        lines.push("Room: " + (room ? room.name : ""));
        lines.push("Dates: " + booking.search.checkIn + " -> " + booking.search.checkOut);
        lines.push("Payment: " + booking.payment.status);
        lines.push("Total: " + money(booking.totals.total));
        lines.push("Guest: " + booking.guest.fullName + " (" + booking.guest.email + ")");
        lines.push("Cancellation: " + booking.cancellation);

        const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "stays-receipt-" + booking.ref + ".txt";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });

    const support = root.querySelector("[data-contact-support]");
    if (support)
      support.addEventListener("click", (e) => {
        e.preventDefault();
        toast("Support", "Demo: support contact flow can be added next.");
      });
  }

  function init() {
    initStaySearch();
    initSuggestions();
    initResults();
    initDetails();
    initCheckout();
    initStayConfirmation();
  }

  init();
})();
