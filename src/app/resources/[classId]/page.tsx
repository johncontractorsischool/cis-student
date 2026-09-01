import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResourceList } from "@/components/resource-list";
import { hasSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resources" };

export default async function ResourceCollectionPage({ params }: PageProps<"/resources/[classId]">) {
  if (!(await hasSession())) redirect("/login");
  const { classId } = await params;
  return <ResourceList classId={classId} />;
}
