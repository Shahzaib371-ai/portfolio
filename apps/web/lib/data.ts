/**
 * Portfolio content layer — Phase 2.
 *
 * Everything on the site reads from here. From Phase 3 on, this same shape
 * will be served by the API from the database (Supabase), and the admin
 * dashboard (Phase 4) will edit it. No invented details: anything unknown
 * is an explicit placeholder to be filled in later.
 */

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  /** Short factual summary. Placeholder text is marked clearly. */
  description: string;
  tags: string[];
  category: "IoT" | "Machine Learning" | "Robotics" | "Embedded Systems" | "Computer Vision";
  githubUrl?: string;
  liveUrl?: string;
  featured: boolean;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface Education {
  institution: string;
  degree: string;
  detail: string;
}

export interface ExperienceItem {
  role: string;
  organization: string;
  period: string;
  bullets: string[];
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  tagline: string;
  about: string[];
  github: string;
}

export const profile: Profile = {
  name: "Shahzaib Hasnain",
  tagline: "Computer Engineering Student | Embedded Systems | IoT | Machine Learning | Robotics",
  about: [
    "I'm a Computer Engineering student working across embedded systems, IoT, machine learning, computer vision, and robotics — from microcontroller firmware to deployed web apps.",
    "I like building things end to end: sensing the physical world with hardware, processing it with software, and shipping something people can actually use.",
  ],
  github: "https://github.com/Shahzaib371-ai",
};

export const projects: Project[] = [
  {
    slug: "solar-power-predictor",
    title: "Solar AC Power Predictor",
    tagline: "Machine learning web app that predicts a solar plant's hourly AC power output from weather and time data.",
    description:
      "Flask + linear-regression app: takes hour, shortwave radiation, air temperature, and cloud cover, and predicts hourly AC power output with NumPy-only inference. Premium dark UI, prediction verified working.",
    tags: ["Python", "Flask", "Machine Learning", "NumPy", "pandas"],
    category: "Machine Learning",
    githubUrl: "https://github.com/Shahzaib371-ai/ML-Based-Solar-Power-Predictor-AC-",
    featured: true,
  },
  {
    slug: "smartvolt-iot-meter",
    title: "SmartVolt — IoT Prepaid Electricity Meter",
    tagline: "IoT-based prepaid electricity metering concept.",
    description:
      "Details coming soon — this project will be documented through the admin dashboard (Phase 4).",
    tags: ["IoT", "Embedded Systems"],
    category: "IoT",
    featured: true,
  },
  {
    slug: "fire-fighting-robot",
    title: "ATmega32 Fire-Fighting Robot",
    tagline: "Autonomous fire-detecting robot built on the ATmega32 microcontroller.",
    description:
      "Details coming soon — this project will be documented through the admin dashboard (Phase 4).",
    tags: ["ATmega32", "C", "Robotics", "Embedded Systems"],
    category: "Robotics",
    featured: true,
  },
  {
    slug: "air-quality-monitor",
    title: "Air-Quality Monitoring System",
    tagline: "Sensor-based system for monitoring air quality.",
    description:
      "Details coming soon — this project will be documented through the admin dashboard (Phase 4).",
    tags: ["IoT", "Sensors"],
    category: "IoT",
    featured: false,
  },
  {
    slug: "computer-vision",
    title: "Computer Vision Projects",
    tagline: "Image and video processing experiments with OpenCV.",
    description:
      "Details coming soon — this project will be documented through the admin dashboard (Phase 4).",
    tags: ["OpenCV", "Python", "Computer Vision"],
    category: "Computer Vision",
    featured: false,
  },
  {
    slug: "embedded-systems",
    title: "Embedded Systems Projects",
    tagline: "Microcontroller firmware and hardware interfacing work.",
    description:
      "Details coming soon — this project will be documented through the admin dashboard (Phase 4).",
    tags: ["C", "Microcontrollers", "Hardware"],
    category: "Embedded Systems",
    featured: false,
  },
];

export const skillGroups: SkillGroup[] = [
  { category: "Embedded & Hardware", items: ["C", "ATmega32 / AVR", "Microcontroller interfacing"] },
  { category: "IoT", items: ["Sensors", "Embedded networking basics"] },
  { category: "Machine Learning", items: ["Python", "NumPy", "pandas", "scikit-learn", "Linear regression"] },
  { category: "Computer Vision", items: ["OpenCV", "Image processing"] },
  { category: "Web", items: ["TypeScript", "Next.js", "React", "Flask", "Tailwind CSS"] },
  { category: "Tools", items: ["Git", "GitHub", "PostgreSQL"] },
];

export const education: Education[] = [
  {
    institution: "FAST NUCES",
    degree: "B.S. Computer Engineering",
    detail: "Final-year student. Details editable via admin (Phase 4).",
  },
];

export const experience: ExperienceItem[] = [
  {
    role: "Experience entries coming soon",
    organization: "Editable via admin dashboard (Phase 4)",
    period: "",
    bullets: [],
  },
];

export const socialLinks: SocialLink[] = [
  { label: "GitHub", url: "https://github.com/Shahzaib371-ai" },
];

export const siteMeta = {
  title: "Shahzaib Hasnain — Computer Engineering | Embedded, IoT, ML, Robotics",
  description:
    "Portfolio of Shahzaib Hasnain, Computer Engineering student building embedded systems, IoT, machine learning, computer vision, and robotics projects.",
  baseUrl: "https://shahzaib371-ai.github.io/portfolio",
};

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function featuredProjects(): Project[] {
  return projects.filter((p) => p.featured);
}
