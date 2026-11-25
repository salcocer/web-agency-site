// The Kata wordmark. The k's arm is a code bracket, "|<", in the accent colour.
// Static copies for use outside the site are in public/brand/.
export function Logo() {
  return (
    <svg className="logo" viewBox="0 0 107 39" role="img" aria-label="Kata Studio">
      <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v33" />
        <path d="M23 14 12 25l11 11" stroke="var(--primary)" />
        <circle cx="42" cy="25" r="11" />
        <path d="M53 14v22M69 5v31M64.5 14H77" />
        <circle cx="93" cy="25" r="11" />
        <path d="M104 14v22" />
      </g>
    </svg>
  );
}
