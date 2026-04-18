export function FlightFooter() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8" aria-label="Footer">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
          <div className="lg:col-span-2 space-y-4">
            <a href="/" className="block text-2xl font-medium text-slate-900 tracking-tight">
              <img src="/images/logo.png" alt="BookingCart" className="h-10 rounded-xl" />
            </a>
            <p className="text-slate-500 text-sm">
              Your Travel, Simplified. Book flights, hotels, and more with confidence and ease.
            </p>
            <div className="flex gap-4 pt-2">
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-green-50 hover:text-green-600 transition-colors"
              >
                <i className="ph-fill ph-facebook-logo" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-green-50 hover:text-green-600 transition-colors"
              >
                <i className="ph-fill ph-x-logo" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-green-50 hover:text-green-600 transition-colors"
              >
                <i className="ph-fill ph-instagram-logo" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-green-50 hover:text-green-600 transition-colors"
              >
                <i className="ph-fill ph-linkedin-logo" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-slate-900 mb-4">Navigate</h3>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li>
                <a href="/" className="hover:text-green-600 transition-colors">
                  Flights
                </a>
              </li>
              <li>
                <a href="/stays" className="hover:text-green-600 transition-colors">
                  Stays
                </a>
              </li>
              <li>
                <a href="/events" className="hover:text-green-600 transition-colors">
                  Events
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-slate-900 mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li>
                <a href="#" className="hover:text-green-600 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-600 transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-600 transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-slate-900 mb-4">Support</h3>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li>
                <a href="#" className="hover:text-green-600 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-600 transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-600 transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-slate-900 mb-4">Reviews</h3>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex text-yellow-400 text-sm mb-1">★★★★★</div>
              <div className="font-medium text-slate-900">4.8 out of 5</div>
              <div className="text-xs text-slate-400 mt-1">Based on 12,847 reviews</div>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400">
          <div>&copy; 2026 BookingCart. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-slate-600">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-slate-600">
              Terms of Service
            </a>
            <a href="#" className="hover:text-slate-600">
              Cookie Setting
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
