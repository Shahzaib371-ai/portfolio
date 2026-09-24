"use client";

import Section from "../../components/Section";
import ProjectCard from "../../components/ProjectCard";
import { useSiteContent } from "../../lib/use-site-content";

export default function ProjectsPage() {
  const { projects } = useSiteContent();

  return (
    <Section kicker="Portfolio" title="All projects">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </Section>
  );
}
