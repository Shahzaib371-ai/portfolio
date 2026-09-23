# @portfolio/ai-agent — Phase 6

Analyzes GitHub repositories into structured project drafts for human review.

## How it works

1. Reads `github_repositories` from Supabase (written by Phase 5 sync).
2. Skips repos that already have a draft for their current default-branch SHA.
3. Fetches the repo context (`src/github.ts`): README, languages, an
   allow-listed file tree, and key config/dependency files (all truncated,
   read-only).
4. Asks the LLM provider for structured JSON, validated with Zod
   (`src/gemini.ts` implements the provider-independent `LLMProvider`).
5. Inserts the analysis into `ai_project_drafts` with `needs_review=true`
   and logs the run in `sync_logs`.

**Nothing is ever published automatically.** The admin reviews drafts in the
dashboard and approves them into `projects` manually. Unknown or unverifiable
fields come back empty — the agent never invents data.

## Run

```bash
GEMINI_API_KEY=... \
GITHUB_TOKEN=... \
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run analyze --workspace=@portfolio/ai-agent

# Fetch contexts only, no LLM calls or database writes:
DRY_RUN=1 npm run analyze --workspace=@portfolio/ai-agent
```

`GEMINI_MODEL` optionally overrides the model (default `gemini-3.6-flash`).

## Swapping providers

Implement the `LLMProvider` interface in `src/index.ts` with any other
provider (OpenAI-compatible, Anthropic, local model…) and use it in
`src/run.ts`. The prompt, schema, and review workflow stay unchanged.
