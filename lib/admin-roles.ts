/**
 * Single source of truth for admin role identifiers.
 * Used by: auth.ts, middleware.ts, isAdminRole(), server actions.
 * 
 * IMPORTANT: If you add a new admin role, update this array.
 * All comparison is done case-insensitively via isAdminRole().
 */
export const ADMIN_ROLES = ['admin', 'super_admin', 'superadmin'] as const;
export type AdminRole = typeof ADMIN_ROLES[number];

/**
 * Check if a role string is an admin role (case-insensitive).
 */
export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role.toLowerCase() as AdminRole);
}
