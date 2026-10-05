import Link from "next/link";

/** Two-panel card from the Figma login screens: form on the left, brand panel on the right. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 40%, rgba(94,73,213,.35), transparent 70%), linear-gradient(180deg,#0b0820,#000 70%)",
        }}
      />
      <div className="grid w-full max-w-[960px] overflow-hidden rounded-2xl border border-stroke bg-black shadow-glow md:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
          <Link href="/" className="mb-2 text-center text-4xl font-bold">
            Mhub
          </Link>
          {children}
        </div>
        <div
          aria-hidden
          className="relative hidden md:block"
          style={{
            background:
              "radial-gradient(70% 60% at 50% 30%, rgba(145,130,229,.45), transparent 70%), linear-gradient(160deg,#2a1d6b,#0d0a1f 60%,#000)",
          }}
        >
          <div className="absolute inset-0 grid grid-cols-3 gap-3 p-6 opacity-60 [mask-image:linear-gradient(180deg,#000_30%,transparent)]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-lg"
                style={{
                  background: `linear-gradient(160deg, hsl(${(i * 47 + 220) % 360} 45% 35%), hsl(${(i * 47 + 260) % 360} 40% 12%))`,
                }}
              />
            ))}
          </div>
          <p className="absolute inset-x-0 bottom-10 px-10 text-center text-h4 font-bold">
            Дуртай кино, драмаа
            <br />
            <span className="text-brand-300">хүссэн үедээ</span>
          </p>
        </div>
      </div>
    </div>
  );
}
