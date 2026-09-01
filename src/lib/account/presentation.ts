import type { User } from "@/lib/api/types";

export type AccountProfile = {
  address: string;
  canDelete: boolean;
  city: string;
  email: string;
  firstName: string;
  language: "en" | "es";
  lastName: string;
  phone: string;
  state: string;
  zip: string;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function canDeleteAccount(user: User): boolean {
  const accountType = Number(user.account_type);
  const platform = Number(user.created_platform);
  return (accountType === 3 && platform === 1) || (accountType === 4 && platform === 2);
}

export function accountProfileFromUser(user: User): AccountProfile {
  return {
    address: text(user.address),
    canDelete: canDeleteAccount(user),
    city: text(user.city),
    email: text(user.email),
    firstName: text(user.name),
    language: user.lang === "es" ? "es" : "en",
    lastName: text(user.lname),
    phone: text(user.mobilenum),
    state: text(user.state).toUpperCase() || "CA",
    zip: text(user.zip),
  };
}
