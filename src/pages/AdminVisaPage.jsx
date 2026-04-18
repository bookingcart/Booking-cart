import { useEffect } from 'react';
import { useLegacyScripts } from '../hooks/useLegacyScripts.js';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';

const SCRIPTS = ['/js/loading-ui.js', '/js/auth.js', '/js/visa.js?v=1'];

export default function AdminVisaPage() {
  useEffect(() => {
    document.title = 'Admin Visa | BookingCart';
  }, []);
  useLegacyScripts(SCRIPTS, 'admin-visa');
  return (
    <>
      <header className="header" aria-label="Top navigation">
        <div className="container header__inner">
          <a className="brand" href="/" aria-label="BookingCart Home">
            <img src="/images/logo.png" alt="BookingCart" className="brand__logo" style={{ borderRadius: '12px' }} />
          </a>
          <nav className="header__nav" aria-label="Primary">
            <a href="/">Flights</a>
            <a href="/stays">Stays</a>
            <a href="/visa">Visa</a>
          </nav>
          <HeaderAuthCluster />
        </div>
      </header>

      <section className="layout" aria-label="Visa admin dashboard" data-visa-admin>
        <div className="container">
          <div className="kpi" style={{ fontSize: '22px' }}>
            Visa Admin / Operations
          </div>
          <div className="muted" style={{ marginTop: '6px' }}>
            Review applications, request corrections, and track portal submissions. We are not affiliated with
            governments and do not issue visas.
          </div>

          <div className="card" style={{ marginTop: '14px' }}>
            <div className="card__body">
              <div className="row" style={{ gap: '12px', flexWrap: 'wrap' }}>
                <div className="field" style={{ minWidth: 'min(420px,100%)', flex: 1 }}>
                  <div className="label">Admin token</div>
                  <input className="control" data-admin-token type="password" placeholder="Paste admin token" />
                </div>
                <div className="field field--submit" style={{ width: '220px', maxWidth: '100%' }}>
                  <div className="label">&nbsp;</div>
                  <button className="btn btn-primary" type="button" data-admin-load style={{ height: '44px' }}>
                    Load queue
                  </button>
                </div>
              </div>

              <div className="hr" />

              <div data-visa-admin-list />
            </div>
          </div>
        </div>
      </section>

      <footer className="footer" aria-label="Footer">
        <div className="container footer__inner">
          <div className="muted"> BookingCart</div>
          <div className="row" style={{ gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div className="muted">Admin Visa</div>
            <a className="muted" href="/terms" style={{ fontWeight: 800 }}>
              Terms
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
