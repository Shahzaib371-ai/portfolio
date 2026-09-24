"use client";

import { useEffect, useState } from "react";
import { fallbackContent, getSiteContent, type SiteContent } from "./content";

/**
 * Gives any page the live site content. Renders instantly with the static
 * fallback, then upgrades to the database content once it arrives.
 */
export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(fallbackContent);

  useEffect(() => {
    let alive = true;
    getSiteContent().then((c) => {
      if (alive) setContent(c);
    });
    return () => {
      alive = false;
    };
  }, []);

  return content;
}
