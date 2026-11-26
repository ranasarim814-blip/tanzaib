import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Noto_Nastaliq_Urdu } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { BRAND } from "@/lib/config";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const nastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq",
  subsets: ["arabic"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl("/")),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline} | Luxury Eastern Wear`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    "Tanzaib (تنزیب) — hand-embroidered bridal, formal and luxury pret eastern wear, made by master karigars in Pakistan. Cash on delivery nationwide.",
  applicationName: BRAND.name,
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    locale: "en_PK",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: BRAND.name }],
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#1C1A17",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-PK" className={`${cormorant.variable} ${manrope.variable} ${nastaliq.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
