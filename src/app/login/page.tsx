import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await hasSession()) redirect("/dashboard");

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
