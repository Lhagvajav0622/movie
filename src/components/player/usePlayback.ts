"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type Hls from "hls.js";

export type PlayInfo = {
  url: string;
  /** "mp4": a plain file (video.src); "hls": a stream (hls.js / Safari) */
  kind: "mp4" | "hls";
  access: "full" | "preview";
  allowedSec: number | null;
  resumeSec: number;
  durationSec: number;
  priceMnt: number;
};

/** Links last 2 hours; renew when one is older than this and the viewer presses play again. */
const LINK_STALE_MS = 100 * 60 * 1000;

const LOADING = { status: "loading" } as const;
const IDLE = { status: "idle" } as const;

export type PlayState =
  | { status: "idle" | "loading" }
  | { status: "ready"; info: PlayInfo }
  | { status: "locked"; priceMnt: number }
  | { status: "unavailable" }
  | { status: "error" };

async function fetchPlayState(episodeId: string): Promise<PlayState> {
  try {
    const r = await fetch(`/api/episodes/${episodeId}/play`);
    const body = await r.json().catch(() => ({}));
    if (r.status === 402) return { status: "locked", priceMnt: body.priceMnt ?? 0 };
    if (r.status === 404 || r.status === 503) return { status: "unavailable" };
    if (!r.ok) return { status: "error" };
    return { status: "ready", info: body as PlayInfo };
  } catch {
    return { status: "error" };
  }
}

/**
 * Loads a signed HLS URL for an episode into a <video>, resumes position,
 * and reports progress every 10 s and on pause / leave.
 */
export function usePlayback(episodeId: string | null, active: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  // Results are keyed by episode so switching episodes shows "loading" without a synchronous reset.
  const [result, setResult] = useState<{ id: string; state: PlayState } | null>(null);
  const [endedFor, setEndedFor] = useState<string | null>(null);
  const state: PlayState = useMemo(
    () => (episodeId && active ? (result?.id === episodeId ? result.state : LOADING) : IDLE),
    [episodeId, active, result],
  );
  const previewEnded = endedFor === episodeId;
  const issuedAt = useRef(0); // when the current signed link was issued
  const refreshes = useRef(0); // renewals since the last successful playback

  const saveProgress = useCallback(
    (keepalive = false) => {
      const v = videoRef.current;
      if (!v || !episodeId || state.status !== "ready" || !v.currentTime) return;
      fetch(`/api/episodes/${episodeId}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionSec: v.currentTime, durationSec: state.info.durationSec || v.duration || 0 }),
        keepalive,
      }).catch(() => {});
    },
    [episodeId, state],
  );

  // Fetch the signed URL when the episode becomes active.
  useEffect(() => {
    if (!episodeId || !active) return;
    let cancelled = false;
    const set = (st: PlayState) => {
      if (cancelled) return;
      issuedAt.current = Date.now();
      refreshes.current = 0;
      setResult({ id: episodeId, state: st });
    };
    fetchPlayState(episodeId).then(set);
    return () => {
      cancelled = true;
    };
  }, [episodeId, active]);

  // Links are short-lived. If one stops working (a long pause, a seek after it expired), ask for a new one and
  // continue from the same spot instead of leaving a broken player.
  const refresh = useCallback(async () => {
    const v = videoRef.current;
    if (!v || !episodeId || state.status !== "ready" || refreshes.current >= 3) return;
    refreshes.current += 1;
    const position = v.currentTime;
    const next = await fetchPlayState(episodeId);
    if (next.status !== "ready") return;
    issuedAt.current = Date.now();
    setResult({ id: episodeId, state: { status: "ready", info: { ...next.info, resumeSec: position } } });
  }, [episodeId, state]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || state.status !== "ready") return;
    const onError = () => {
      if (v.currentSrc) void refresh();
    };
    // Playing again after a long pause: the old link may be gone, so renew it first.
    const onPlay = () => {
      if (Date.now() - issuedAt.current > LINK_STALE_MS) void refresh();
    };
    const onPlaying = () => (refreshes.current = 0);
    v.addEventListener("error", onError);
    v.addEventListener("play", onPlay);
    v.addEventListener("playing", onPlaying);
    return () => {
      v.removeEventListener("error", onError);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("playing", onPlaying);
    };
  }, [state, refresh]);

  // Attach the stream.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || state.status !== "ready") return;
    const { url, resumeSec } = state.info;
    let destroyed = false;

    const seek = () => {
      if (resumeSec > 3 && v.duration && resumeSec < v.duration - 5) v.currentTime = resumeSec;
    };
    v.addEventListener("loadedmetadata", seek, { once: true });

    if (state.info.kind === "mp4") {
      v.src = url; // plain MP4 plays natively everywhere, with Range requests for seeking
    } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = url; // Safari / iOS play HLS natively
    } else {
      import("hls.js").then(({ default: HlsCtor }) => {
        if (destroyed || !HlsCtor.isSupported()) return;
        const hls = new HlsCtor({ startLevel: -1, capLevelToPlayerSize: true, maxBufferLength: 30 });
        hlsRef.current = hls;
        hls.on(HlsCtor.Events.ERROR, (_e, data) => {
          if (data.fatal) v.dispatchEvent(new Event("error")); // handled by the renewal logic above
        });
        hls.loadSource(url);
        hls.attachMedia(v);
      });
    }
    return () => {
      destroyed = true;
      v.removeEventListener("loadedmetadata", seek);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      v.removeAttribute("src");
      v.load();
    };
  }, [state]);

  // Periodic + lifecycle progress saving, and preview-end detection.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || state.status !== "ready") return;
    const t = setInterval(() => !v.paused && saveProgress(), 10_000);
    const onPause = () => saveProgress();
    const onEnded = () => {
      saveProgress();
      if (state.info.access === "preview") setEndedFor(episodeId);
    };
    const onHide = () => document.visibilityState === "hidden" && saveProgress(true);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(t);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      document.removeEventListener("visibilitychange", onHide);
      saveProgress(true);
    };
  }, [state, saveProgress, episodeId]);

  return { videoRef, state, previewEnded };
}

/** Tries to play with sound; if the browser blocks it, plays muted and reports that. */
export async function playWithSound(v: HTMLVideoElement): Promise<"sound" | "muted" | "blocked"> {
  try {
    v.muted = false;
    await v.play();
    return "sound";
  } catch {
    try {
      v.muted = true;
      await v.play();
      return "muted";
    } catch {
      return "blocked";
    }
  }
}
