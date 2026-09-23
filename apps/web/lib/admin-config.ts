// Field + entity definitions driving the generic admin CRUD UI.
// Column names are snake_case to match the Supabase tables.

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "stringlist";

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

export interface EntityConfig {
  table: string;
  label: string;
  singular: string;
  /** column used for default ordering */
  orderBy: string;
  /** columns shown in the list table */
  listColumns: string[];
  fields: Field[];
}

export const entities: EntityConfig[] = [
  {
    table: "projects",
    label: "Projects",
    singular: "Project",
    orderBy: "sort_order",
    listColumns: ["title", "status", "featured"],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", placeholder: "smartvolt-iot-meter", required: true },
      { name: "description", label: "Short description", type: "textarea", required: true },
      { name: "detailed_description", label: "Detailed description", type: "textarea" },
      { name: "technologies", label: "Technologies (comma separated)", type: "stringlist", placeholder: "ESP32, MQTT, React" },
      { name: "category", label: "Category", type: "text", placeholder: "IoT / ML / Embedded / Robotics" },
      { name: "github_url", label: "GitHub URL", type: "text" },
      { name: "live_url", label: "Live URL", type: "text" },
      { name: "images", label: "Image URLs (comma separated)", type: "stringlist" },
      { name: "video_url", label: "Video URL", type: "text" },
      { name: "features", label: "Features (comma separated)", type: "stringlist" },
      { name: "project_date", label: "Project date", type: "text", placeholder: "2026-03 (YYYY-MM)" },
      { name: "featured", label: "Featured on home page", type: "boolean" },
      { name: "status", label: "Status", type: "select", options: ["draft", "published", "hidden"] },
      { name: "sort_order", label: "Sort order", type: "number" },
    ],
  },
  {
    table: "skills",
    label: "Skills",
    singular: "Skill",
    orderBy: "sort_order",
    listColumns: ["name", "category", "level"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "category", label: "Category", type: "text", placeholder: "Embedded / ML / Software" },
      { name: "level", label: "Level (0–100)", type: "number" },
      { name: "sort_order", label: "Sort order", type: "number" },
    ],
  },
  {
    table: "experience",
    label: "Experience",
    singular: "Experience",
    orderBy: "sort_order",
    listColumns: ["title", "organization"],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "organization", label: "Organization", type: "text", required: true },
      { name: "start_date", label: "Start date", type: "text", placeholder: "2024-09" },
      { name: "end_date", label: "End date (empty = present)", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "sort_order", label: "Sort order", type: "number" },
    ],
  },
  {
    table: "education",
    label: "Education",
    singular: "Education",
    orderBy: "sort_order",
    listColumns: ["degree", "institution"],
    fields: [
      { name: "degree", label: "Degree", type: "text", required: true },
      { name: "institution", label: "Institution", type: "text", required: true },
      { name: "start_date", label: "Start date", type: "text", placeholder: "2022-09" },
      { name: "end_date", label: "End date", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "sort_order", label: "Sort order", type: "number" },
    ],
  },
  {
    table: "certifications",
    label: "Certifications",
    singular: "Certification",
    orderBy: "created_at",
    listColumns: ["name", "issuer"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "issuer", label: "Issuer", type: "text" },
      { name: "issue_date", label: "Issue date", type: "text", placeholder: "2026-01" },
      { name: "credential_url", label: "Credential URL", type: "text" },
    ],
  },
  {
    table: "social_links",
    label: "Social Links",
    singular: "Social link",
    orderBy: "sort_order",
    listColumns: ["platform", "url"],
    fields: [
      {
        name: "platform",
        label: "Platform",
        type: "select",
        options: ["github", "linkedin", "medium", "twitter", "youtube", "email", "website"],
        required: true,
      },
      { name: "url", label: "URL", type: "text", required: true },
      { name: "sort_order", label: "Sort order", type: "number" },
    ],
  },
];
