/**
 * Кино Хором brand: a film reel with a face in profile (gold) and the wordmark in Unbounded.
 * Source: the "Kino Khorom Logo" design canvas. Mark geometry is shared by every size.
 */

const GOLD = "#F2A93B";
const REEL = "#2B4C7E";

const HOLES: [number, number][] = [
  [112, 68],
  [161.5, 103.9],
  [142.6, 162.1],
  [81.4, 162.1],
  [62.5, 103.9],
];

const SPOKES: [number, number, number, number][] = [
  [121, 120, 121, 142.2],
  [116.5, 127.8, 97.2, 138.9],
  [107.5, 127.8, 88.2, 116.7],
  [103, 120, 103, 97.8],
  [107.5, 112.2, 126.8, 101.1],
  [116.5, 112.2, 135.8, 123.3],
];

/**
 * The mark. `gap` is the colour of the cut-out ring and the reel holes: pass the background
 * colour it sits on (the app is black). Below ~40px the spokes are left out so it stays crisp.
 */
export function LogoMark({
  size = 40,
  gap = "#000000",
  className,
  title,
}: {
  size?: number;
  gap?: string;
  className?: string;
  title?: string;
}) {
  const small = size < 40;
  return (
    <svg
      viewBox="14 14 220 212"
      width={size}
      height={(size * 212) / 220}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path
        fill={GOLD}
        d="M120 26 C156 16 196 34 206 68 C209 80 208 90 210 98 L226 121 C228 125 225 128 220 129 L215 130 L218 138 L212 142 L216 148 C217 155 213 160 205 160 L200 161 C200 172 196 182 186 187 L182 202 Q160 214 138 208 Z"
      />
      <circle cx="112" cy="120" r={small ? 99 : 95} fill={gap} />
      <circle cx="112" cy="120" r="90" fill={REEL} />
      {small ? (
        <circle cx="112" cy="120" r="30" fill={GOLD} />
      ) : (
        <>
          {HOLES.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="17" fill={gap} />
          ))}
          <circle cx="112" cy="120" r="24" fill={GOLD} />
          <g stroke={REEL} strokeWidth="2.5" strokeLinecap="round">
            {SPOKES.map(([x1, y1, x2, y2]) => (
              <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />
            ))}
          </g>
        </>
      )}
    </svg>
  );
}

/** "КИНО ХОРОМ" in the brand face; `className` sets the size (e.g. text-[20px]). */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-brand font-bold uppercase leading-none tracking-[0.02em] ${className}`}
    >
      Кино <span className="text-gold">Хором</span>
    </span>
  );
}

/** Mark + wordmark side by side (site header, admin, login). */
export function Logo({
  size = 40,
  wordClassName = "text-[20px]",
  gap,
  className = "",
}: {
  size?: number;
  wordClassName?: string;
  gap?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark size={size} gap={gap} />
      <Wordmark className={wordClassName} />
    </span>
  );
}
