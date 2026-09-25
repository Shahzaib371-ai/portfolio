"use client";

import Section from "../../components/Section";
import ProjectCard from "../../components/ProjectCard";
import { Seo } from "../../lib/seo";
import { useSiteContent } from "../../lib/use-site-content";

export default function ProjectsPage() {
  const { projects } = useSiteContent();

  return (
    <>
      <Seo
        title="Projects"
        description="All projects by Shahzaib Hasnain — embedded systems, IoT, machine learning, computer vision, and robotics builds."
        path="/projects"
      />
      <Section kicker="Portfolio" title="All projects">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
      </Section>
    </>
  );
}
