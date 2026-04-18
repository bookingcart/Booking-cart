import { HeaderProfileDropdown } from './HeaderProfileDropdown.jsx';

/**
 * Google Identity placeholders + profile dropdown. Pair with /js/auth.js (bootGoogle, applyAuthUI).
 */
export function HeaderAuthCluster({ className = '' }) {
  return (
    <div className={`bc-header-auth flex items-center gap-3 flex-shrink-0 ${className}`.trim()}>
      <div
        id="g_id_onload"
        data-client_id=""
        data-context="use"
        data-ux_mode="popup"
        data-callback="handleGoogleSignIn"
        data-auto_prompt="false"
      ></div>
      <div
        className="g_id_signin"
        data-type="standard"
        data-shape="pill"
        data-theme="outline"
        data-text="signin_with"
        data-size="large"
        data-logo_alignment="left"
      ></div>
      <HeaderProfileDropdown />
    </div>
  );
}
