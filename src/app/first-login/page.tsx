import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FirstLogin } from "@/components/first-login";
import { accountProfileFromUser } from "@/lib/account/presentation";
import { sanitizeAgreementHtml } from "@/lib/auth/entry";
import { entryStageForSession, requireCurrentUser } from "@/lib/auth/page";
import { authenticatedRequest } from "@/lib/auth/request";
import { hasCompletedFirstLoginPassword } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Enrollment agreement" };

export default async function FirstLoginPage() {
  const user = await requireCurrentUser();
  const entryStage = await entryStageForSession(user);
  if (entryStage === "complete") redirect("/dashboard");
  const agreementHtml = sanitizeAgreementHtml(user.enrollment_agreements?.Agreement_body);
  let initialStep: "agreement" | "password" | "prescreen" | "profile" = "agreement";
  if (entryStage === "account_setup") {
    if (await hasCompletedFirstLoginPassword()) initialStep = "profile";
    else {
      try {
        const prescreen = await authenticatedRequest<{ show_modal?: boolean }>("/account/first-login-prescreen");
        initialStep = prescreen.show_modal === true ? "prescreen" : "password";
      } catch {
        initialStep = "password";
      }
    }
  }
  return (
    <FirstLogin
      agreementHtml={agreementHtml || "<p>Your enrollment agreement is temporarily unavailable. Please contact CIS support.</p>"}
      initialProfile={accountProfileFromUser(user)}
      initialStep={initialStep}
    />
  );
}
