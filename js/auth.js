// js/auth.js — Shared authentication UI script for all BookingCart pages
// Reads the signed-in user from localStorage and updates the header profile button.
// Include this on EVERY page to ensure the user's avatar appears consistently.

(function () {
    const STORAGE_KEY = 'bookingcart_user';
    const GOOGLE_CLIENT_ID = '344110356663-foa7unsastgg0hp57qdaaj5qvmkgd8lg.apps.googleusercontent.com';

    // Fix Google Client ID if the page has a placeholder
    const gOnload = document.getElementById('g_id_onload');
    if (gOnload) {
        const cid = gOnload.getAttribute('data-client_id');
        if (!cid || cid === 'YOUR_GOOGLE_CLIENT_ID') {
            gOnload.setAttribute('data-client_id', GOOGLE_CLIENT_ID);
        }
    }

    function applyAuthUI() {
        const userStr = localStorage.getItem(STORAGE_KEY);
        if (!userStr) return;

        let user;
        try {
            user = JSON.parse(userStr);
        } catch (e) {
            return;
        }
        if (!user || !user.name) return;

        // Hide Google sign-in button
        const gSignIn = document.querySelector('.g_id_signin');
        if (gSignIn) gSignIn.style.display = 'none';

        // Update ALL profile avatar buttons on the page
        // Matches: [data-profile-trigger], [data-profile-btn], or fallback avatar buttons
        const selectors = [
            '[data-profile-trigger]',
            '[data-profile-btn]',
            'button img[alt="User Profile"]'
        ];

        for (const sel of selectors) {
            const els = document.querySelectorAll(sel);
            els.forEach(el => {
                if (sel.includes('img')) {
                    // Direct img element — just update src
                    el.src = user.picture || el.src;
                    el.alt = user.name;
                    el.title = user.name;
                } else {
                    // Button element — replace inner HTML
                    el.innerHTML = '<img src="' + (user.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name)) +
                        '" alt="' + user.name + '" title="' + user.name + '" class="w-full h-full object-cover" />';
                }
            });
        }

        // Show profile dropdown if present (index.html has this)
        const dropdown = document.querySelector('[data-profile-dropdown]');
        if (dropdown) dropdown.style.display = '';

        // Update account link name in dropdown menu
        const accountLink = document.querySelector('[data-profile-menu] a:first-child');
        if (accountLink) {
            accountLink.innerHTML = '<i class="ph ph-user-circle text-xl text-slate-400"></i> ' + user.name;
        }
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyAuthUI);
    } else {
        applyAuthUI();
    }

    // Expose globally so bookingcart.js handleGoogleSignIn can call it after sign-in
    window.applyAuthUI = applyAuthUI;
})();
