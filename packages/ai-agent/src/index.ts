import { z } from "zod";

// ---------------------------------------------------------------------------
// AI project-analysis agent — provider-independent core.
// The agent NEVER invents data: anything unverifiable from the repository
// must come back empty with needsReview: true.
// ---------------------------------------------------------------------------

/** Validated structured output for one analyzed repository. */
export const ProjectAnalysisSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1), // one or two sentences
  detailedDescription: z.string().default(""),
  technologies: z.array(z.string()),
  category: z.string(), // e.g. "Machine Learning", "IoT", "Embedded Systems"
  features: z.array(z.string()),
  problemSolved: z.string().default(""),
  projectType: z.string().default(""), // e.g. "web-app", "firmware", "robot"
  githubUrl: z.string().url(),
  liveUrl: z.string().url().nullable().default(null),
  confidence: z.enum(["high", "medium", "low"]),
  needsReview: z.boolean().default(true),
});

export type ProjectAnalysis = z.infer<typeof ProjectAnalysisSchema>;

/** Everything the agent may inspect. Built by the GitHub fetcher (Phase 5). */
export interface RepoContext {
  fullName: string; // owner/repo
  githubUrl: string;
  description: string | null;
  homepage: string | null; // repo "website" field, may be empty
  readme: string | null; // truncated to a safe length
  languages: string[]; // e.g. ["Python", "C++"]
  keyFiles: Record<string, string>; // path -> truncated content
  // (package.json, requirements.txt, platformio.ini, CMakeLists.txt, ...)
  fileTree: string[]; // truncated, allow-listed paths
}

/** Provider-independent contract. Phase 6 implements OpenAICompatibleProvider. */
export interface LLMProvider {
  readonly name: string;
  analyzeRepository(repo: RepoContext): Promise<ProjectAnalysis>;
}

/** System prompt (versioned in code so agent behavior stays reviewable). */
export const ANALYZER_SYSTEM_PROMPT = `You are a repository analysis agent for a developer portfolio.
RULES:
- Output ONLY valid JSON matching the required schema.
- NEVER invent features, technologies, or achievements.
- If something cannot be verified from the repository content, leave it empty
  (or an empty array) and set needsReview to true.
- Prefer short, factual descriptions over marketing language.
- Guess the category from evidence: Embedded Systems, IoT, Machine Learning,
  Computer Vision, Robotics, or Software Development.`;
