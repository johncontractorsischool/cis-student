import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { currentUserForPage, entryPathForSession } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await currentUserForPage();
  if (user) redirect(await entryPathForSession(user));

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-big.png" alt="Contractors Intelligence School" />
        </div>
        <div className="auth-card-content">
          <p className="eyebrow">Welcome back</p>
          <h1 id="login-title">Sign in to ExamPrep</h1>
          <p className="muted">Continue your courses, practice tests, and licensing progress.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
