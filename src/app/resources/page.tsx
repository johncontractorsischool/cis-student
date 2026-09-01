import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResourcesHome } from "@/components/resources-home";
import { hasSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesPage() {
  if (!(await hasSession())) redirect("/login");
  return <ResourcesHome />;
}
