import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Dashboard } from "@/components/dashboard";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  if (!(await hasSession())) redirect("/login");
  return <Dashboard />;
}
