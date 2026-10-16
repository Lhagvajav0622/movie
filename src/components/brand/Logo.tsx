import { MARK, RULE, TAGLINE, WORD, type LogoPath } from "./logo-paths";

/**
 * Кино Хором logo. The artwork is navy + gold on light; on the dark site the navy ("ink") becomes
 * warm white and the cut-outs take the background colour, so pass `cut` = the colour behind the logo.
 */
const GOLD = "#DEA129";
const INK_DARK = "#F4F1EA";
const INK_LIGHT = "#002454";

type Look = { ink?: string; cut?: string };

function Paths({
  paths,
  ink,
  cut,
  transform,
}: { paths: LogoPath[]; transform?: string } & Required<Look>) {
  return (
    <g transform={transform}>
      {paths.map(([role, d], i) => (
        <path
          key={i}
          d={d}
          fill={role === "g" ? GOLD : role === "i" ? ink : cut}
        />
      ))}
    </g>
  );
}

function svgProps(title: string | undefined, className: string | undefined) {
  return {
    className,
    role: title ? ("img" as const) : undefined,
    "aria-label": title,
    "aria-hidden": title ? undefined : (true as const),
  };
}

/** Just the picture: film strip, figure, lens and star. Aspect ≈ 1.5 : 1. */
export function LogoMark({
  height = 40,
  ink = INK_DARK,
  cut = "#000000",
  className,
  title,
}: Look & { height?: number; className?: string; title?: string }) {
  return (
    <svg
      viewBox="436 206 608 400"
      height={height}
      width={(height * 608) / 400}
      {...svgProps(title, className)}
    >
      <Paths paths={MARK} ink={ink} cut={cut} />
    </svg>
  );
}

// Lockup geometry (artwork coordinates): mark spans 439-1040 × 209-604, wordmark 451-1024 × 641-847.
const LOCKUP_DX = 649; // wordmark left edge moves to x=1100, 60 right of the mark
const LOCKUP_DY = -337.5; // wordmark centre meets the mark's centre line

/** Mark with the two-line КИНО / ХОРОМ wordmark to its right (site header, admin). */
export function Logo({
  height = 44,
  ink = INK_DARK,
  cut = "#000000",
  className,
  title = "Кино Хором",
}: Look & { height?: number; className?: string; title?: string }) {
  return (
    <svg
      viewBox="436 206 1240 402"
      height={height}
      width={(height * 1240) / 402}
      {...svgProps(title, className)}
    >
      <Paths paths={MARK} ink={ink} cut={cut} />
      <Paths
        paths={WORD}
        ink={ink}
        cut={cut}
        transform={`translate(${LOCKUP_DX} ${LOCKUP_DY})`}
      />
    </svg>
  );
}

/** Full stacked logo with the tagline (login, big placements). */
export function LogoStacked({
  height = 220,
  ink = INK_DARK,
  cut = "#000000",
  className,
  title = "Кино Хором. Хоромхон зуурын тайхамшиг",
}: Look & { height?: number; className?: string; title?: string }) {
  return (
    <svg
      viewBox="425 200 640 760"
      height={height}
      width={(height * 640) / 760}
      {...svgProps(title, className)}
    >
      <Paths paths={MARK} ink={ink} cut={cut} />
      <Paths paths={WORD} ink={ink} cut={cut} />
      <Paths paths={RULE} ink={ink} cut={cut} />
      <Paths paths={TAGLINE} ink={ink} cut={cut} />
    </svg>
  );
}

/** Colours of the original light-background artwork, for places that sit on white / off-white. */
export const LOGO_ON_LIGHT = { ink: INK_LIGHT, cut: "#FDFDF9" } as const;
