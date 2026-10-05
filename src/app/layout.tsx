import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/gabarito/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Mhub", template: "%s · Mhub" },
  description: "Кино, цуврал драм онлайн үзэх",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
