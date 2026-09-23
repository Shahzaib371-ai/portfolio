import {
  ANALYZER_SYSTEM_PROMPT,
  ProjectAnalysisSchema,
  type LLMProvider,
  type ProjectAnalysis,
  type RepoContext,
} from "./index";

// ---------------------------------------------------------------------------
// Gemini implementation of the provider-independent LLMProvider contract,
// using the current Interactions API
// (POST https://generativelanguage.googleapis.com/v1beta/interactions).
// The legacy :generateContent endpoint now returns 403 for new projects, so
// this provider targets the Interactions API instead.
// Model is configurable via GEMINI_MODEL (default: gemini-3.8-flash).
// Swapping providers later only means adding another class that implements
// LLMProvider.
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = "gemini-3.8-flash";

function buildPrompt(repo: RepoContext): string {
  const files = Object.entries(repo.keyFiles)
    .map(([path, content]) => `--- ${path} ---\n${content}`)
    .join("\n\n");

  return `${ANALYZER_SYSTEM_PROMPT}

Analyze this GitHub repository for a developer portfolio.

Repository: ${repo.fullName}
URL: ${repo.githubUrl}
GitHub description: ${repo.description ?? "(none)"}
Homepage field: ${repo.homepage ?? "(none)"}
Languages: ${repo.languages.length > 0 ? repo.languages.join(", ") : "(unknown)"}

README:
${repo.readme ?? "(no README)"}

Key files:
${files || "(none found)"}

File tree (first ${repo.fileTree.length} entries):
${repo.fileTree.join("\n") || "(empty)"}

Return ONLY a JSON object with exactly these keys:
{
  "title": "human-friendly project title",
  "description": "one or two sentences, factual",
  "detailedDescription": "a short paragraph, or empty string if unclear",
  "technologies": ["tech1", "tech2"],
  "category": "one of: Machine Learning, IoT, Embedded Systems, Computer Vision, Robotics, Software Development",
  "features": ["notable feature 1", "notable feature 2"],
  "problemSolved": "what problem it solves, or empty string",
  "projectType": "e.g. web-app, firmware, robot, library, or empty string",
  "githubUrl": "${repo.githubUrl}",
  "liveUrl": "deployed URL if verifiable, else null",
  "confidence": "high | medium | low",
  "needsReview": true
}`;
}

interface InteractionStep {
  type?: string;
  content?: Array<{ type?: string; text?: string }>;
}

interface InteractionResponse {
  status?: string;
  steps?: InteractionStep[];
  error?: { message?: string };
}

function extractText(data: InteractionResponse): string {
  return (data.steps ?? [])
    .filter((s) => s.type === "model_output")
    .flatMap((s) => s.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("");
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return match ? match[1] : trimmed;
}

export class GeminiProvider implements LLMProvider {
  readonly name = "gemini";
  private readonly model: string;

  constructor(
    private readonly apiKey: string,
    model?: string
  ) {
    this.model = model ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  }

  async analyzeRepository(repo: RepoContext): Promise<ProjectAnalysis> {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          model: this.model,
          input: buildPrompt(repo),
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini API ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as InteractionResponse;
    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message ?? "unknown"}`);
    }
    if (data.status && data.status !== "completed") {
      throw new Error(`Gemini interaction did not complete: ${data.status}`);
    }

    const text = stripCodeFences(extractText(data));
    if (!text) {
      throw new Error("Gemini returned no text output");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`Gemini returned non-JSON output: ${text.slice(0, 200)}`);
    }

    const result = ProjectAnalysisSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Output failed schema validation: ${result.error.message}`);
    }
    return result.data;
  }
}
