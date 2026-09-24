import { projects } from "../../../lib/data";
import ProjectDetail from "./ProjectDetail";

// Pre-render the known slugs at build time so direct links keep working on
// static hosting. New projects added later via /admin resolve at runtime
// when navigated to from inside the site.
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  return <ProjectDetail slug={params.slug} />;
}
