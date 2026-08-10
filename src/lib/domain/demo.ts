import type { User } from "@/lib/api/types";

export function isDemoAccount(user: User | null | undefined): boolean {
  const value = user?.demo_account;
  return value === true || value === 1 || value === "1" || value === "true";
}

export function hasIApplicationAccess(user: User): boolean {
  if (isDemoAccount(user)) return true;
  return [1, 2].includes(Number(user.iapp_access));
}
