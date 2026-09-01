import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FirstLogin } from "@/components/first-login";
import { entryPathForUser, sanitizeAgreementHtml } from "@/lib/auth/entry";
import { requireCurrentUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Enrollment agreement" };

export default async function FirstLoginPage() {
  const user = await requireCurrentUser();
  if (entryPathForUser(user) === "/dashboard") redirect("/dashboard");
  const agreementHtml = sanitizeAgreementHtml(user.enrollment_agreements?.Agreement_body);
  return <FirstLogin agreementHtml={agreementHtml || "<p>Your enrollment agreement is temporarily unavailable. Please contact CIS support.</p>"} />;
}
