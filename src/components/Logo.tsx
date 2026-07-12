interface LogoProps {
  size?: number
}

/** Circle-badge mark echoing the ReadScore logo: a shelf of book spines rising into a bar chart, capped with a star. */
export default function Logo({ size = 32 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="logo-mark" aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="none" stroke="var(--text-primary)" strokeWidth="2" />
      <rect x="10" y="30" width="28" height="2.5" rx="1" fill="var(--text-primary)" />
      <rect x="13" y="16" width="4.5" height="14" rx="1" fill="var(--accent-sage)" />
      <rect x="19" y="18" width="4.5" height="12" rx="1" fill="var(--accent-sage-light)" />
      <rect x="25" y="14" width="4.5" height="16" rx="1" fill="var(--text-primary)" />
      <rect x="31" y="22" width="3" height="8" rx="1" fill="var(--accent-sage)" />
      <path
        d="M35.5 10.5l1.1 2.3 2.5.4-1.8 1.8.4 2.5-2.2-1.2-2.2 1.2.4-2.5-1.8-1.8 2.5-.4z"
        fill="var(--accent-gold)"
      />
    </svg>
  )
}
