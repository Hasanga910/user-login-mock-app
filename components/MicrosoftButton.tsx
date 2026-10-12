// Plain link (not next/link) so the browser performs a full navigation to the OAuth redirect.
export default function MicrosoftButton() {
  return (
    <a
      href="/api/auth/microsoft/login"
      className="inline-flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50"
    >
      <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
      </svg>
      Sign in with Microsoft
    </a>
  );
}
