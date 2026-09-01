import type { Metadata } from "next";

import { LiveClassList } from "@/components/live-class-list";
import { requirePortalUser } from "@/lib/auth/page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Live Class" };

export default async function LiveClassPage({
  searchParams,
}: {
  searchParams: Promise<{ l?: string | string[] }>;
}) {
  await requirePortalUser();
  const query = await searchParams;
  return <LiveClassList language={query.l === "es" ? "es" : "en"} />;
}
