export const roles = ["OM", "Manager", "User"] as const;
export type Role = typeof roles[number];

export function normalizeRole(role: string): Role {
  if (role === "OM" || role === "OM/Manager") return "OM";
  if (role === "Manager") return "Manager";
  return "User";
}

export function canCreateTasks(role: string) {
  const normalized = normalizeRole(role);
  return normalized === "OM" || normalized === "Manager";
}
