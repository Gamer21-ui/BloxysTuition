import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { PwaRegister } from "@/components/pwa-register";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: BRAND.name, template: `%s · ${BRAND.short}` },
  description: BRAND.description,
  applicationName: BRAND.short,
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: BRAND.short, statusBarStyle: "black-translucent" },
  openGraph: { title: BRAND.name, description: BRAND.description, url: site, siteName: BRAND.name, type: "website", images: ["/icons/og.png"] },
  twitter: { card: "summary_large_image", title: BRAND.name, description: BRAND.description, images: ["/icons/og.png"] },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#58cc02",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = await cookies();
  const theme = ["bloxy", "gamer", "retro"].includes(c.get("fb_theme")?.value || "") ? c.get("fb_theme")!.value : "bloxy";
  const mode = c.get("fb_mode")?.value === "dark" ? "dark" : "light";
  return (
    <html lang="en" data-theme={theme} data-mode={mode}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;700&family=IBM+Plex+Mono:wght@400;600&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600&family=Lilita+One&family=Nunito:wght@400;600;800&family=Silkscreen&display=swap"
        />
      </head>
      <body className="min-h-dvh">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
