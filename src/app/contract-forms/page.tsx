import type { Metadata } from "next";

import { ContractFormsStorefront } from "@/components/contract-forms-storefront";
import { requirePortalUser } from "@/lib/auth/page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contract Forms" };

export default async function ContractFormsPage() {
  await requirePortalUser();
  return <ContractFormsStorefront />;
}
