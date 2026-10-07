/** True while an admin-granted "Pro" pass is valid. */
export const proActive = (
  a: { expiresAt: Date | null } | undefined | null,
  now = new Date(),
) => Boolean(a) && (!a!.expiresAt || a!.expiresAt > now);

/** Whole days left on a pass (rounded up); null = no end date. */
export const proDaysLeft = (expiresAt: Date | null, now = new Date()) =>
  expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000))
    : null;
