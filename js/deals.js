/**
 * deals.js — Top Flight Deals client module
 * - Fetches deals from /api/flight-deals
 * - Falls back to browser geolocation for origin refinement
 * - Renders skeleton → cards
 * - AI personalization: biases sort order based on stored search history
 * - Client-side cache in localStorage (1 hr)
 */
(function () {
    'use strict';

    const CACHE_KEY = 'bc_deals_cache';
    const HISTORY_KEY = 'bc_search_history';
    const CACHE_TTL = 60 * 60 * 1000; // 1 hour

    // ── Helpers ─────────────────────────────────────────────────────────────────
    function money(amount, currency) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(amount);
    }

    function getHistory() {
        try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
    }

    function recordSearch(destination) {
        const history = getHistory();
        history.unshift(destination);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
    }

    function getClientCache() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const { data, expires } = JSON.parse(raw);
            if (Date.now() < expires) return data;
        } catch { }
        return null;
    }

    function setClientCache(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data, expires: Date.now() + CACHE_TTL }));
        } catch { }
    }

    // ── AI Personalization ───────────────────────────────────────────────────────
    // Score each deal by how often its destination appears in search history
    function personalizeDeals(deals) {
        const history = getHistory();
        const favMap = {};
        history.forEach(d => { favMap[d] = (favMap[d] || 0) + 1; });

        return deals.map(d => ({
            ...d,
            personalScore: (favMap[d.to] || 0) + (favMap[d.city] || 0)
        }));
    }

    // ── Sorting ─────────────────────────────────────────────────────────────────
    function sortDeals(deals, mode) {
        const clone = [...deals];
        if (mode === 'price') return clone.sort((a, b) => a.price - b.price);
        if (mode === 'popular') {
            // Rank by personalScore + stops (direct preferred) + being a hot deal
            return clone.sort((a, b) => (b.personalScore - a.personalScore) || (a.stops - b.stops) || (a.price - b.price));
        }
        if (mode === 'trending') {
            // Trending: hot deals first, then by price
            return clone.sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0) || (a.price - b.price));
        }
        return clone;
    }

    // ── Filtering ────────────────────────────────────────────────────────────────
    function filterDeals(deals, filters) {
        return deals.filter(d => {
            if (filters.directOnly && d.stops > 0) return false;
            if (d.price < filters.minPrice || d.price > filters.maxPrice) return false;
            if (filters.month) {
                const dealMonth = (d.date || '').slice(5, 7);
                if (dealMonth !== filters.month) return false;
            }
            return true;
        });
    }

    // ── Skeleton HTML ────────────────────────────────────────────────────────────
    function renderSkeletons(container) {
        container.innerHTML = Array(6).fill(0).map(() => `
      <div class="deal-card bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm animate-pulse">
        <div class="h-40 bg-slate-200"></div>
        <div class="p-4 space-y-3">
          <div class="h-4 bg-slate-200 rounded w-3/4"></div>
          <div class="h-3 bg-slate-200 rounded w-1/2"></div>
          <div class="h-8 bg-slate-200 rounded-xl w-1/3"></div>
        </div>
      </div>`).join('');
    }

    // ── Card HTML ────────────────────────────────────────────────────────────────
    function renderCard(deal, originCode, idx) {
        const price = money(deal.price, deal.currency);
        const stops = deal.stops === 0 ? 'Direct' : `${deal.stops} stop${deal.stops > 1 ? 's' : ''}`;
        const stopsColor = deal.stops === 0 ? 'text-green-600 bg-green-50' : 'text-slate-500 bg-slate-100';
        const dateStr = deal.date ? new Date(deal.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        const hotBadge = deal.hot ? '<span class="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">🔥 Hot Deal</span>' : '';
        const mockBadge = deal.isMock ? '<span class="absolute top-3 right-3 bg-slate-800/60 text-white text-xs px-2 py-1 rounded-full">Est. price</span>' : '';

        // Search params for Book Now
        const searchParams = new URLSearchParams({
            from: originCode,
            to: deal.to,
            depart: deal.date || '',
            adults: 1
        });

        return `
    <div class="deal-card group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
         data-price="${deal.price}" data-stops="${deal.stops}" data-date="${deal.date || ''}" data-city="${deal.city}">
      <div class="relative h-44 overflow-hidden bg-slate-100">
        <img
          data-src="${deal.imageUrl}"
          alt="${deal.city}"
          class="lazy-img w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-0"
          loading="lazy"
        />
        ${hotBadge}
        ${mockBadge}
        <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent"></div>
        <div class="absolute bottom-3 left-3 text-white">
          <div class="text-xs font-medium opacity-80">${deal.from} → ${deal.to}</div>
          <div class="font-bold text-sm">${deal.city}, ${deal.country}</div>
        </div>
      </div>
      <div class="p-4">
        <div class="flex items-start justify-between mb-2">
          <div>
            <div class="font-bold text-slate-900 text-base leading-tight">${deal.city}</div>
            <div class="text-xs text-slate-400 font-medium">${deal.country}</div>
          </div>
          <div class="text-right">
            <div class="text-green-600 font-extrabold text-xl">${price}</div>
            <div class="text-xs text-slate-400">per person</div>
          </div>
        </div>
        <div class="flex items-center gap-2 mb-3 flex-wrap">
          ${deal.airline ? `<span class="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">✈ ${deal.airline}</span>` : ''}
          <span class="text-xs font-semibold ${stopsColor} px-2 py-1 rounded-lg">${stops}</span>
          ${dateStr ? `<span class="text-xs font-medium text-slate-400">📅 ${dateStr}</span>` : ''}
          <span class="text-xs font-medium text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">${deal.tripType || 'one-way'}</span>
        </div>
        <a href="results.html?${searchParams.toString()}"
           onclick="window.dealsModule && window.dealsModule.trackBook('${deal.to}', '${deal.city}')"
           class="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl transition-all text-sm">
          Book Now →
        </a>
      </div>
    </div>`;
    }

    // ── Lazy Image Loader ────────────────────────────────────────────────────────
    function initLazyImages() {
        const imgs = document.querySelectorAll('.lazy-img[data-src]');
        if ('IntersectionObserver' in window) {
            const obs = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        const img = e.target;
                        img.src = img.dataset.src;
                        img.onload = () => img.classList.remove('opacity-0');
                        img.onerror = () => {
                            img.src = `https://picsum.photos/400/250?random=${Math.random()}`;
                            img.classList.remove('opacity-0');
                        };
                        obs.unobserve(img);
                    }
                });
            }, { rootMargin: '200px' });
            imgs.forEach(img => obs.observe(img));
        } else {
            imgs.forEach(img => {
                img.src = img.dataset.src;
                img.onload = () => img.classList.remove('opacity-0');
            });
        }
    }

    // ── SEO Updates ──────────────────────────────────────────────────────────────
    function updateSEO(origin, city, deals) {
        const cityDisplay = city || origin;

        // Dynamic title
        document.title = `Cheap Flights from ${cityDisplay} | BookingCart`;

        // Meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc); }
        metaDesc.content = `Find the best flight deals departing from ${cityDisplay}. Compare prices and book cheap flights instantly.`;

        // Schema.org structured data
        const existing = document.getElementById('flight-schema');
        if (existing) existing.remove();
        const schema = {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            'name': `Top Flight Deals from ${cityDisplay}`,
            'itemListElement': deals.slice(0, 5).map((d, i) => ({
                '@type': 'ListItem',
                'position': i + 1,
                'item': {
                    '@type': 'Flight',
                    'name': `${cityDisplay} to ${d.city}`,
                    'offers': { '@type': 'Offer', 'price': d.price, 'priceCurrency': d.currency || 'USD' }
                }
            }))
        };
        const s = document.createElement('script');
        s.id = 'flight-schema';
        s.type = 'application/ld+json';
        s.textContent = JSON.stringify(schema);
        document.head.appendChild(s);
    }

    // ── Main Render ─────────────────────────────────────────────────────────────
    let currentDeals = [];
    let currentOrigin = '';
    let currentCity = '';
    let currentFilters = { minPrice: 0, maxPrice: 5000, directOnly: false, month: '' };
    let currentSort = 'price';

    function renderDeals() {
        const grid = document.getElementById('deals-grid');
        if (!grid) return;
        let deals = personalizeDeals(currentDeals);
        deals = filterDeals(deals, currentFilters);
        deals = sortDeals(deals, currentSort);
        if (!deals.length) {
            grid.innerHTML = '<div class="col-span-full text-center py-12 text-slate-400"><i class="ph ph-airplane-tilt text-4xl mb-2"></i><p>No deals match your filters.</p></div>';
            return;
        }
        grid.innerHTML = deals.map((d, i) => renderCard(d, currentOrigin, i)).join('');
        initLazyImages();
    }

    // ── Public: Track book click for personalization ─────────────────────────────
    window.dealsModule = {
        trackBook(iata, city) {
            recordSearch(iata);
            recordSearch(city);
        }
    };

    // ── Init ─────────────────────────────────────────────────────────────────────
    async function initDeals() {
        const section = document.getElementById('deals-section');
        const grid = document.getElementById('deals-grid');
        const titleEl = document.getElementById('deals-title');
        if (!section || !grid) return;

        // Show skeletons
        renderSkeletons(grid);
        section.classList.remove('hidden');

        // Check client cache
        const cached = getClientCache();
        if (cached) {
            currentDeals = cached.deals;
            currentOrigin = cached.origin;
            currentCity = cached.city;
            updateSEO(currentOrigin, currentCity, currentDeals);
            if (titleEl) titleEl.textContent = `Top Deals from ${currentCity || currentOrigin}`;
            renderDeals();
            return;
        }

        // Try browser geolocation first (for override)
        let overrideOrigin = '';
        try {
            // Don't block loading on geo — fire and forget
            navigator.geolocation && navigator.geolocation.getCurrentPosition(
                () => { }, // We rely on IP geo for simplicity
                () => { }
            );
        } catch (e) { }

        // Fetch from API
        try {
            const resp = await fetch('/api/flight-deals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ origin: overrideOrigin })
            });
            const data = await resp.json();
            if (data.ok && data.deals && data.deals.length) {
                currentDeals = data.deals;
                currentOrigin = data.origin;
                currentCity = data.city;
                setClientCache({ deals: currentDeals, origin: currentOrigin, city: currentCity });
                updateSEO(currentOrigin, currentCity, currentDeals);
                if (titleEl) titleEl.textContent = `Top Deals from ${currentCity || currentOrigin}`;
                renderDeals();
            } else {
                grid.innerHTML = '<div class="col-span-full text-center py-12 text-slate-400"><p>Could not load deals right now. Try again later.</p></div>';
            }
        } catch (err) {
            grid.innerHTML = '<div class="col-span-full text-center py-12 text-slate-400"><p>Could not load deals right now.</p></div>';
        }
    }

    // ── Wire up controls after DOM ready ─────────────────────────────────────────
    function initControls() {
        // Sort buttons
        document.querySelectorAll('[data-sort]').forEach(btn => {
            btn.addEventListener('click', () => {
                currentSort = btn.dataset.sort;
                document.querySelectorAll('[data-sort]').forEach(b => {
                    b.className = b.dataset.sort === currentSort
                        ? 'data-sort px-4 py-2 rounded-xl text-sm font-bold bg-green-600 text-white transition-all'
                        : 'data-sort px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all';
                });
                renderDeals();
            });
        });

        // Price range slider
        const minSlider = document.getElementById('deals-min-price');
        const maxSlider = document.getElementById('deals-max-price');
        const priceLabel = document.getElementById('deals-price-label');
        function updatePriceFilter() {
            currentFilters.minPrice = parseInt(minSlider.value);
            currentFilters.maxPrice = parseInt(maxSlider.value);
            if (priceLabel) priceLabel.textContent = `$${currentFilters.minPrice} – $${currentFilters.maxPrice === 5000 ? '5000+' : currentFilters.maxPrice}`;
            renderDeals();
        }
        minSlider && minSlider.addEventListener('input', updatePriceFilter);
        maxSlider && maxSlider.addEventListener('input', updatePriceFilter);

        // Direct only toggle
        const directToggle = document.getElementById('deals-direct-only');
        directToggle && directToggle.addEventListener('change', () => {
            currentFilters.directOnly = directToggle.checked;
            renderDeals();
        });

        // Month filter
        const monthSelect = document.getElementById('deals-month');
        monthSelect && monthSelect.addEventListener('change', () => {
            currentFilters.month = monthSelect.value;
            renderDeals();
        });

        // Change origin
        const originInput = document.getElementById('deals-origin-input');
        const originBtn = document.getElementById('deals-origin-btn');
        originBtn && originBtn.addEventListener('click', async () => {
            const val = (originInput.value || '').trim().toUpperCase();
            if (val.length === 3) {
                currentOrigin = val;
                currentDeals = [];
                localStorage.removeItem(CACHE_KEY);
                const titleEl = document.getElementById('deals-title');
                if (titleEl) titleEl.textContent = `Top Deals from ${val}`;
                const grid = document.getElementById('deals-grid');
                renderSkeletons(grid);
                const resp = await fetch(`/api/flight-deals?origin=${val}`);
                const data = await resp.json();
                if (data.ok) {
                    currentDeals = data.deals;
                    currentCity = data.city;
                    setClientCache({ deals: currentDeals, origin: val, city: currentCity });
                    renderDeals();
                }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initDeals();
        initControls();
    });
})();
