"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type FirstLoginStep = "agreement" | "prescreen" | "saving-agreement" | "saving-prescreen";

export function FirstLogin({ agreementHtml }: { agreementHtml: string }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [step, setStep] = useState<FirstLoginStep>("agreement");
  const [error, setError] = useState("");

  async function acceptAgreement() {
    if (!accepted || step === "saving-agreement") return;
    setStep("saving-agreement");
    setError("");
    try {
      const response = await fetch("/api/auth/accept-terms", { method: "POST" });
      const payload = (await response.json()) as {
        data?: { nextPath?: string; showPrescreen?: boolean };
        error?: { message?: string };
      };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to accept the agreement.");
      if (payload.data.showPrescreen) {
        setStep("prescreen");
        return;
      }
      router.replace(payload.data.nextPath || "/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to accept the agreement.");
      setStep("agreement");
    }
  }

  async function answerPrescreen(hasLicense: boolean) {
    if (step === "saving-prescreen") return;
    setStep("saving-prescreen");
    setError("");
    try {
      const response = await fetch("/api/auth/first-login-prescreen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasLicense }),
      });
      const payload = (await response.json()) as { data?: { nextPath?: string }; error?: { message?: string } };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to save your answer.");
      router.replace(payload.data.nextPath || "/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save your answer.");
      setStep("prescreen");
    }
  }

  if (step === "prescreen" || step === "saving-prescreen") {
    return (
      <main className="first-login-page">
        <section className="prescreen-card" aria-labelledby="prescreen-title">
          <p className="eyebrow">One last question</p>
          <h1 id="prescreen-title">Is this your first California contractor license?</h1>
          <p>Your answer helps CIS prepare the correct iApplication experience for you.</p>
          <div className="prescreen-actions">
            <button type="button" disabled={step === "saving-prescreen"} onClick={() => void answerPrescreen(true)}>Yes</button>
            <button type="button" disabled={step === "saving-prescreen"} onClick={() => void answerPrescreen(false)}>No</button>
          </div>
          {step === "saving-prescreen" ? <p role="status">Saving your answer…</p> : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="first-login-page">
      <section className="agreement-card" aria-labelledby="agreement-title">
        <header>
          <p className="eyebrow">Required before continuing</p>
          <h1 id="agreement-title">Student enrollment agreement</h1>
          <p>Please review and accept the agreement to access ExamPrep.</p>
        </header>
        <div className="agreement-body" dangerouslySetInnerHTML={{ __html: agreementHtml }} />
        <footer>
          <label><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />I accept the terms and conditions.</label>
          <button className="primary-button" type="button" disabled={!accepted || step === "saving-agreement"} onClick={() => void acceptAgreement()}>{step === "saving-agreement" ? "Accepting…" : "Accept and continue"}</button>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <nav className="legal-links" aria-label="Legal"><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link></nav>
        </footer>
      </section>
    </main>
  );
}
