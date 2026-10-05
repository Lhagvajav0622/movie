/**
 * Encodes videos to HLS, uploads them to Cloudflare R2 and registers the episodes.
 *
 *   One file:   npm run video -- --title <slug> --episode 1 --file "C:\videos\ep01.mp4"
 *   A folder:   npm run video -- --title <slug> --dir "C:\videos\drama"
 *               (files sorted by the number in their name: ep1, ep2, ... ep10)
 *   Test only:  add --dry  (encodes into ./.video-out, no upload, no database)
 *
 * Needs in .env:  DATABASE_URL, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *                 R2_BUCKET (default mhub-videos), VIDEO_BASE_URL
 * ffmpeg/ffprobe come from npm (ffmpeg-static), nothing else to install.
 */
import "dotenv/config";
import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";
import ffprobe from "ffprobe-static";

const SEGMENT_SEC = 6;
const VIDEO_EXT = new Set([".mp4", ".mov", ".mkv", ".m4v", ".webm", ".avi", ".ts"]);

type Rendition = { name: string; short: number; vBitrate: number; audio: number };

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

function run(cmd: string, args: string[], quiet = true): Promise<string> {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => {
      err += d;
      if (!quiet) process.stderr.write(d);
    });
    p.on("close", (code) => (code === 0 ? res(out) : rej(new Error(`${basename(cmd)} failed (${code}):\n${err.slice(-2000)}`))));
  });
}

async function probe(file: string) {
  const out = await run(ffprobe.path, [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height:format=duration",
    "-of", "json",
    file,
  ]);
  const j = JSON.parse(out);
  const s = j.streams?.[0] ?? {};
  return { width: Number(s.width), height: Number(s.height), duration: Number(j.format?.duration ?? 0) };
}

/** Pick renditions by the source's short side; never upscale. */
function ladder(width: number, height: number): Rendition[] {
  const short = Math.min(width, height);
  const vertical = height > width;
  const all: Rendition[] = [
    { name: "480p", short: 480, vBitrate: vertical ? 800 : 1000, audio: 96 },
    { name: "720p", short: 720, vBitrate: vertical ? 1800 : 2500, audio: 128 },
    { name: "1080p", short: 1080, vBitrate: vertical ? 3500 : 4500, audio: 128 },
  ];
  const picked = all.filter((r) => r.short <= short + 8);
  return picked.length ? picked : [all[0]];
}

async function encode(file: string, outDir: string, r: Rendition, vertical: boolean) {
  const dir = join(outDir, r.name);
  mkdirSync(dir, { recursive: true });
  const scale = vertical ? `scale=${r.short}:-2` : `scale=-2:${r.short}`;
  await run(ffmpegPath as unknown as string, [
    "-y", "-i", file,
    "-vf", scale,
    "-c:v", "libx264", "-preset", "veryfast", "-profile:v", "main",
    "-b:v", `${r.vBitrate}k`, "-maxrate", `${Math.round(r.vBitrate * 1.2)}k`, "-bufsize", `${r.vBitrate * 2}k`,
    "-force_key_frames", `expr:gte(t,n_forced*${SEGMENT_SEC})`, "-sc_threshold", "0",
    "-c:a", "aac", "-b:a", `${r.audio}k`, "-ac", "2",
    "-f", "hls", "-hls_time", String(SEGMENT_SEC), "-hls_playlist_type", "vod",
    "-hls_segment_filename", join(dir, "seg_%05d.ts"),
    join(dir, "index.m3u8"),
  ]);
}

async function thumbnail(file: string, out: string, duration: number) {
  const at = Math.min(30, Math.max(1, duration * 0.1));
  await run(ffmpegPath as unknown as string, ["-y", "-ss", String(at), "-i", file, "-frames:v", "1", "-vf", "scale=480:-2", "-q:v", "4", out]);
}

