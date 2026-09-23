import type { RepoContext } from "./index";

// ---------------------------------------------------------------------------
// GitHub repository fetcher (Phase 6).
// Builds the RepoContext the AI agent is allowed to inspect: README,
// languages, an allow-listed file tree, and key config/dependency files.
// Everything is truncated to keep prompts bounded. Read-only.
// ---------------------------------------------------------------------------

const API = "https://api.github.com";
const MAX_README_CHARS = 6000;
const MAX_FILE_CHARS = 3000;
const MAX_TREE_ENTRIES = 200;
const MAX_KEY_FILES = 8;

const SKIP_DIRS = [
  "node_modules/",
  ".git/",
  "dist/",
  "build/",
  ".next/",
  "__pycache__/",
  ".venv/",
  "venv/",
  "target/",
  ".idea/",
  ".vscode/",
];

const SKIP_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp", ".bmp",
  ".pdf", ".zip", ".tar", ".gz", ".mp4", ".mp3", ".wav", ".ttf", ".woff",
  ".woff2", ".eot", ".bin", ".exe", ".dll", ".so", ".pyc", ".lock",
]);

const KEY_FILE_NAMES = new Set([
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "setup.py",
  "setup.cfg",
  "pipfile",
  "go.mod",
  "cargo.toml",
  "pom.xml",
  "build.gradle",
  "composer.json",
  "platformio.ini",
  "cmakelists.txt",
  "makefile",
  "dockerfile",
  "docker-compose.yml",
  "vercel.json",
  "tsconfig.json",
  "next.config.js",
  "next.config.mjs",
]);

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "\n…(truncated)" : s;
}

async function gh(token: string, path: string): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, json };
}

function decodeBase64Content(json: unknown): string | null {
  if (typeof json !== "object" || json === null) return null;
  const content = (json as { content?: unknown }).content;
  if (typeof content !== "string") return null;
  try {
    return Buffer.from(content.replace(/\s/g, ""), "base64").toString("utf-8");
  } catch {
    return null;
  }
}

function keepPath(path: string): boolean {
  const lower = path.toLowerCase();
  if (SKIP_DIRS.some((d) => lower.startsWith(d) || lower.includes(`/${d}`))) return false;
  const dot = lower.lastIndexOf(".");
  if (dot > lower.lastIndexOf("/")) {
    const ext = lower.slice(dot);
    if (SKIP_EXT.has(ext)) return false;
  }
  return true;
}

export async function fetchRepoContext(
  owner: string,
  repo: string,
  token: string
): Promise<RepoContext> {
  const { status: metaStatus, json: meta } = await gh(token, `/repos/${owner}/${repo}`);
  if (metaStatus !== 200 || typeof meta !== "object" || meta === null) {
    throw new Error(`Could not read repo metadata (${metaStatus})`);
  }
  const m = meta as {
    description: string | null;
    default_branch: string;
    html_url: string;
    homepage: string | null;
  };

  // README (may be absent)
  let readme: string | null = null;
  const { status: readmeStatus, json: readmeJson } = await gh(token, `/repos/${owner}/${repo}/readme`);
  if (readmeStatus === 200) {
    const text = decodeBase64Content(readmeJson);
    readme = text === null ? null : truncate(text, MAX_README_CHARS);
  }

  // Languages
  const { json: langJson } = await gh(token, `/repos/${owner}/${repo}/languages`);
  const languages =
    typeof langJson === "object" && langJson !== null ? Object.keys(langJson) : [];

  // Recursive file tree
  let fileTree: string[] = [];
  const { status: treeStatus, json: treeJson } = await gh(
    token,
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(m.default_branch)}?recursive=1`
  );
  if (treeStatus === 200 && typeof treeJson === "object" && treeJson !== null) {
    const tree = (treeJson as { tree?: Array<{ path?: string; type?: string }> }).tree ?? [];
    fileTree = tree
      .filter((e) => e.type === "blob" && typeof e.path === "string" && keepPath(e.path))
      .map((e) => e.path as string)
      .slice(0, MAX_TREE_ENTRIES);
  }

  // Key config / dependency files
  const keyFiles: Record<string, string> = {};
  const candidates = fileTree.filter((p) => {
    const base = p.split("/").pop()!.toLowerCase();
    return KEY_FILE_NAMES.has(base) || base.endsWith(".ino");
  }).slice(0, MAX_KEY_FILES);

  for (const path of candidates) {
    const { status, json } = await gh(
      token,
      `/repos/${owner}/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}`
    );
    if (status === 200) {
      const text = decodeBase64Content(json);
      if (text !== null) keyFiles[path] = truncate(text, MAX_FILE_CHARS);
    }
  }

  return {
    fullName: `${owner}/${repo}`,
    githubUrl: m.html_url,
    description: m.description,
    homepage: m.homepage,
    readme,
    languages,
    keyFiles,
    fileTree,
  };
}
