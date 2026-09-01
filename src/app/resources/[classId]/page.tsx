import type { Metadata } from "next";

import { ResourceList } from "@/components/resource-list";
import { requirePortalUser } from "@/lib/auth/page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resources" };

export default async function ResourceCollectionPage({ params }: PageProps<"/resources/[classId]">) {
  await requirePortalUser();
  const { classId } = await params;
  return <ResourceList classId={classId} />;
}
