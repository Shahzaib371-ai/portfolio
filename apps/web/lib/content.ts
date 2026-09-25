/**
 * Runtime content layer — portfolio reads live content from Supabase.
 *
 * The public site is a static export (GitHub Pages), so pages fetch content
 * in the browser with the publishable anon key. RLS on the database only
 * exposes published content publicly. If the fetch fails (offline, Supabase
 * down, keys missing), pages fall back to the static data in ./data.ts so
 * the site never renders blank.
 *
 * Editing flow for the owner: change anything in /admin -> it lands in the
 * database -> the live site shows it on the next visit. No rebuild needed.
 */
import {
  education as fallbackEducation,
  experience as fallbackExperience,
  profile as fallbackProfile,
  projects as fallbackProjects,
  skillGroups as fallbackSkillGroups,
  socialLinks as fallbackSocialLinks,
  type Education,
  type ExperienceItem,
  type Profile,
  type Project,
  type SkillGroup,
  type SocialLink,
} from "./data";

export interface SiteContent {
  profile: Profile;
  projects: Project[];
  skillGroups: SkillGroup[];
  education: Education[];
  experience: ExperienceItem[];
  socialLinks: SocialLink[];
}

export const fallbackContent: SiteContent = {
  profile: fallbackProfile,
  projects: fallbackProjects,
  skillGroups: fallbackSkillGroups,
  education: fallbackEducation,
  experience: fallbackExperience,
  socialLinks: fallbackSocialLinks,
};

function restUrl(table: string, select: string, order?: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const params = new URLSearchParams({ select });
  if (order) params.set("order", order);
  return `${base}/rest/v1/${table}?${params.toString()}`;
}

async function get(table: string, select: string, order?: string): Promise<any[]> {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(restUrl(table, select, order), {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
  return (await res.json()) as any[];
}

function parseJsonArray(raw: string | undefined, fallback: string[]): string[] {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : fallback;
  } catch {
    return fallback;
  }
}

async function fetchSiteContent(): Promise<SiteContent> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("placeholder")) return fallbackContent;

  try {
    const [projectRows, skillRows, eduRows, expRows, socialRows, settingsRows] =
      await Promise.all([
        get(
          "projects",
          "slug,title,description,detailed_description,technologies,category,github_url,live_url,featured",
          "sort_order.asc"
        ),
        get("skills", "name,category", "sort_order.asc"),
        get("education", "degree,institution,description", "sort_order.asc"),
        get("experience", "title,organization,start_date,end_date,description", "sort_order.asc"),
        get("social_links", "platform,url", "sort_order.asc"),
        get("settings", "key,value"),
      ]);

    const projects: Project[] = projectRows.map((r) => ({
      slug: r.slug,
      title: r.title,
      tagline: r.description ?? "",
      description: r.detailed_description ?? "",
      tags: Array.isArray(r.technologies) ? r.technologies : [],
      category: r.category as Project["category"],
      githubUrl: r.github_url ?? undefined,
      liveUrl: r.live_url ?? undefined,
      featured: !!r.featured,
    }));

    const grouped = new Map<string, string[]>();
    for (const s of skillRows) {
      const cat = (s.category as string) || "Other";
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(s.name as string);
    }
    const skillGroups: SkillGroup[] = [...grouped.entries()].map(([category, items]) => ({
      category,
      items,
    }));

    const education: Education[] = eduRows.map((r) => ({
      institution: r.institution as string,
      degree: r.degree as string,
      detail: (r.description as string) ?? "",
    }));

    const experience: ExperienceItem[] = expRows.map((r) => ({
      role: r.title as string,
      organization: r.organization as string,
      period: [r.start_date, r.end_date].filter(Boolean).join(" – "),
      bullets: [],
    }));

    const socialLinks: SocialLink[] = socialRows.map((r) => {
      const platform = r.platform as string;
      return {
        label: platform.charAt(0).toUpperCase() + platform.slice(1),
        url: r.url as string,
      };
    });

    const settings: Record<string, string> = Object.fromEntries(
      settingsRows.map((r) => [r.key as string, (r.value as string) ?? ""])
    );
    const photoShape = settings.profile_photo_shape === "rounded" ? "rounded" : "circle";
    const profile: Profile = {
      name: settings.profile_name || fallbackProfile.name,
      tagline: settings.profile_tagline || fallbackProfile.tagline,
      about: parseJsonArray(settings.profile_about, fallbackProfile.about),
      github: settings.profile_github || fallbackProfile.github,
      photoUrl: settings.profile_photo_url || undefined,
      photoShape,
    };

    return { profile, projects, skillGroups, education, experience, socialLinks };
  } catch {
    return fallbackContent;
  }
}

// One shared request no matter how many components ask.
let cached: Promise<SiteContent> | null = null;
export function getSiteContent(): Promise<SiteContent> {
  if (!cached) cached = fetchSiteContent();
  return cached;
}
