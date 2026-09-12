ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS locked_at timestamptz;

UPDATE public.projects AS p
SET locked_at = first_report.created_at
FROM (
  SELECT project_id, MIN(created_at) AS created_at
  FROM public.generations
  WHERE kind <> 'sentiment'
  GROUP BY project_id
) AS first_report
WHERE p.id = first_report.project_id
  AND p.locked_at IS NULL;

CREATE OR REPLACE FUNCTION public.can_create_project(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    NOT EXISTS (
      SELECT 1 FROM public.projects WHERE user_id = _user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.credits WHERE user_id = _user_id AND is_paid = true
    );
$$;

REVOKE ALL ON FUNCTION public.can_create_project(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_create_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_create_project(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.lock_project_after_generation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.kind <> 'sentiment' THEN
    UPDATE public.projects
    SET locked_at = COALESCE(locked_at, NEW.created_at)
    WHERE id = NEW.project_id
      AND user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_project_after_generation ON public.generations;
CREATE TRIGGER lock_project_after_generation
AFTER INSERT ON public.generations
FOR EACH ROW
EXECUTE FUNCTION public.lock_project_after_generation();

DROP POLICY IF EXISTS "Users can CRUD own projects" ON public.projects;

CREATE POLICY "Users can read own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create allowed projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.can_create_project(auth.uid())
  AND locked_at IS NULL
);

CREATE POLICY "Users can update unlocked projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND locked_at IS NULL)
WITH CHECK (user_id = auth.uid() AND locked_at IS NULL);