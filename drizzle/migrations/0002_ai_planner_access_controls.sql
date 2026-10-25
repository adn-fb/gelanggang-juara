CREATE TABLE public.ai_planner_access (user_id uuid PRIMARY KEY, organization_id uuid NOT NULL REFERENCES public.organizations(id), last_requested_at timestamptz NOT NULL DEFAULT now(), blocked_reason text);
GRANT SELECT ON public.ai_planner_access TO authenticated;
GRANT ALL ON public.ai_planner_access TO service_role;
ALTER TABLE public.ai_planner_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own AI access" ON public.ai_planner_access FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.begin_tournament_plan(_org uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE access_row public.ai_planner_access;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_org_role(_org,ARRAY['owner','org_admin','event_manager']::public.organization_role[]) THEN RAISE EXCEPTION 'Perencana hanya tersedia untuk pemilik, admin, dan manajer event.'; END IF;
 INSERT INTO public.ai_planner_access(user_id,organization_id,last_requested_at) VALUES(auth.uid(),_org,now()-interval '1 hour') ON CONFLICT(user_id) DO NOTHING;
 SELECT * INTO access_row FROM public.ai_planner_access WHERE user_id=auth.uid() FOR UPDATE;
 IF access_row.blocked_reason IS NOT NULL THEN RAISE EXCEPTION '%',access_row.blocked_reason; END IF;
 IF access_row.last_requested_at>now()-interval '30 seconds' THEN RAISE EXCEPTION 'Tunggu 30 detik sebelum membuat rencana berikutnya.'; END IF;
 UPDATE public.ai_planner_access SET organization_id=_org,last_requested_at=now() WHERE user_id=auth.uid();
END; $$;
REVOKE ALL ON FUNCTION public.begin_tournament_plan(uuid) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.begin_tournament_plan(uuid) TO authenticated;