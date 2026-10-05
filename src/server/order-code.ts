const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 lookalikes

/** Short random order code like "MH-7K3QX2". */
export function generateOrderCode(rand: () => number = Math.random): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return `MH-${s}`;
}
