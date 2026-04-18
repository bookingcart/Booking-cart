import { useEffect } from 'react';
import { useLegacyScripts } from '../hooks/useLegacyScripts.js';

const SCRIPTS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  '/js/loading-ui.js',
  '/js/auth.js',
  '/js/admin-page.js'
];

export default function AdminPage() {
  useEffect(() => { document.title = 'BookingCart — Admin'; }, []);
  useLegacyScripts(SCRIPTS, 'admin');
  return (
    <>
      
          <div id="login-overlay"
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <i className="ph-fill ph-lock-key text-green-600 text-2xl"></i>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mb-1">Admin Access</h2>
                  <p className="text-sm text-slate-500 mb-6">Enter your admin PIN to continue.</p>
                  <input id="pin-input" type="password" maxLength="10" placeholder="Enter PIN"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-center text-lg font-bold tracking-widest mb-4" />
                  <button id="pin-btn"
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all">
                      Unlock Dashboard
                  </button>
                  <p id="pin-error" className="text-red-500 text-sm font-medium mt-3" style={{"display":"none"}}>Invalid PIN</p>
              </div>
          </div>
      
          
          <div id="upload-overlay"
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden items-center justify-center">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 relative max-h-[90vh] overflow-y-auto">
                  <button onClick={() => window.closeUploadModal?.()} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                      <i className="ph-bold ph-x text-2xl"></i>
                  </button>
                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-xl">
                          <i className="ph-fill ph-upload-simple"></i>
                      </div>
                      <div>
                          <h2 className="text-xl font-extrabold text-slate-900">Upload Ticket</h2>
                          <p className="text-sm text-slate-500">Ref: <span id="upload-ref"
                                  className="font-bold text-slate-700"></span></p>
                      </div>
                  </div>
      
                  <div
                      className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 flex justify-between items-center text-sm">
                      <div>
                          <div className="text-slate-500 font-bold mb-1">Route</div>
                          <div id="upload-route" className="font-medium text-slate-900"></div>
                      </div>
                      <div className="text-right">
                          <div className="text-slate-500 font-bold mb-1">Passengers</div>
                          <div id="upload-pax" className="font-medium text-slate-900"></div>
                      </div>
                  </div>
      
                  <form id="upload-form" className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ticket Number /
                              PNR</label>
                          <input id="ticket-num" required type="text" placeholder="e.g. 1234567890"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Operating
                              Airline</label>
                          <input id="ticket-airline" required type="text" placeholder="e.g. Emirates"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ticket File (PDF
                              / Image)</label>
                          <input id="ticket-file" required type="file" accept="application/pdf,image/*"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      </div>
                      <button type="submit" id="upload-btn"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 mt-4 flex items-center justify-center gap-2">
                          <i className="ph-bold ph-upload-simple"></i> Upload & Issue Ticket
                      </button>
                  </form>
              </div>
          </div>
      
          
          <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
              <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <a href="/" className="text-2xl font-extrabold text-slate-900 tracking-tight"><img
                              src="images/logo.png" alt="BookingCart" className="h-10 rounded-xl" /></a>
                      <span
                          className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase tracking-wider">Admin</span>
                  </div>
      
                  <div id="g_id_onload"
                      data-client_id=""
                      data-context="use" data-ux_mode="popup" data-callback="handleGoogleSignIn" data-auto_prompt="false">
                  </div>
                  <div className="g_id_signin" data-type="standard" data-shape="pill" data-theme="outline" data-text="signin_with"
                      data-size="large" data-logo_alignment="left">
                  </div>
                  <button id="refresh-btn"
                      className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl transition-all text-sm">
                      <i className="ph ph-arrows-clockwise"></i> Refresh
                  </button>
              </div>
          </header>
      
          <main className="flex-grow container mx-auto px-6 py-8">
              
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-8" id="stats">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Bookings</div>
                      <div className="text-2xl font-extrabold text-slate-900" id="stat-total">0</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                      <div className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-1">New / Pending</div>
                      <div className="text-2xl font-extrabold text-yellow-600" id="stat-new">0</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                      <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Confirmed</div>
                      <div className="text-2xl font-extrabold text-green-600" id="stat-confirmed">0</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                      <div className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">Tickets Issued</div>
                      <div className="text-2xl font-extrabold text-purple-600" id="stat-issued">0</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                      <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Downloads</div>
                      <div className="text-2xl font-extrabold text-indigo-600" id="stat-downloads">0</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Revenue</div>
                      <div className="text-2xl font-extrabold text-slate-900" id="stat-revenue">$0</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-blue-200 p-5">
                      <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1"><i className="ph ph-users"></i>
                          Total Users</div>
                      <div className="text-2xl font-extrabold text-blue-600" id="stat-users">0</div>
                  </div>
              </div>
      
              
              <div className="flex items-center gap-3 mb-6">
                  <span className="text-sm font-bold text-slate-500">Filter:</span>
                  <button className="admin-filter px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-900 text-white"
                      data-filter="all">All</button>
                  <button
                      className="admin-filter px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                      data-filter="new">New</button>
                  <button
                      className="admin-filter px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                      data-filter="confirmed">Confirmed</button>
                  <button
                      className="admin-filter px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                      data-filter="cancelled">Cancelled</button>
              </div>
      
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm" id="bookings-table">
                          <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                  <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">
                                      Ref</th>
                                  <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">
                                      Client</th>
                                  <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">
                                      Route</th>
                                  <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">
                                      Date</th>
                                  <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">
                                      Total</th>
                                  <th className="text-left px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">
                                      Status</th>
                                  <th className="text-right px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">
                                      Actions</th>
                              </tr>
                          </thead>
                          <tbody id="bookings-body"></tbody>
                      </table>
                  </div>
                  <div id="empty-state" className="py-16 text-center text-slate-400 font-medium" style={{"display":"none"}}>
                      <i className="ph ph-airplane-tilt text-4xl mb-2"></i>
                      <p>No bookings yet.</p>
                  </div>
              </div>
          </main>
    </>
  );
}
