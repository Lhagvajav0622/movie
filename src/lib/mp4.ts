export type FastStart = "ok" | "moov-last" | "fragmented" | "not-mp4";

/**
 * Checks that an MP4's "moov" box (the index a player needs first) comes before the "mdat" box (the video data).
 * Such files ("faststart") start playing and seek immediately when streamed; others must be fully downloaded first.
 * `read(offset, length)` returns bytes of the file, so it works for a File.slice() in the browser or a Buffer in tests.
 */
export async function checkFastStart(
  read: (offset: number, length: number) => Promise<Uint8Array>,
  fileSize: number,
): Promise<FastStart> {
  let offset = 0;
  for (let i = 0; i < 32 && offset + 8 <= fileSize; i++) {
    const h = await read(offset, 16);
    if (h.length < 8) return "not-mp4";
    const view = new DataView(h.buffer, h.byteOffset, h.byteLength);
    let size = view.getUint32(0);
    const type = String.fromCharCode(h[4], h[5], h[6], h[7]);
    if (i === 0 && type !== "ftyp") return "not-mp4";
    if (type === "moov") {
      // Fragmented MP4 (e.g. downloaded from YouTube): the index is empty and the data sits in hundreds of tiny
      // fragments, so browsers need many round trips before they can start. It must be remuxed to a normal MP4.
      const moov = await read(offset, Math.min(size || 0, 1 << 20));
      return new TextDecoder("latin1").decode(moov).includes("mvex")
        ? "fragmented"
        : "ok";
    }
    if (type === "mdat") return "moov-last";
    if (size === 1) {
      if (h.length < 16) return "not-mp4";
      size = Number(view.getBigUint64(8));
    } else if (size === 0) {
      return "moov-last"; // box runs to the end of the file: nothing can follow it
    }
    if (size < 8) return "not-mp4";
    offset += size;
  }
  return "not-mp4";
}

/* ------------------------------------------------------------------ */
/* Automatic "faststart": move the index (moov) in front of the video  */
/* data (mdat) without re-encoding, entirely in the browser.           */
/* ------------------------------------------------------------------ */

type Box = { type: string; start: number; size: number };

async function topBoxes(file: Blob): Promise<Box[]> {
  const out: Box[] = [];
  let off = 0;
  while (off + 8 <= file.size) {
    const h = new Uint8Array(await file.slice(off, off + 16).arrayBuffer());
    const dv = new DataView(h.buffer);
    let size = dv.getUint32(0);
    const type = String.fromCharCode(h[4], h[5], h[6], h[7]);
    if (size === 1) size = Number(dv.getBigUint64(8));
    else if (size === 0) size = file.size - off;
    if (size < 8) throw new Error("bad-box");
    out.push({ type, start: off, size });
    off += size;
  }
  return out;
}

const CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl"]);

/** Adds `delta` to every chunk offset (stco / co64) inside a moov box, in place. */
export function shiftChunkOffsets(buf: Uint8Array, delta: number): void {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const walk = (start: number, end: number) => {
    let p = start;
    while (p + 8 <= end) {
      let size = dv.getUint32(p);
      const type = String.fromCharCode(
        buf[p + 4],
        buf[p + 5],
        buf[p + 6],
        buf[p + 7],
      );
      let header = 8;
      if (size === 1) {
        size = Number(dv.getBigUint64(p + 8));
        header = 16;
      }
      if (size < header || p + size > end) throw new Error("bad-box");
      if (CONTAINERS.has(type)) walk(p + header, p + size);
      else if (type === "stco") {
        const n = dv.getUint32(p + header + 4);
        for (let i = 0; i < n; i++) {
          const at = p + header + 8 + i * 4;
          const v = dv.getUint32(at) + delta;
          if (v > 0xffffffff) throw new Error("too-large");
          dv.setUint32(at, v);
        }
      } else if (type === "co64") {
        const n = dv.getUint32(p + header + 4);
        for (let i = 0; i < n; i++) {
          const at = p + header + 8 + i * 8;
          dv.setBigUint64(at, dv.getBigUint64(at) + BigInt(delta));
        }
      }
      p += size;
    }
  };
  walk(0, buf.length);
}

/**
 * Returns a Blob with the same MP4 but the index first. Nothing is re-encoded and the file is not loaded into memory
 * (the Blob only references slices of the original), so a multi-GB film takes a moment.
 */
export async function makeFastStart(file: Blob): Promise<Blob> {
  const boxes = await topBoxes(file);
  const moov = boxes.find((b) => b.type === "moov");
  const ftyp = boxes[0];
  if (!moov || !ftyp || ftyp.type !== "ftyp") throw new Error("unsupported");
  const firstMdat = boxes.findIndex((b) => b.type === "mdat");
  if (firstMdat < 0) throw new Error("unsupported");
  if (boxes.indexOf(moov) < firstMdat) return file; // already faststart
  if (boxes.some((b) => b.type === "mdat" && b.start > moov.start))
    throw new Error("unsupported");
  if (moov.size > 128 * 1024 * 1024) throw new Error("unsupported");
  const moovBytes = new Uint8Array(
    await file.slice(moov.start, moov.start + moov.size).arrayBuffer(),
  );
  // The index moves in front of all video data, so every data offset grows by the index size.
  shiftChunkOffsets(moovBytes, moov.size);
  const ftypEnd = ftyp.start + ftyp.size;
  return new Blob(
    [
      file.slice(0, ftypEnd),
      moovBytes,
      file.slice(ftypEnd, moov.start),
      file.slice(moov.start + moov.size),
    ],
    {
      type: "video/mp4",
    },
  );
}
