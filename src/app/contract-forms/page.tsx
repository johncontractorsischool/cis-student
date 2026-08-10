import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ContractFormsStorefront } from "@/components/contract-forms-storefront";
import { hasSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contract Forms" };

export default async function ContractFormsPage() {
  if (!(await hasSession())) redirect("/login");
  return <ContractFormsStorefront />;
}
