import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Dashboard } from "@/components/dashboard";
import { entryPathForUser } from "@/lib/auth/entry";
import { requireCurrentUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  if (entryPathForUser(user) === "/first-login") redirect("/first-login");
  return <Dashboard />;
}
