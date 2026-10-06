export type FastStart = "ok" | "moov-last" | "not-mp4";

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
    if (type === "moov") return "ok";
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
