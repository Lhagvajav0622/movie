/**
 * Who may watch what. Pure functions so they are easy to test.
 *
 * A title is fully watchable if it is free (price 0) or the user owns it. Otherwise, per episode:
 *  1. The episode has a separate free clip (preview MP4) → the viewer watches that clip
 *     ("clip"). If the episode has no paid version at all, the clip *is* the episode (a free episode).
 *  2. The episode has a legacy HLS video → `freePreviewSec` seconds, counted cumulatively from
 *     episode 1 (so a series of 2.5-minute episodes gives the first 2 episodes).
 *  3. Anything else (e.g. only a paid MP4) is locked.
 */

export type EpisodeLite = {
  id: string;
  number: number;
  durationSec: number;
  /** a separate free clip (MP4) exists */
  hasPreviewClip?: boolean;
  /** a paid version exists (full MP4 or legacy HLS) */
  hasFull?: boolean;
  /** legacy HLS exists (cut by time). Undefined = assume yes (old data) */
  hasHls?: boolean;
};

export type Access =
  | { kind: "full" }
  | { kind: "preview"; allowedSec: number } // legacy HLS: watch first N seconds of this episode
  | { kind: "clip" } // watch the separate free clip, then buy
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
  const me = sorted.find((e) => e.id === opts.episodeId);
  if (me?.hasPreviewClip) return me.hasFull === false ? { kind: "full" } : { kind: "clip" };
  if (me && me.hasHls === false) return { kind: "locked" };

  // Legacy HLS: cumulative free minutes. Only HLS episodes take part in the count.
  let remaining = opts.freePreviewSec;
  for (const ep of sorted) {
    if (ep.hasHls === false) continue;
    if (ep.id === opts.episodeId) {
      if (remaining <= 0) return { kind: "locked" };
      if (remaining >= ep.durationSec && ep.durationSec > 0) return { kind: "full" };
      return { kind: "preview", allowedSec: remaining };
    }
    remaining -= ep.durationSec;
  }
  return { kind: "locked" };
}
