'use client';
import { useState, useEffect, useRef } from 'react';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';

/* ── data ── */
const TABS = [
  { id: 'flights', label: 'Flights', icon: 'ph-airplane' },
  { id: 'hotels', label: 'Hotels & Homes', icon: 'ph-building' },
  { id: 'trains', label: 'Trains', icon: 'ph-train' },
  { id: 'attractions', label: 'Attractions & Tours', icon: 'ph-ticket' },
  { id: 'cars', label: 'Car Rentals', icon: 'ph-car' },
  { id: 'transfers', label: 'Airport Transfers', icon: 'ph-van' },
  { id: 'private', label: 'Private Tours', icon: 'ph-user-circle' },
  { id: 'group', label: 'Group Tours', icon: 'ph-users' },
];

const FAQS = {
  flights: [
    { id: 1, q: 'Are there any flight ticket promotions going on?', category: 'Booking & Price' },
    { id: 2, q: 'How do I change my ticket?', category: 'Ticketing & Payment' },
    { id: 3, q: 'How can I cancel my flight ticket?', category: 'Booking Query' },
    { id: 4, q: 'Have a different question? Chat with us now.', category: 'Hot Topics', isChat: true },
    { id: 5, q: 'What are the baggage allowance policies?', category: 'Passenger Information-related' },
    { id: 6, q: 'How do I request a refund?', category: 'Ticketing & Payment' },
    { id: 7, q: 'Can I select my seat after booking?', category: 'Booking & Price' },
    { id: 8, q: 'What documents do I need for check-in?', category: 'Passenger Information-related' },
  ],
  hotels: [
    { id: 1, q: 'How do I modify my hotel reservation?', category: 'Booking Query' },
    { id: 2, q: 'What is the cancellation policy?', category: 'Booking & Price' },
    { id: 3, q: 'How do I get a receipt for my hotel stay?', category: 'Ticketing & Payment' },
    { id: 4, q: 'Have a different question? Chat with us now.', category: 'Hot Topics', isChat: true },
  ],
  trains: [
    { id: 1, q: 'Can I change my train departure time?', category: 'Booking Query' },
    { id: 2, q: 'Are there any train ticket discounts?', category: 'Booking & Price' },
    { id: 3, q: 'How do I cancel a train ticket?', category: 'Ticketing & Payment' },
    { id: 4, q: 'Have a different question? Chat with us now.', category: 'Hot Topics', isChat: true },
  ],
  attractions: [
    { id: 1, q: 'Can I get a refund for attraction tickets?', category: 'Ticketing & Payment' },
    { id: 2, q: 'How do I redeem my tour voucher?', category: 'Booking Query' },
    { id: 3, q: 'Are child tickets available?', category: 'Passenger Information-related' },
    { id: 4, q: 'Have a different question? Chat with us now.', category: 'Hot Topics', isChat: true },
  ],
  cars: [
    { id: 1, q: 'What documents do I need to rent a car?', category: 'Passenger Information-related' },
    { id: 2, q: 'Can I modify my car rental dates?', category: 'Booking Query' },
    { id: 3, q: 'Is insurance included in my rental?', category: 'Booking & Price' },
    { id: 4, q: 'Have a different question? Chat with us now.', category: 'Hot Topics', isChat: true },
  ],
  transfers: [
    { id: 1, q: 'How early should I book a transfer?', category: 'Booking & Price' },
    { id: 2, q: 'Can I cancel my airport transfer?', category: 'Booking Query' },
    { id: 3, q: 'Are child seats available?', category: 'Passenger Information-related' },
    { id: 4, q: 'Have a different question? Chat with us now.', category: 'Hot Topics', isChat: true },
  ],
  private: [
    { id: 1, q: 'How do I customize my private tour?', category: 'Booking Query' },
    { id: 2, q: 'What is included in a private tour package?', category: 'Booking & Price' },
    { id: 3, q: 'Can I cancel a private tour booking?', category: 'Ticketing & Payment' },
    { id: 4, q: 'Have a different question? Chat with us now.', category: 'Hot Topics', isChat: true },
  ],
  group: [
    { id: 1, q: 'What is the minimum group size?', category: 'Passenger Information-related' },
    { id: 2, q: 'Are group discounts available?', category: 'Booking & Price' },
    { id: 3, q: 'How do I manage group bookings?', category: 'Booking Query' },
    { id: 4, q: 'Have a different question? Chat with us now.', category: 'Hot Topics', isChat: true },
  ],
};

const FILTER_TAGS = ['Hot Topics', 'Booking & Price', 'Ticketing & Payment', 'Booking Query', 'Passenger Information-related'];

const SMART_REPLIES = {
  cancel: 'Would you like to cancel your booking now? I can guide you through the process step by step.',
  change: 'Here are the available rebooking options for your ticket. Which date works best?',
  refund: 'I can help you process a refund. Please share your booking reference to get started.',
  promotion: 'We currently have several promotions active! Check out our deals section for the latest offers.',
};

