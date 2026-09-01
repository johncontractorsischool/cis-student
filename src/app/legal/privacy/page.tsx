import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return <LegalPage title="Privacy policy" description="Review how Contractors Intelligence School handles personal information." externalUrl="https://contractorsischool.com/privacy-policy/mobile" />;
}
