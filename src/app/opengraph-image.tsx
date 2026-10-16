import { ImageResponse } from "next/og";
import { MARK, RULE, TAGLINE, WORD } from "@/components/brand/logo-paths";

export const alt = "Кино Хором";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FILL = { i: "#002454", g: "#DEA129", c: "#FDFDF9" } as const;
const ALL = [...MARK, ...WORD, ...RULE, ...TAGLINE];

// Plain elements only: the OG renderer does not run components inside <svg>.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FDFDF9",
        }}
      >
        <svg viewBox="425 200 640 760" width={497} height={590}>
          {ALL.map(([role, d], i) => (
            <path key={i} d={d} fill={FILL[role]} />
          ))}
        </svg>
      </div>
    ),
    size,
  );
}
