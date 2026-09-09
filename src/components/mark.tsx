export function Mark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 800 800" fill="currentColor" aria-hidden="true">
    <rect x="280" y="560" width="240" height="240" />
    <rect x="280" y="280" width="240" height="240" />
    <rect y="280" width="240" height="240" />
    <path d="M560 0H280V240H560V520H800V0H560Z" />
  </svg>;
}
