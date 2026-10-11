/** The dashed basting stitch that marks agent↔merchant traffic as work in progress. */
export function StitchRule({ className = "" }: { className?: string }) {
  return (
    <svg height="5" width="14" viewBox="0 0 14 5" aria-hidden="true" className={className}>
      <path
        d="M1 4 L13 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2.5 2.5"
      />
    </svg>
  );
}
