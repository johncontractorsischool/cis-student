import type { Metadata } from "next";
import { Suspense } from "react";

import { LearningNavigation } from "@/components/learning-navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ExamPrep", template: "%s | ExamPrep" },
  description: "Contractors Intelligence School exam preparation portal",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}><LearningNavigation /></Suspense>
        {children}
      </body>
    </html>
  );
}
