import type { MetadataRoute } from "next";
import { projects, siteMeta } from "../lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteMeta.baseUrl;
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/projects`, lastModified: new Date() },
    { url: `${base}/resume`, lastModified: new Date() },
    ...projects.map((p) => ({
      url: `${base}/projects/${p.slug}`,
      lastModified: new Date(),
    })),
  ];
}
