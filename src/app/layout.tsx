import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { ClickSound } from "@/components/ui/ClickSound";
import "./globals.css";

const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans-3",
  subsets: ["latin"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const DESCRIPTION =
  "Purity is a role-based dental clinic practice-management application — scheduling, patient records, billing, and secure messaging for dentists, hygienists, front-desk staff, and patients.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    template: "%s — Purity",
    default: "Purity",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "Purity",
    description: DESCRIPTION,
    siteName: "Purity",
    images: [{ url: "/brand/purity-logo.png" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Purity",
    description: DESCRIPTION,
    images: ["/brand/purity-logo.png"],
  },
  robots: {
    // Every route in this app is either an auth screen or sits behind a
    // signed-in session — nothing here is meant to be publicly indexed.
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sourceSans3.variable} h-full overflow-x-hidden antialiased`}>
      <body className="min-h-full flex flex-col overflow-x-hidden bg-background text-text-primary">
        <ClickSound />
        {children}
      </body>
    </html>
  );
}
