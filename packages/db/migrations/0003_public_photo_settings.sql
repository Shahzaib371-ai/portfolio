-- Phase 9 fix: let the public site read the profile photo settings.
--
-- The /admin Photo tab (authenticated admin) writes profile_photo_url and
-- profile_photo_shape into the settings table, but the homepage reads
-- content with the anon key. The Phase 3 RLS migration created public read
-- policies for projects/skills/education/experience/certifications/
-- social_links but not for settings, so anon saw zero settings rows and the
-- uploaded photo never appeared on the live site.
--
-- Minimal fix: expose ONLY the two photo keys publicly. Every other settings
-- row stays admin-only (authenticated + is_admin()).
DROP POLICY IF EXISTS "public read photo settings" ON public.settings;

CREATE POLICY "public read photo settings"
  ON public.settings FOR SELECT TO anon
  USING (key IN ('profile_photo_url', 'profile_photo_shape'));
