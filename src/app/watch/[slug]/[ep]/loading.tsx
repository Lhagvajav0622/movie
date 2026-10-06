export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black" aria-busy aria-label="Ачаалж байна">
      <span className="size-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  );
}
