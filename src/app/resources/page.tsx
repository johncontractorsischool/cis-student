import type { Metadata } from "next";

import { ResourcesHome } from "@/components/resources-home";
import { requirePortalUser } from "@/lib/auth/page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesPage() {
  await requirePortalUser();
  return <ResourcesHome />;
}
