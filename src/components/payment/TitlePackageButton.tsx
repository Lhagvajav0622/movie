"use client";
import { useEffect, useState } from "react";
import { BuyButton } from "./BuyButton";

type Pkg = { id: string; days: number; priceMnt: number; includes: string };

/** Package button for a locked title: looks up the cheapest package that unlocks it. Renders nothing if none. */
export function TitlePackageButton({ titleId, className }: { titleId: string; className?: string }) {
  const [pkg, setPkg] = useState<Pkg | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/packages/for-title?titleId=${titleId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => live && setPkg(j?.package ?? null))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [titleId]);
  if (!pkg) return null;
  return (
    <BuyButton
      packageId={pkg.id}
      days={pkg.days}
      label={`Багц · ${pkg.days} хоног`}
      includes={pkg.includes}
      priceMnt={pkg.priceMnt}
      variant="outline"
      className={className}
    />
  );
}
