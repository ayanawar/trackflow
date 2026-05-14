export const ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'] as const
export type Role = (typeof ROLES)[number]

const RANK: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
}

export function hasRole(userRole: string, minRole: Role): boolean {
  return (RANK[userRole as Role] ?? 0) >= RANK[minRole]
}

export function isValidRole(role: string): role is Role {
  return ROLES.includes(role as Role)
}

// Roles an actor with `actorRole` is allowed to assign
export function assignableRoles(actorRole: string): Role[] {
  const rank = RANK[actorRole as Role] ?? 0
  return ROLES.filter(r => RANK[r] < rank)
}
