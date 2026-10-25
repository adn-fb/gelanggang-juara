import { z } from 'zod';
import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
export const roles = ['owner','org_admin','event_manager','match_operator','finance','viewer'] as const;
export type OrgRole = typeof roles[number];
export const roleLabels: Record<OrgRole,string> = { owner:'Pemilik',org_admin:'Admin organisasi',event_manager:'Manajer event',match_operator:'Operator pertandingan',finance:'Keuangan',viewer:'Hanya baca' };
export const canManage = (role?: OrgRole) => role === 'owner' || role === 'org_admin';
export const canManageMember = (actor: OrgRole, target: OrgRole) => canManage(actor) && target !== 'owner' && (actor === 'owner' || target !== 'org_admin');
export const organizationSchema = z.object({ name:z.string().trim().min(2).max(120),description:z.string().trim().max(1000) });
export const orgActionSchema = z.object({ action:z.enum(['create','update','invite','accept','decline','revoke','role','remove']),organizationId:z.string().uuid().nullable(),payload:z.record(z.string().max(1000)) });
export const organizationsQuery = (userId:string) => queryOptions({ queryKey:['organizations',userId],queryFn:async()=>{
 const [orgs,members,invitations] = await Promise.all([
  supabase.from('organizations').select('*').order('created_at'),
  supabase.from('organization_members').select('*').eq('user_id',userId),
  supabase.from('organization_invitations').select('*').eq('status','pending').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}),
 ]);
 for (const response of [orgs,members,invitations]) if(response.error) throw response.error;
 return { organizations:orgs.data??[],memberships:members.data??[],invitations:invitations.data??[] };
} });
export const organizationQuery = (id:string,userId:string) => queryOptions({queryKey:['organization',id,userId],queryFn:async()=>{
 const org=await supabase.from('organizations').select('*').eq('id',id).single(); if(org.error) throw new Error('Organisasi tidak tersedia atau Anda tidak memiliki akses.');
 const members=await supabase.from('organization_members').select('*').eq('organization_id',id).order('created_at'); if(members.error) throw members.error;
 const myRole=members.data.find(m=>m.user_id===userId)?.role;
 const [invitations,audit]=canManage(myRole)?await Promise.all([
 supabase.from('organization_invitations').select('*').eq('organization_id',id).order('created_at',{ascending:false}),
 supabase.from('organization_audit_logs').select('*').eq('organization_id',id).order('created_at',{ascending:false}).limit(100),
 ]):[{data:[],error:null},{data:[],error:null}];
 if(invitations.error) throw invitations.error; if(audit.error) throw audit.error;
 return {organization:org.data,members:members.data,myRole,invitations:invitations.data??[],audit:audit.data??[]};
} });