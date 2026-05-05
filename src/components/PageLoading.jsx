/** Full-viewport loading state for lazy routes and initial navigation. */
export default function PageLoading({ message = 'Loading…' }) {
  return (
    <div
      className="bc-page-loading fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="h-11 w-11 rounded-full border-[3px] border-slate-200 border-t-green-600 animate-spin"
        aria-hidden
      />
      <p className="mt-4 text-sm font-semibold text-slate-600">{message}</p>
    </div>
  );
}
