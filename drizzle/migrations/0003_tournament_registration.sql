CREATE TABLE public.tournament_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id), name text NOT NULL CHECK(char_length(name) BETWEEN 2 AND 120), sport text NOT NULL CHECK(char_length(sport) BETWEEN 2 AND 100), registration_fee bigint NOT NULL DEFAULT 0 CHECK(registration_fee BETWEEN 0 AND 100000000), created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tournament_events TO authenticated;
GRANT ALL ON public.tournament_events TO service_role;
ALTER TABLE public.tournament_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read tournament events" ON public.tournament_events FOR SELECT TO authenticated USING(public.is_org_member(organization_id));
CREATE TABLE public.tournament_registrations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id), event_id uuid NOT NULL REFERENCES public.tournament_events(id), user_id uuid NOT NULL, team_name text NOT NULL CHECK(char_length(team_name) BETWEEN 2 AND 120), contact_name text NOT NULL CHECK(char_length(contact_name) BETWEEN 2 AND 120), contact_email text NOT NULL CHECK(char_length(contact_email) <= 255), contact_phone text NOT NULL CHECK(char_length(contact_phone) BETWEEN 8 AND 20), status text NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','accepted','rejected','cancelled')), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(event_id, team_name)
);
GRANT SELECT ON public.tournament_registrations TO authenticated;
GRANT ALL ON public.tournament_registrations TO service_role;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own and organizer registrations" ON public.tournament_registrations FOR SELECT TO authenticated USING(user_id = auth.uid() OR public.has_org_role(organization_id, ARRAY['owner','org_admin','event_manager','finance']::public.organization_role[]));
CREATE TABLE public.tournament_players (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id), registration_id uuid NOT NULL REFERENCES public.tournament_registrations(id), full_name text NOT NULL CHECK(char_length(full_name) BETWEEN 2 AND 120), jersey_number integer NOT NULL CHECK(jersey_number BETWEEN 0 AND 999), UNIQUE(registration_id, jersey_number)
);
GRANT SELECT ON public.tournament_players TO authenticated;
GRANT ALL ON public.tournament_players TO service_role;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players through visible registrations" ON public.tournament_players FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.tournament_registrations r WHERE r.id = registration_id AND r.organization_id = tournament_players.organization_id));
CREATE TABLE public.tournament_registration_payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id), registration_id uuid NOT NULL UNIQUE REFERENCES public.tournament_registrations(id), amount bigint NOT NULL CHECK(amount BETWEEN 0 AND 100000000), payer_name text NOT NULL CHECK(char_length(payer_name) BETWEEN 2 AND 120), status text NOT NULL DEFAULT 'unpaid' CHECK(status IN ('unpaid','paid','failed','refunded')), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tournament_registration_payments TO authenticated;
GRANT ALL ON public.tournament_registration_payments TO service_role;
ALTER TABLE public.tournament_registration_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payments through visible registrations" ON public.tournament_registration_payments FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.tournament_registrations r WHERE r.id = registration_id AND r.organization_id = tournament_registration_payments.organization_id));
CREATE FUNCTION public.create_tournament_event(_org uuid, _name text, _sport text, _fee bigint) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_org_role(_org, ARRAY['owner','org_admin','event_manager']::public.organization_role[]) THEN RAISE EXCEPTION 'Anda tidak memiliki izin membuat turnamen.'; END IF;
 INSERT INTO public.tournament_events(organization_id,name,sport,registration_fee,created_by) VALUES(_org,btrim(_name),btrim(_sport),_fee,auth.uid()) RETURNING id INTO v_id;
 INSERT INTO public.organization_audit_logs(organization_id,actor_id,actor_name,action,entity_id,details) VALUES(_org,auth.uid(),coalesce(auth.jwt()->>'email','Panitia'),'tournament_created',v_id,jsonb_build_object('name',btrim(_name),'registration_fee',_fee));
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.create_tournament_event(uuid,text,text,bigint) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_tournament_event(uuid,text,text,bigint) TO authenticated;
CREATE FUNCTION public.submit_tournament_registration(_payload jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event public.tournament_events; v_id uuid; v_player jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Silakan masuk terlebih dahulu.'; END IF;
 SELECT * INTO v_event FROM public.tournament_events WHERE id = (_payload->>'eventId')::uuid FOR SHARE;
 IF NOT FOUND OR NOT public.is_org_member(v_event.organization_id) THEN RAISE EXCEPTION 'Turnamen tidak tersedia untuk akun Anda.'; END IF;
 IF jsonb_typeof(_payload->'players') IS DISTINCT FROM 'array' OR jsonb_array_length(_payload->'players') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Isi 1–100 pemain.'; END IF;
 IF coalesce(_payload->>'contactEmail','') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR coalesce(_payload->>'contactPhone','') !~ '^(\+62|62|0)[0-9]{7,17}$' THEN RAISE EXCEPTION 'Email atau nomor telepon tidak valid.'; END IF;
 INSERT INTO public.tournament_registrations(organization_id,event_id,user_id,team_name,contact_name,contact_email,contact_phone) VALUES(v_event.organization_id,v_event.id,auth.uid(),btrim(_payload->>'teamName'),btrim(_payload->>'contactName'),lower(btrim(_payload->>'contactEmail')),_payload->>'contactPhone') RETURNING id INTO v_id;
 FOR v_player IN SELECT value FROM jsonb_array_elements(_payload->'players') LOOP
 INSERT INTO public.tournament_players(organization_id,registration_id,full_name,jersey_number) VALUES(v_event.organization_id,v_id,btrim(v_player->>'fullName'),(v_player->>'jerseyNumber')::integer);
 END LOOP;
 INSERT INTO public.tournament_registration_payments(organization_id,registration_id,amount,payer_name,status) VALUES(v_event.organization_id,v_id,v_event.registration_fee,btrim(_payload->>'payerName'),'unpaid');
 INSERT INTO public.organization_audit_logs(organization_id,actor_id,actor_name,action,entity_id,details) VALUES(v_event.organization_id,auth.uid(),coalesce(auth.jwt()->>'email','Peserta'),'registration_submitted',v_id,jsonb_build_object('team_name',btrim(_payload->>'teamName'),'event_id',v_event.id,'players',jsonb_array_length(_payload->'players')));
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.submit_tournament_registration(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_tournament_registration(jsonb) TO authenticated;