/** Shown instantly while a page in the main area loads, so a tap always feels answered. */
export default function Loading() {
  return (
    <div className="mx-auto flex max-w-[1120px] animate-pulse flex-col gap-6 px-4 pt-4 md:pt-6" aria-busy aria-label="Ачаалж байна">
      <div className="h-[318px] rounded-lg bg-surface md:h-[458px]" />
      <div className="h-6 w-48 rounded bg-surface" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-[216px] w-[148px] shrink-0 rounded bg-surface md:h-[244px] md:w-[160px]" />
        ))}
      </div>
    </div>
  );
}
