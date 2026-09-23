import {
  ANALYZER_SYSTEM_PROMPT,
  ProjectAnalysisSchema,
  type LLMProvider,
  type ProjectAnalysis,
  type RepoContext,
} from "./index";

// ---------------------------------------------------------------------------
// Gemini implementation of the provider-independent LLMProvider contract.
// Model is configurable via GEMINI_MODEL (default: gemini-3.6-flash, Google's
// current recommendation). Swapping providers later only means adding another
// class that implements LLMProvider.
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = "gemini-3.6-flash";

function buildPrompt(repo: RepoContext): string {
  const files = Object.entries(repo.keyFiles)
    .map(([path, content]) => `--- ${path} ---\n${content}`)
    .join("\n\n");

  return `Analyze this GitHub repository for a developer portfolio.

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
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: ANALYZER_SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: buildPrompt(repo) }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini API ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

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
