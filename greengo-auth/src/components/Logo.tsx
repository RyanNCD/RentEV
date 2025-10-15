// Logo mô phỏng "G" + tia sét (SVG thuần để dễ nhúng)
export default function Logo({ size = 140 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="GreenGo logo"
    >
      <defs>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity="0.35" />
        </filter>
      </defs>
      <circle cx="100" cy="100" r="88" fill="#22c55e" opacity="0.15" />
      <path
        d="M100 28a72 72 0 1 0 72 72h-28"
        fill="none"
        stroke="#22c55e"
        strokeWidth="18"
        strokeLinecap="round"
        filter="url(#soft)"
      />
      <polygon
        points="98,62 76,110 104,110 92,142 132,90 104,90"
        fill="#16a34a"
        filter="url(#soft)"
      />
      {/* “gờ” ngoài để giống chữ G kép */}
      <circle cx="100" cy="100" r="86" fill="none" stroke="#16a34a" strokeWidth="4" opacity=".6"/>
    </svg>
  );
}
