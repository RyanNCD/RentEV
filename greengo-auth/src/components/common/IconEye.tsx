export default function IconEye({ open }: { open: boolean }) {
  return open ? (
    // eye-off
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10.58 10.58A3 3 0 0012 15a3 3 0 001.42-5.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9.88 5.09A9.77 9.77 0 0112 5c5 0 9 4.5 10 7- .33.77-1 2-2.37 3.29M6.1 6.1C4.1 7.39 2.9 9.05 2 12c1 2.5 5 7 10 7 1.31 0 2.55-.25 3.7-.72" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ) : (
    // eye
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
