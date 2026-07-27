DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;

CREATE POLICY "Anon can submit valid leads" ON public.leads FOR INSERT TO anon WITH CHECK (
  work_email IS NOT NULL AND work_email <> '' AND full_name IS NOT NULL AND full_name <> '' AND project_name IS NOT NULL AND project_name <> '' AND mission IS NOT NULL AND mission <> ''
);

CREATE POLICY "Users can submit leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (
  work_email IS NOT NULL AND work_email <> '' AND full_name IS NOT NULL AND full_name <> '' AND project_name IS NOT NULL AND project_name <> '' AND mission IS NOT NULL AND mission <> ''
);

-- Add a helper that returns true for non-empty leads, used as a more explicit check (optional, but keeps the linter happy)
CREATE OR REPLACE FUNCTION public.is_valid_lead(p_full_name text, p_work_email text, p_project_name text, p_mission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(p_full_name, '') <> ''
    AND COALESCE(p_work_email, '') <> ''
    AND COALESCE(p_project_name, '') <> ''
    AND COALESCE(p_mission, '') <> '';
$$;

REVOKE EXECUTE ON FUNCTION public.is_valid_lead(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_valid_lead(text, text, text, text) TO anon, authenticated;