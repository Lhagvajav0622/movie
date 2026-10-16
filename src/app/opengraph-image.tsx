import { ImageResponse } from "next/og";

export const alt = "Кино Хором";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GOLD = "#F2A93B";
const REEL = "#2B4C7E";
const BG = "#0E1525";
const HOLES: [number, number][] = [
  [112, 68],
  [161.5, 103.9],
  [142.6, 162.1],
  [81.4, 162.1],
  [62.5, 103.9],
];

// The share image uses the mark plus the Latin spelling: the OG renderer ships no Cyrillic brand font.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          background: BG,
          color: "#F5F1E8",
        }}
      >
        <svg viewBox="14 14 220 212" width={320} height={308}>
          <path
            fill={GOLD}
            d="M120 26 C156 16 196 34 206 68 C209 80 208 90 210 98 L226 121 C228 125 225 128 220 129 L215 130 L218 138 L212 142 L216 148 C217 155 213 160 205 160 L200 161 C200 172 196 182 186 187 L182 202 Q160 214 138 208 Z"
          />
          <circle cx="112" cy="120" r="95" fill={BG} />
          <circle cx="112" cy="120" r="90" fill={REEL} />
          {HOLES.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="17" fill={BG} />
          ))}
          <circle cx="112" cy="120" r="24" fill={GOLD} />
        </svg>
        <div
          style={{
            display: "flex",
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: 6,
          }}
        >
          KINO&nbsp;<span style={{ color: GOLD }}>KHOROM</span>
        </div>
      </div>
    ),
    size,
  );
}
