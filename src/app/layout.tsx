import type { Metadata } from "next";
import { Suspense } from "react";

import { StudentShell } from "@/components/student-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ExamPrep", template: "%s | ExamPrep" },
  description: "Contractors Intelligence School exam preparation portal",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}><StudentShell>{children}</StudentShell></Suspense>
      </body>
    </html>
  );
}
