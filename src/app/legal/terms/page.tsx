import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return <LegalPage title="Terms of service" description="Review the terms that apply to your CIS account and use of ExamPrep." externalUrl="https://contractorsischool.com/terms-of-service/mobile" />;
}
