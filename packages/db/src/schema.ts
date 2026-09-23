import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Portfolio database schema (Supabase Postgres). Phase 3 adds relations,
// indexes, RLS policies and migrations. Timestamps on every table.
// ---------------------------------------------------------------------------

export const projectStatus = pgEnum("project_status", [
  "draft",
  "published",
  "hidden",
]);

const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
};

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  ...timestamps,
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(), // short
  detailedDescription: text("detailed_description").default(""),
  technologies: jsonb("technologies").$type<string[]>().default([]),
  category: text("category").default(""),
  githubUrl: text("github_url"),
  liveUrl: text("live_url"),
  images: jsonb("images").$type<string[]>().default([]),
  videoUrl: text("video_url"),
  features: jsonb("features").$type<string[]>().default([]),
  projectDate: text("project_date"), // YYYY-MM, editable
  featured: boolean("featured").default(false).notNull(),
  status: projectStatus("status").default("draft").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  // AI-safety bookkeeping: never overwrite manually edited fields.
  aiGenerated: boolean("ai_generated").default(false).notNull(),
  manuallyEdited: boolean("manually_edited").default(false).notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  githubRepoId: text("github_repo_id"),
  ...timestamps,
});

export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category").default(""), // e.g. Embedded, ML, Software
  level: integer("level").default(0), // 0-100, optional
  sortOrder: integer("sort_order").default(0).notNull(),
  ...timestamps,
});

export const experience = pgTable("experience", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  startDate: text("start_date"),
  endDate: text("end_date"), // null/empty = present
  description: text("description").default(""),
  sortOrder: integer("sort_order").default(0).notNull(),
  ...timestamps,
});

export const education = pgTable("education", {
  id: uuid("id").defaultRandom().primaryKey(),
  degree: text("degree").notNull(),
  institution: text("institution").notNull(),
  startDate: text("start_date"),
  endDate: text("end_date"),
  description: text("description").default(""),
  sortOrder: integer("sort_order").default(0).notNull(),
  ...timestamps,
});

export const certifications = pgTable("certifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  issuer: text("issuer").default(""),
  issueDate: text("issue_date"),
  credentialUrl: text("credential_url"),
  ...timestamps,
});

export const socialLinks = pgTable("social_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  platform: text("platform").notNull(), // github, linkedin, medium, ...
  url: text("url").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  ...timestamps,
});

// Key/value site content: hero text, about, SEO, toggles like
// autoPublishTrustedRepos. Editable from /admin, no code changes.
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").default(""),
  ...timestamps,
});

// Sync state per GitHub repository (detection source of truth).
export const githubRepositories = pgTable("github_repositories", {
  id: uuid("id").defaultRandom().primaryKey(),
  repoId: text("repo_id").notNull().unique(), // GitHub numeric id
  fullName: text("full_name").notNull(), // owner/repo
  defaultBranch: text("default_branch").default("main"),
  lastSeenSha: text("last_seen_sha"),
  lastSyncedAt: timestamp("last_synced_at"),
  ...timestamps,
});

// AI output awaiting human approval. Never auto-published by default.
export const aiProjectDrafts = pgTable("ai_project_drafts", {
  id: uuid("id").defaultRandom().primaryKey(),
  githubRepoId: text("github_repo_id"),
  payload: jsonb("payload").notNull(), // validated ProjectAnalysis JSON
  needsReview: boolean("needs_review").default(true).notNull(),
  reviewed: boolean("reviewed").default(false).notNull(),
  ...timestamps,
});

// Append-only log: every sync / AI run / webhook, success or failure.
export const syncLogs = pgTable("sync_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: text("kind").notNull(), // sync | ai_analysis | webhook | rebuild
  status: text("status").notNull(), // ok | error
  message: text("message").default(""),
  details: jsonb("details"),
  ...timestamps,
});
