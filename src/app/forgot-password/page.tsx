import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="forgot-password-title">
        <div className="auth-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-big.png" alt="Contractors Intelligence School" />
        </div>
        <div className="auth-card-content">
          <p className="eyebrow">Account recovery</p>
          <h1 id="forgot-password-title">Forgot your password?</h1>
          <p className="muted">Enter the email address associated with your CIS account.</p>
          <ForgotPasswordForm />
          <nav className="legal-links" aria-label="Legal"><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link></nav>
        </div>
      </section>
    </main>
  );
}
