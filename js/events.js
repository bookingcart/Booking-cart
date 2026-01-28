(function () {
  'use strict';

  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => ctx.querySelectorAll(sel);

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  function renderStatus(el, status) {
    if (!el) return;
    el.style.display = 'block';
    if (status.loading) {
      el.style.background = '#f8fafc';
      el.style.borderColor = 'var(--border)';
      el.innerHTML = `<div class="muted" style="font-size:13px">Checking Eventbrite API status…</div>`;
      return;
    }
    if (status.ok) {
      el.style.background = '#dcfce7';
      el.style.borderColor = '#16a34a';
      el.innerHTML = `<div class="muted" style="font-size:13px;color:#166534;font-weight:800">✅ Eventbrite API ready</div>`;
    } else {
      el.style.background = '#fee2e2';
      el.style.borderColor = '#dc2626';
      const help = status.error && status.error.includes('EVENTBRITE_TOKEN')
        ? '<br>Set <code>EVENTBRITE_TOKEN</code> in your .env and restart the server.'
        : '';
      el.innerHTML = `<div class="muted" style="font-size:13px;color:#991b1b;font-weight:800">❌ API error: ${escapeHtml(status.error || 'Unknown')}${help}</div>`;
    }
  }

  function renderResults(el, data) {
    if (!el) return;
    el.style.display = 'block';
    
    if (data.loading) {
      el.innerHTML = `
        <div class="panel">
          <div class="panel__inner">
            <div class="muted">Loading events…</div>
          </div>
        </div>
      `;
      return;
    }
    
    if (data.error) {
      el.innerHTML = `
        <div class="panel" style="background:#fee2e2;border-color:#dc2626">
          <div class="panel__inner">
            <div class="muted" style="color:#991b1b;font-weight:800">❌ ${escapeHtml(data.error)}</div>
          </div>
        </div>
      `;
      return;
    }

    if (!data.events || data.events.length === 0) {
      el.innerHTML = `
        <div class="panel">
          <div class="panel__inner">
            <div class="muted">No events found matching your criteria.</div>
          </div>
        </div>
      `;
      return;
    }

    const eventsHtml = data.events.map(event => `
      <div class="panel" style="cursor:pointer" onclick="window.open('${escapeHtml(event.url)}', '_blank')">
        <div class="panel__inner">
          <div class="row" style="gap:16px;align-items:start">
            ${event.logo ? `
              <div style="flex-shrink:0">
                <img src="${escapeHtml(event.logo.url)}" alt="${escapeHtml(event.name.text)}" style="width:80px;height:80px;object-fit:cover;border-radius:8px" />
              </div>
            ` : ''}
            <div style="flex:1">
              <h3 class="h4" style="margin:0 0 8px 0">${escapeHtml(event.name.text)}</h3>
              <div class="muted" style="font-size:13px;margin-bottom:4px">
                📅 ${formatDate(event.start.local)} ${formatTime(event.start.local)}
              </div>
              ${event.venue ? `
                <div class="muted" style="font-size:13px;margin-bottom:4px">
                  📍 ${escapeHtml(event.venue.name)}, ${escapeHtml(event.venue.address.city || '')}
                </div>
              ` : ''}
              <div class="muted" style="font-size:13px;margin-bottom:8px">
                ${event.is_free ? '🆓 Free' : `💰 ${escapeHtml(event.currency || '$')}${(event.price || 0).toFixed(2)}`}
              </div>
              <div class="muted" style="font-size:12px">
                ${event.description ? escapeHtml(event.description.text.substring(0, 150)) + '...' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    el.innerHTML = `
      <div class="muted" style="margin-bottom:12px">Found ${data.events.length} event${data.events.length === 1 ? '' : 's'}</div>
      ${eventsHtml}
    `;
  }

  async function searchByLocation(location) {
    // Try combined search first (Eventbrite + Ticketmaster), fallback to Eventbrite only
    let response = await fetch(`/api/events/search-combined?location=${encodeURIComponent(location)}`);
    let body = await response.json().catch(() => ({}));
    
    // If combined search fails or returns no results, try Eventbrite only
    if (!response.ok || !body.ok || !body.events || body.events.length === 0) {
      response = await fetch(`/api/events/search?location=${encodeURIComponent(location)}`);
      body = await response.json().catch(() => ({}));
    }
    
    // If still no results, try Ticketmaster only
    if (!response.ok || !body.ok || !body.events || body.events.length === 0) {
      response = await fetch(`/api/events/ticketmaster?location=${encodeURIComponent(location)}`);
      body = await response.json().catch(() => ({}));
    }
    
    if (!response.ok || !body.ok) {
      throw new Error(body.error || `HTTP ${response.status}`);
    }
    return body.events || [];
  }

  async function checkApiStatus() {
    const statusEl = qs('[data-events-status]');
    if (!statusEl) return;
    renderStatus(statusEl, { loading: true });
    try {
      const response = await fetch('/api/events/status');
      const result = await response.json();
      renderStatus(statusEl, { ok: result.ok, error: result.error });
    } catch (e) {
      renderStatus(statusEl, { ok: false, error: e && e.message ? e.message : 'Failed' });
    }
  }

  function init() {
    const form = qs('[data-events-form]');
    const resultsEl = qs('[data-events-results]');
    if (!form || !resultsEl) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const location = String(formData.get('location') || '').trim();
      if (!location) {
        renderResults(resultsEl, { error: 'Enter a location to search.' });
        return;
      }

      renderResults(resultsEl, { loading: true });
      try {
        const events = await searchByLocation(location);
        renderResults(resultsEl, { events });
      } catch (error) {
        renderResults(resultsEl, { error: error.message });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    init();
    checkApiStatus();
  });
})();
