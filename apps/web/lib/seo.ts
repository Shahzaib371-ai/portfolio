"use client";

// Note: the frontend talks to Supabase with the publishable key
// (sb_publishable_*), baked into the static build via NEXT_PUBLIC_SUPABASE_ANON_KEY.

import { useEffect } from "react";
import { profile, siteMeta, socialLinks } from "./data";

/** Precomputed JSON-LD string (module scope avoids a Next.js prerender quirk
 *  with JSON.stringify inside the root layout during static export). */
export const personJsonLdString = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  url: siteMeta.baseUrl,
  image: `${siteMeta.baseUrl}/profile.jpg`,
  jobTitle: "Computer Engineering Student",
  description: siteMeta.description,
  knowsAbout: [
    "Embedded Systems",
    "IoT",
    "Machine Learning",
    "Computer Vision",
    "Robotics",
    "Software Development",
  ],
  sameAs: [profile.github, ...socialLinks.map((s) => s.url)],
});

/** JSON-LD Person schema for rich results / knowledge panel. */
export function personJsonLd() {
  return JSON.parse(personJsonLdString);
}

/**
 * Per-page SEO for client-rendered pages (the site is a static export, so
 * pages are client components and can't export `metadata`). Googlebot
 * renders JavaScript, so updating document title/meta at runtime works.
 */
export function Seo({
  title,
  description,
  path,
}: {
  title?: string;
  description?: string;
  path: string;
}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | Shahzaib Hasnain` : siteMeta.title;
    document.title = fullTitle;

    const setMeta = (key: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) {
      setMeta("description", description);
      setMeta("og:description", description, "property");
      setMeta("twitter:description", description);
    }
    setMeta("og:title", fullTitle, "property");
    setMeta("twitter:title", fullTitle);

    let canon = document.querySelector('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement("link");
      canon.setAttribute("rel", "canonical");
      document.head.appendChild(canon);
    }
    canon.setAttribute("href", `${siteMeta.baseUrl}${path}`);
  }, [title, description, path]);

  return null;
}
