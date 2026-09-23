-- Phase 3: enable Row Level Security. service_role bypasses RLS (admin
-- writes keep working); anon gets read-only access to public content only.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','projects','skills','experience','education','certifications',
    'social_links','settings','github_repositories','ai_project_drafts','sync_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Drop first (CREATE POLICY has no IF NOT EXISTS), then create.
DROP POLICY IF EXISTS "public read published projects" ON public.projects;
DROP POLICY IF EXISTS "public read skills" ON public.skills;
DROP POLICY IF EXISTS "public read education" ON public.education;
DROP POLICY IF EXISTS "public read experience" ON public.experience;
DROP POLICY IF EXISTS "public read certifications" ON public.certifications;
DROP POLICY IF EXISTS "public read social links" ON public.social_links;

-- Public read policies (portfolio visitors). Draft projects stay hidden.
CREATE POLICY "public read published projects"
  ON public.projects FOR SELECT TO anon
  USING (status = 'published');

CREATE POLICY "public read skills"
  ON public.skills FOR SELECT TO anon USING (true);

CREATE POLICY "public read education"
  ON public.education FOR SELECT TO anon USING (true);

CREATE POLICY "public read experience"
  ON public.experience FOR SELECT TO anon USING (true);

CREATE POLICY "public read certifications"
  ON public.certifications FOR SELECT TO anon USING (true);

CREATE POLICY "public read social links"
  ON public.social_links FOR SELECT TO anon USING (true);
