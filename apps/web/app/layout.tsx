import type { Metadata } from "next";
import type { ReactNode } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { siteMeta } from "../lib/data";
import { personJsonLdString } from "../lib/seo";
import "./globals.css";

const ogImage = `${siteMeta.baseUrl}/og-image.png`;

export const metadata: Metadata = {
  title: siteMeta.title,
  description: siteMeta.description,
  metadataBase: new URL(siteMeta.baseUrl),
  alternates: { canonical: siteMeta.baseUrl },
  openGraph: {
    title: siteMeta.title,
    description: siteMeta.description,
    type: "website",
    url: siteMeta.baseUrl,
    siteName: "Shahzaib Hasnain — Portfolio",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "Shahzaib Hasnain — Portfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteMeta.title,
    description: siteMeta.description,
    images: [ogImage],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: personJsonLdString }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
