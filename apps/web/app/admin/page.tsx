export const metadata = {
  title: "Admin — Shahzaib Hasnain",
  description: "Portfolio admin dashboard (Phase 4).",
};

/**
 * Phase 2 placeholder. The real admin dashboard (Phase 4) is a client-side
 * SPA here that talks to the secure API with a Supabase Auth JWT.
 */
export default function AdminPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">Phase 4</p>
      <h1 className="text-3xl font-bold text-slate-100">Admin dashboard</h1>
      <p className="mx-auto mt-4 max-w-xl text-slate-400">
        This is where projects, skills, education, experience, certifications, social links,
        résumé, and settings will be managed — with a human-approval workflow for AI-detected
        projects. It arrives in Phase 4, backed by the API (Phase 3).
      </p>
    </div>
  );
}
