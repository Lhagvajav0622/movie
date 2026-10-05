/**
 * Who may watch what. Pure functions so they are easy to test.
 *
 * Rule: a title is fully watchable if it is free (price 0) or the user owns it.
 * Otherwise the viewer gets `freePreviewSec` seconds, counted cumulatively from
 * episode 1 (so a series of 2.5-minute episodes gives the first 2 episodes).
 */

export type EpisodeLite = { id: string; number: number; durationSec: number };

export type Access =
  | { kind: "full" }
  | { kind: "preview"; allowedSec: number } // watch first N seconds of this episode
  | { kind: "locked" };

export function episodeAccess(opts: {
  priceMnt: number;
  freePreviewSec: number;
  owned: boolean;
  episodes: EpisodeLite[]; // all episodes of the title
  episodeId: string;
}): Access {
  if (opts.priceMnt <= 0 || opts.owned) return { kind: "full" };

  const sorted = [...opts.episodes].sort((a, b) => a.number - b.number);
  let remaining = opts.freePreviewSec;
  for (const ep of sorted) {
    if (ep.id === opts.episodeId) {
      if (remaining <= 0) return { kind: "locked" };
      if (remaining >= ep.durationSec && ep.durationSec > 0) return { kind: "full" };
      return { kind: "preview", allowedSec: remaining };
    }
    remaining -= ep.durationSec;
  }
  return { kind: "locked" };
}
