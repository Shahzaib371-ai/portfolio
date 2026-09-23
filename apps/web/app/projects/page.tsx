import Section from "../../components/Section";
import ProjectCard from "../../components/ProjectCard";
import { projects } from "../../lib/data";

export const metadata = {
  title: "Projects — Shahzaib Hasnain",
  description: "Embedded systems, IoT, machine learning, computer vision, and robotics projects by Shahzaib Hasnain.",
};

export default function ProjectsPage() {
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
