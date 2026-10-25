CREATE TYPE public.organization_role AS ENUM ('owner','org_admin','event_manager','match_operator','finance','viewer');
CREATE TABLE public.organizations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text NOT NULL DEFAULT '', created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.organizations TO authenticated; GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.organization_members (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id), user_id uuid NOT NULL, role public.organization_role NOT NULL, display_name text NOT NULL, email text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(organization_id,user_id));
GRANT SELECT ON public.organization_members TO authenticated; GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.organization_invitations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id), organization_name text NOT NULL, email text NOT NULL, role public.organization_role NOT NULL, status text NOT NULL DEFAULT 'pending', invited_by uuid NOT NULL, expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days', created_at timestamptz NOT NULL DEFAULT now(), responded_at timestamptz);
GRANT SELECT ON public.organization_invitations TO authenticated; GRANT ALL ON public.organization_invitations TO service_role;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX organization_invitation_pending ON public.organization_invitations(organization_id, email) WHERE status='pending';
CREATE TABLE public.organization_audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id), actor_id uuid NOT NULL, actor_name text NOT NULL, action text NOT NULL, entity_id uuid NOT NULL, details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.organization_audit_logs TO authenticated; GRANT ALL ON public.organization_audit_logs TO service_role;
ALTER TABLE public.organization_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX organization_members_user ON public.organization_members(user_id);
CREATE INDEX organization_invitations_email ON public.organization_invitations(email);
CREATE INDEX organization_audit_org ON public.organization_audit_logs(organization_id,created_at DESC);
CREATE FUNCTION public.has_org_role(_org uuid, _roles public.organization_role[]) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.organization_members WHERE organization_id=_org AND user_id=auth.uid() AND role=ANY(_roles)); $$;
REVOKE ALL ON FUNCTION public.has_org_role(uuid,public.organization_role[]) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.has_org_role(uuid,public.organization_role[]) TO authenticated;
CREATE FUNCTION public.is_org_member(_org uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.organization_members WHERE organization_id=_org AND user_id=auth.uid()); $$;
REVOKE ALL ON FUNCTION public.is_org_member(uuid) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;
CREATE POLICY "Members read organizations" ON public.organizations FOR SELECT TO authenticated USING(public.is_org_member(id));
CREATE POLICY "Members read colleagues" ON public.organization_members FOR SELECT TO authenticated USING(public.is_org_member(organization_id));
CREATE POLICY "Managers and recipients read invitations" ON public.organization_invitations FOR SELECT TO authenticated USING(public.has_org_role(organization_id,ARRAY['owner','org_admin']::public.organization_role[]) OR email=lower(auth.jwt()->>'email'));
CREATE POLICY "Managers read audit" ON public.organization_audit_logs FOR SELECT TO authenticated USING(public.has_org_role(organization_id,ARRAY['owner','org_admin']::public.organization_role[]));
CREATE FUNCTION public.organization_action(_action text, _org uuid DEFAULT NULL, _payload jsonb DEFAULT '{}') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actor uuid:=auth.uid(); actor_email text; actor_name text; result_id uuid; actor_role public.organization_role; target public.organization_members; invitation public.organization_invitations; chosen public.organization_role; org_name text;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Silakan masuk terlebih dahulu.'; END IF;
 SELECT lower(email) INTO actor_email FROM auth.users WHERE id=actor AND email_confirmed_at IS NOT NULL;
 IF actor_email IS NULL THEN RAISE EXCEPTION 'Konfirmasi email Anda terlebih dahulu.'; END IF;
 SELECT coalesce(nullif(full_name,''),actor_email) INTO actor_name FROM public.profiles WHERE id=actor;
 actor_name:=coalesce(actor_name,actor_email);
 IF _action='create' THEN
  org_name:=trim(_payload->>'name');
  IF org_name IS NULL OR length(org_name)<2 OR length(org_name)>120 OR length(coalesce(_payload->>'description',''))>1000 THEN RAISE EXCEPTION 'Nama organisasi harus 2–120 karakter.'; END IF;
  INSERT INTO public.organizations(name,description,created_by) VALUES(org_name,coalesce(_payload->>'description',''),actor) RETURNING id INTO result_id;
  _org:=result_id;
  INSERT INTO public.organization_members(organization_id,user_id,role,display_name,email) VALUES(_org,actor,'owner',actor_name,actor_email);
 ELSIF _action IN ('accept','decline') THEN
  SELECT * INTO invitation FROM public.organization_invitations WHERE id=(_payload->>'id')::uuid FOR UPDATE;
  IF invitation.id IS NULL OR invitation.email<>actor_email OR invitation.status<>'pending' OR invitation.expires_at<=now() THEN RAISE EXCEPTION 'Undangan tidak tersedia atau sudah kedaluwarsa.'; END IF;
  _org:=invitation.organization_id; result_id:=invitation.id;
  PERFORM 1 FROM public.organizations WHERE id=_org FOR UPDATE;
  IF _action='accept' THEN
   INSERT INTO public.organization_members(organization_id,user_id,role,display_name,email) VALUES(_org,actor,invitation.role,actor_name,actor_email) ON CONFLICT(organization_id,user_id) DO NOTHING;
  END IF;
  UPDATE public.organization_invitations SET status=CASE WHEN _action='accept' THEN 'accepted' ELSE 'declined' END, responded_at=now() WHERE id=result_id;
 ELSE
  PERFORM 1 FROM public.organizations WHERE id=_org FOR UPDATE;
  SELECT role INTO actor_role FROM public.organization_members WHERE organization_id=_org AND user_id=actor;
  IF actor_role IS NULL OR actor_role NOT IN ('owner','org_admin') THEN RAISE EXCEPTION 'Anda tidak memiliki izin untuk tindakan ini.'; END IF;
  IF _action='update' THEN
   org_name:=trim(_payload->>'name');
   IF org_name IS NULL OR length(org_name)<2 OR length(org_name)>120 OR length(coalesce(_payload->>'description',''))>1000 THEN RAISE EXCEPTION 'Nama organisasi harus 2–120 karakter.'; END IF;
   UPDATE public.organizations SET name=org_name,description=coalesce(_payload->>'description',''),updated_at=now() WHERE id=_org; result_id:=_org;
  ELSIF _action='invite' THEN
   chosen:=(_payload->>'role')::public.organization_role;
   IF chosen IS NULL OR chosen='owner' OR (chosen='org_admin' AND actor_role<>'owner') THEN RAISE EXCEPTION 'Peran ini hanya dapat ditetapkan pemilik.'; END IF;
   IF coalesce(_payload->>'email','') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(_payload->>'email')>255 THEN RAISE EXCEPTION 'Format email tidak valid.'; END IF;
   IF EXISTS(SELECT 1 FROM public.organization_members WHERE organization_id=_org AND email=lower(trim(_payload->>'email'))) THEN RAISE EXCEPTION 'Pengguna sudah menjadi anggota.'; END IF;
   UPDATE public.organization_invitations SET status='expired' WHERE organization_id=_org AND email=lower(trim(_payload->>'email')) AND status='pending' AND expires_at<=now();
   SELECT name INTO org_name FROM public.organizations WHERE id=_org;
   INSERT INTO public.organization_invitations(organization_id,organization_name,email,role,invited_by) VALUES(_org,org_name,lower(trim(_payload->>'email')),chosen,actor) RETURNING id INTO result_id;
  ELSIF _action='revoke' THEN
   UPDATE public.organization_invitations SET status='revoked',responded_at=now() WHERE id=(_payload->>'id')::uuid AND organization_id=_org AND status='pending' AND (actor_role='owner' OR role<>'org_admin') RETURNING id INTO result_id;
   IF result_id IS NULL THEN RAISE EXCEPTION 'Undangan tidak dapat dibatalkan.'; END IF;
  ELSIF _action IN ('role','remove') THEN
   SELECT * INTO target FROM public.organization_members WHERE id=(_payload->>'id')::uuid AND organization_id=_org;
   IF target.id IS NULL OR target.role='owner' OR (target.role='org_admin' AND actor_role<>'owner') THEN RAISE EXCEPTION 'Anggota ini hanya dapat dikelola pemilik; pemilik tidak dapat dihapus.'; END IF;
   result_id:=target.id;
   IF _action='role' THEN
    chosen:=(_payload->>'role')::public.organization_role;
    IF chosen IS NULL OR chosen='owner' OR (chosen='org_admin' AND actor_role<>'owner') THEN RAISE EXCEPTION 'Peran ini hanya dapat ditetapkan pemilik.'; END IF;
    _payload:=_payload || jsonb_build_object('previous_role',target.role,'email',target.email);
    UPDATE public.organization_members SET role=chosen WHERE id=result_id;
   ELSE
    _payload:=jsonb_build_object('email',target.email,'role',target.role);
    DELETE FROM public.organization_members WHERE id=result_id AND organization_id=_org;
   END IF;
  ELSE RAISE EXCEPTION 'Tindakan tidak dikenal.';
  END IF;
 END IF;
 INSERT INTO public.organization_audit_logs(organization_id,actor_id,actor_name,action,entity_id,details) VALUES(_org,actor,actor_name,_action,result_id,_payload);
 RETURN result_id;
END; $$;
REVOKE ALL ON FUNCTION public.organization_action(text,uuid,jsonb) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.organization_action(text,uuid,jsonb) TO authenticated;