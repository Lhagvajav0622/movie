/** Rewrites an MP4 so it can start streaming immediately (moves the index to the front). No re-encoding, takes seconds.
 *  Usage:  npm run faststart -- "C:\videos\film.mp4"   → writes "C:\videos\film.faststart.mp4"
 */
import { spawnSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";

const input = process.argv[2];
if (!input) {
  console.error('Usage: npm run faststart -- "path\\to\\video.mp4"');
  process.exit(1);
}
const output = input.replace(/\.mp4$/i, "") + ".faststart.mp4";
const r = spawnSync(ffmpeg as string, ["-y", "-i", input, "-c", "copy", "-movflags", "+faststart", output], { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`\nDone: ${output}`);
