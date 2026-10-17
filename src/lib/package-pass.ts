/** New end date when a pass is bought: extends the current pass if it is still running, otherwise starts now. */
export function extendPass(current: Date | null | undefined, days: number, now = new Date()): Date {
  const start = current && current > now ? current : now;
  return new Date(start.getTime() + days * 86_400_000);
}