function writeMaster(outDir: string, rs: Rendition[], width: number, height: number) {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3"];
  for (const r of rs) {
    const vertical = height > width;
    const w = vertical ? r.short : Math.round((r.short * width) / height / 2) * 2;
    const h = vertical ? Math.round((r.short * height) / width / 2) * 2 : r.short;
    lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${(r.vBitrate + r.audio) * 1000},RESOLUTION=${w}x${h}`, `${r.name}/index.m3u8`);
  }
  writeFileSync(join(outDir, "master.m3u8"), lines.join("\n") + "\n");
}

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

const numberIn = (name: string) => Number(basename(name, extname(name)).match(/(\d+)(?!.*\d)/)?.[1] ?? NaN);

async function main() {
  const slug = arg("title");
  const dry = flag("dry");
  const file = arg("file");
  const dir = arg("dir");
  if (!slug || (!file && !dir)) {
    console.log("Usage: npm run video -- --title <slug> (--file <path> --episode <n> | --dir <folder>) [--dry]");
    process.exit(1);
  }

  let jobs: { file: string; number: number }[];
  if (file) {
    const n = Number(arg("episode") ?? 1);
    jobs = [{ file: resolve(file), number: n }];
  } else {
    const files = readdirSync(resolve(dir!))
      .filter((f) => VIDEO_EXT.has(extname(f).toLowerCase()))
      .map((f) => resolve(dir!, f));
    const numbered = files.every((f) => Number.isFinite(numberIn(f)));
    files.sort((a, b) => (numbered ? numberIn(a) - numberIn(b) : a.localeCompare(b, undefined, { numeric: true })));
    jobs = files.map((f, i) => ({ file: f, number: numbered ? numberIn(f) : i + 1 }));
  }
  if (!jobs.length) throw new Error("No video files found.");

  // Lazy imports so --dry works without DB / R2 settings.
  const db = dry ? null : await import("./lib/db");
  const r2 = dry ? null : await import("./lib/r2");

  let titleId = "dry-run";
  if (db) {
    const t = await db.findTitleBySlug(slug);
    if (!t) throw new Error(`Title "${slug}" not found. Create it in /admin first (the URL field).`);
    titleId = t.id;
    console.log(`Title: ${t.name} (${t.orientation})`);
  }

  for (const job of jobs) {
    const t0 = Date.now();
    console.log(`\n▶ Episode ${job.number}: ${basename(job.file)}`);
    const info = await probe(job.file);
    if (!info.width || !info.duration) throw new Error(`Cannot read video: ${job.file}`);
    const vertical = info.height > info.width;
    const rs = ladder(info.width, info.height);
    console.log(`  ${info.width}x${info.height}, ${Math.round(info.duration)}s → ${rs.map((r) => r.name).join(", ")}`);

    const episodeId = db ? await db.upsertEpisode(titleId, job.number) : `dry-${job.number}`;
    const outDir = resolve(".video-out", episodeId);
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });

    for (const r of rs) {
      process.stdout.write(`  encoding ${r.name}…`);
      await encode(job.file, outDir, r, vertical);
      process.stdout.write(" done\n");
    }
    writeMaster(outDir, rs, info.width, info.height);
    await thumbnail(job.file, join(outDir, "thumb.jpg"), info.duration);

    if (r2 && db) {
      const files = listFiles(outDir).filter((f) => !f.endsWith("thumb.jpg"));
      process.stdout.write(`  uploading ${files.length} files…`);
      await r2.uploadMany(
        files.map((f) => ({ path: f, key: `v/${episodeId}/${relative(outDir, f).split("\\").join("/")}` })),
      );
      await r2.uploadOne(join(outDir, "thumb.jpg"), `t/${episodeId}.jpg`);
      process.stdout.write(" done\n");
      await db.markEpisodeReady(episodeId, {
        videoKey: `v/${episodeId}`,
        durationSec: Math.round(info.duration),
        segmentSec: SEGMENT_SEC,
        thumbnailUrl: `${(process.env.VIDEO_BASE_URL ?? "").replace(/\/$/, "")}/thumb/${episodeId}.jpg`,
      });
      rmSync(outDir, { recursive: true, force: true });
    } else {
      console.log(`  output: ${outDir}`);
    }
    console.log(`  ✓ ${Math.round((Date.now() - t0) / 1000)}s`);
  }

  if (db) await db.close();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("\n✗", e instanceof Error ? e.message : e);
  process.exit(1);
});

