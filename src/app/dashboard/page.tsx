import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";
import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requirePortalUser();
  return <Dashboard />;
}