function detectIntent(msg) {
  const m = msg.toLowerCase();
  if (m.includes('cancel')) return 'cancel';
  if (m.includes('change') || m.includes('modify') || m.includes('rebok')) return 'change';
  if (m.includes('refund')) return 'refund';
  if (m.includes('promo') || m.includes('deal') || m.includes('discount')) return 'promotion';
  return null;
}

/* ── Chat Widget ── */
function ChatWidget({ open, onClose, initialMessage }) {
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm your BookingCart support assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const sentRef = useRef(false);

  useEffect(() => {
    if (open && initialMessage && !sentRef.current) {
      sentRef.current = true;
      sendMessage(initialMessage);
    }
  }, [open, initialMessage]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  function sendMessage(text) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text: msg }]);
    setTyping(true);
    setTimeout(() => {
      const intent = detectIntent(msg);
      const reply = intent
        ? SMART_REPLIES[intent]
        : "Thanks for reaching out! Our team will respond shortly. In the meantime, check our FAQ below for quick answers.";
      setMessages(prev => [...prev, { from: 'bot', text: reply }]);
      setTyping(false);
    }, 1200);
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col z-50 overflow-hidden"
      style={{ maxHeight: '70vh' }}>
      {/* header */}
      <div className="bg-gradient-to-r from-teal-600 to-green-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <i className="ph ph-headset text-white text-lg" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">BookingCart Support</p>
            <p className="text-white/70 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-300 rounded-full inline-block" />
              Online · Avg reply ~30s
            </p>
          </div>
        </div>
        <button onClick={() => { onClose(); sentRef.current = false; }} className="text-white/70 hover:text-white transition-colors">
          <i className="ph ph-x text-lg" />
        </button>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.from === 'bot' && (
              <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center mr-2 shrink-0 mt-1">
                <i className="ph ph-robot text-teal-600 text-sm" />
              </div>
            )}
            <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-snug shadow-sm
              ${m.from === 'user'
                ? 'bg-teal-600 text-white rounded-br-sm'
                : 'bg-white text-slate-700 rounded-bl-sm border border-slate-100'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center mr-2 shrink-0">
              <i className="ph ph-robot text-teal-600 text-sm" />
            </div>
            <div className="bg-white border border-slate-100 px-4 py-2 rounded-2xl rounded-bl-sm shadow-sm flex gap-1 items-center">
              {[0, 0.2, 0.4].map((d, i) => (
                <span key={i} className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="p-3 border-t border-slate-100 bg-white flex gap-2">
        <input
          className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
          placeholder="Type your message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={() => sendMessage()}
          className="w-9 h-9 rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center transition-colors">
          <i className="ph ph-paper-plane-tilt text-lg" />
        </button>
      </div>
    </div>
  );
}

/* ── Phone modal ── */
function PhoneModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900 text-lg">Call Us</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><i className="ph ph-x text-xl" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">Our support team is available 24/7.</p>
        {[
          { region: 'Global (English)', number: '+1 800 BOOKING', flag: '🌍' },
          { region: 'East Africa', number: '+256 800 000 123', flag: '🇺🇬' },
          { region: 'UK & Europe', number: '+44 20 0000 0000', flag: '🇬🇧' },
          { region: 'UAE & Middle East', number: '+971 4 000 0000', flag: '🇦🇪' },
        ].map(({ region, number, flag }) => (
          <a key={region} href={`tel:${number.replace(/\s/g, '')}`}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-teal-50 transition-colors group mb-2">
            <span className="text-2xl">{flag}</span>
            <div className="flex-1">
              <p className="text-xs text-slate-400 font-medium">{region}</p>
              <p className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">{number}</p>
            </div>
            <i className="ph ph-phone text-teal-600 text-xl" />
          </a>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function CustomerSupportPage() {
  useEffect(() => { document.title = 'Customer Support | BookingCart'; }, []);

  const [activeTab, setActiveTab] = useState('flights');
  const [activeFilter, setActiveFilter] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = FAQS[activeTab] || FAQS.flights;
  const filteredFaqs = activeFilter ? faqs.filter(f => f.category === activeFilter) : faqs.slice(0, 4);

  function openChat(question) { setChatMsg(question || ''); setChatOpen(true); }

  function handleFaqClick(faq) {
    if (faq.isChat) { openChat(''); return; }
    setExpandedFaq(prev => prev === faq.id ? null : faq.id);
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/"><img src="/images/logo.svg" alt="BookingCart" className="h-10 w-auto" /></a>
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-500">
              <a href="/" className="hover:text-green-600 transition-colors">Flights</a>
              <a href="/stays" className="hover:text-green-600 transition-colors">Stays</a>
              <a href="/events" className="hover:text-green-600 transition-colors">Events</a>
              <a href="/support" className="text-teal-600">Support</a>
            </nav>
          </div>
          <HeaderAuthCluster />
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-green-600 pt-16 pb-14 px-4 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-green-300 rounded-full animate-pulse" />
              <span className="text-green-200 text-sm font-medium">Online — we&apos;re here to help</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2">Customer Support</h1>
            <p className="text-teal-100 flex items-center gap-2 text-base font-medium">
              <i className="ph ph-check-circle text-green-300 text-xl" />
              Average response in ~30s
            </p>
          </div>
          <div className="hidden sm:flex w-28 h-28 rounded-full bg-white/10 border border-white/20 items-center justify-center text-6xl shrink-0">
            🎧
          </div>
        </div>
      </div>

      <div className="bg-slate-100 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-16">

          {/* ── Service chat card ── */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 sm:p-8 mb-4">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-3 h-3 bg-teal-500 rounded-full animate-pulse" />
              <h2 className="text-lg font-bold text-slate-900">Service chat</h2>
            </div>

            {/* scrollable tab bar */}
            <div className="overflow-x-auto -mx-2 px-2 pb-1 mb-6">
              <div className="flex gap-1 w-max">
                {TABS.map(tab => (
                  <button key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setActiveFilter(null); setExpandedFaq(null); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all
                      ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <i className={`ph ${tab.icon} text-base`} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ 2-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {filteredFaqs.map(faq => (
                <div key={faq.id}>
                  <button
                    onClick={() => handleFaqClick(faq)}
                    className={`w-full text-left flex items-center justify-between gap-2 px-4 py-3.5 rounded-xl border transition-all
                      ${faq.isChat
                        ? 'border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700'
                        : 'border-slate-100 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 text-slate-700'}`}>
                    <span className="text-sm font-medium leading-snug">{faq.q}</span>
                    <i className={`ph ${faq.isChat ? 'ph-chat-dots text-teal-500' : expandedFaq === faq.id ? 'ph-caret-down text-slate-500' : 'ph-caret-right text-slate-400'} text-base shrink-0`} />
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="mt-1 px-4 py-3 bg-teal-50 border border-teal-100 rounded-xl text-sm text-slate-600">
                      <p className="mb-2">Here&apos;s how to help with: <span className="font-semibold text-teal-700">&ldquo;{faq.q}&rdquo;</span></p>
                      <p>Please visit your <strong>My Bookings</strong> page or click &ldquo;Chat with us&rdquo; for personalized assistance.</p>
                      <button onClick={() => openChat(faq.q)}
                        className="mt-3 text-xs font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-900 transition-colors">
                        Chat about this →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              More {TABS.find(t => t.id === activeTab)?.label} FAQ
            </p>
            <div className="flex flex-wrap gap-2">
              {FILTER_TAGS.map(tag => (
                <button key={tag}
                  onClick={() => setActiveFilter(prev => prev === tag ? null : tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                    ${activeFilter === tag
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-700'}`}>
                  {tag}
                </button>
              ))}
              <button onClick={() => setActiveFilter(null)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                ···
              </button>
            </div>
          </div>

          {/* ── Contact options row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { icon: 'ph-chat-dots', label: 'Chat', color: 'text-teal-600 bg-teal-50 hover:bg-teal-100 border-teal-100', action: () => openChat('') },
              { icon: 'ph-phone', label: 'Call us', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100', action: () => setPhoneOpen(true) },
              { icon: 'ph-envelope', label: 'Email', color: 'text-violet-600 bg-violet-50 hover:bg-violet-100 border-violet-100', action: () => window.location.href = 'mailto:support@bookingcart.com' },
              { icon: 'ph-airplane-tilt', label: 'My Bookings', color: 'text-green-600 bg-green-50 hover:bg-green-100 border-green-100', action: () => window.location.href = '/my-bookings' },
            ].map(({ icon, label, color, action }) => (
              <button key={label} onClick={action}
                className={`flex flex-col items-center gap-2 p-5 rounded-2xl border font-semibold text-sm transition-all shadow-sm ${color}`}>
                <i className={`ph ${icon} text-2xl`} />
                {label}
              </button>
            ))}
          </div>

          {/* ── Help categories ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-4">Help by topic</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: 'ph-ticket', label: 'Booking changes', href: '#' },
                { icon: 'ph-currency-dollar', label: 'Refunds', href: '#' },
                { icon: 'ph-archive-box', label: 'Baggage', href: '#' },
                { icon: 'ph-credit-card', label: 'Payments', href: '#' },
                { icon: 'ph-passport', label: 'Visas', href: '/visa' },
                { icon: 'ph-shield-check', label: 'Travel insurance', href: '#' },
              ].map(({ icon, label, href }) => (
                <a key={label} href={href}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-50 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-medium text-sm border border-slate-100 hover:border-teal-200 transition-all">
                  <i className={`ph ${icon} text-lg`} />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Chat widget ── */}
      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} initialMessage={chatMsg} />
      <PhoneModal open={phoneOpen} onClose={() => setPhoneOpen(false)} />

      {/* Floating chat button */}
      {!chatOpen && (
        <button
          onClick={() => openChat('')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-xl flex items-center justify-center z-40 transition-all hover:scale-110">
          <i className="ph ph-chat-dots text-2xl" />
        </button>
      )}
    </>
  );
}
