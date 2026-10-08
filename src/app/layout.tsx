import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/gabarito/700.css";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Mhub", template: "%s · Mhub" },
  description: "Кино, цуврал драм онлайн үзэх",
  openGraph: { siteName: "Mhub", locale: "mn_MN", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Remembers that this visitor confirmed they are 18+ (read before first paint so +18 posters never flash unblurred). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(/(^|; )age18=1/.test(document.cookie))document.documentElement.dataset.age18="1"}catch(e){}',
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
