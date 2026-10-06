export default function Loading() {
  return (
    <div className="mx-auto flex max-w-[1120px] animate-pulse flex-col gap-4 px-4 pt-4 md:pt-6" aria-busy aria-label="Ачаалж байна">
      <div className="h-[260px] rounded-lg bg-surface md:h-[458px]" />
      <div className="h-8 w-64 rounded bg-surface" />
      <div className="h-4 w-40 rounded bg-surface" />
      <div className="h-11 w-full rounded-lg bg-surface md:w-[264px]" />
      <div className="mt-4 flex flex-col gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-20 w-[142px] shrink-0 rounded bg-surface" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-32 rounded bg-surface" />
              <div className="h-3 w-16 rounded bg-surface" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
