import { describe,it,expect } from 'vitest';
import { roles,canManage,canManageMember,orgActionSchema } from './organizations';
describe('organization permissions',()=>{
 it('only owner and org admin manage membership',()=>{ expect(roles.filter(canManage)).toEqual(['owner','org_admin']); });
 it('no one can remove or edit an owner',()=>{for(const actor of roles) expect(canManageMember(actor,'owner')).toBe(false);});
 it('only owner can manage org admins',()=>{expect(canManageMember('owner','org_admin')).toBe(true);expect(canManageMember('org_admin','org_admin')).toBe(false);});
 it('viewer has no management permissions',()=>{for(const target of roles) expect(canManageMember('viewer',target)).toBe(false);});
 it('rejects unknown operations',()=>{expect(orgActionSchema.safeParse({action:'promote_owner',organizationId:null,payload:{}}).success).toBe(false);});
});