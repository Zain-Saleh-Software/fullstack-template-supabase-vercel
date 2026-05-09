import type { RoleType } from '@/types/role'
import { ROLE_PERMISSIONS } from '@/types/role'

export function buildRolePermissions(role: RoleType): string[] {
    return (ROLE_PERMISSIONS[role] as string[]) || []
}
