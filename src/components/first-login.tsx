"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { AccountProfile } from "@/lib/account/presentation";
import { US_STATES } from "@/lib/account/states";

type FirstLoginStep =
  | "agreement"
  | "password"
  | "prescreen"
  | "profile"
  | "saving-agreement"
  | "saving-password"
  | "saving-prescreen"
  | "saving-profile";

type StableStep = "agreement" | "password" | "prescreen" | "profile";

export function FirstLogin({
  agreementHtml,
  initialProfile,
  initialStep,
}: {
  agreementHtml: string;
  initialProfile: AccountProfile;
  initialStep: StableStep;
}) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [step, setStep] = useState<FirstLoginStep>(initialStep);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(initialProfile);

  function finish(nextPath = "/dashboard") {
    router.replace(nextPath);
    router.refresh();
  }

  async function acceptAgreement() {
    if (!accepted || step === "saving-agreement") return;
    setStep("saving-agreement");
    setError("");
    try {
      const response = await fetch("/api/auth/accept-terms", { method: "POST" });
      const payload = (await response.json()) as {
        data?: { nextPath?: string; nextStep?: StableStep | "complete"; showPrescreen?: boolean };
        error?: { message?: string };
      };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to accept the agreement.");
      if (payload.data.nextStep === "complete") return finish(payload.data.nextPath);
      setStep(payload.data.showPrescreen ? "prescreen" : "password");
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
      const payload = (await response.json()) as {
        data?: { nextPath?: string; nextStep?: StableStep | "complete" };
        error?: { message?: string };
      };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to save your answer.");
      if (payload.data.nextStep === "complete") return finish(payload.data.nextPath);
      setStep(payload.data.nextStep === "profile" ? "profile" : "password");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save your answer.");
      setStep("prescreen");
    }
  }

  async function changeTemporaryPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep("saving-password");
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/first-login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.get("currentPassword"),
          newPassword: data.get("newPassword"),
          confirmPassword: data.get("confirmPassword"),
        }),
      });
      const payload = (await response.json()) as {
        data?: { nextPath?: string; nextStep?: "profile" };
        error?: { message?: string };
      };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to update your password.");
      if (payload.data.nextPath) return finish(payload.data.nextPath);
      setStep("profile");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update your password.");
      setStep("password");
    }
  }

  async function completeProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep("saving-profile");
    setError("");
    try {
      const response = await fetch("/api/auth/complete-first-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: profile.address,
          city: profile.city,
          lname: profile.lastName,
          mobilenum: profile.phone,
          name: profile.firstName,
          state: profile.state,
          zip: profile.zip,
        }),
      });
      const payload = (await response.json()) as { data?: { nextPath?: string }; error?: { message?: string } };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to complete your profile.");
      finish(payload.data.nextPath);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to complete your profile.");
      setStep("profile");
    }
  }

  if (step === "prescreen" || step === "saving-prescreen") {
    return (
      <main className="first-login-page">
        <section className="prescreen-card" aria-labelledby="prescreen-title">
          <FirstLoginProgress current="prescreen" />
          <p className="eyebrow">Application setup</p>
          <h1 id="prescreen-title">Do you already hold a California contractor license?</h1>
          <p>Choose Yes for an additional classification or No for your first original license.</p>
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

  if (step === "password" || step === "saving-password") {
    return (
      <main className="first-login-page">
        <form className="prescreen-card first-login-form" onSubmit={changeTemporaryPassword}>
          <FirstLoginProgress current="password" />
          <p className="eyebrow">Secure your account</p>
          <h1>Change your temporary password</h1>
          <p>Use the password you signed in with as your current password.</p>
          <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
          <label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength={6} required /></label>
          <label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={6} required /></label>
          <small>Use at least six characters with a letter and a number.</small>
          <button className="primary-button" disabled={step === "saving-password"} type="submit">{step === "saving-password" ? "Updating…" : "Update password"}</button>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </form>
      </main>
    );
  }

  if (step === "profile" || step === "saving-profile") {
    return (
      <main className="first-login-page">
        <form className="agreement-card first-login-profile" onSubmit={completeProfile}>
          <FirstLoginProgress current="profile" />
          <header><p className="eyebrow">Final step</p><h1>Confirm your student profile</h1><p>Keep your contact information current for course and licensing support.</p></header>
          <div className="account-form-grid">
            <label>First name<input value={profile.firstName} onChange={(event) => setProfile({ ...profile, firstName: event.target.value })} required /></label>
            <label>Last name<input value={profile.lastName} onChange={(event) => setProfile({ ...profile, lastName: event.target.value })} required /></label>
            <label className="wide">Email<input value={profile.email} readOnly aria-readonly="true" /></label>
            <label>Phone<input inputMode="tel" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="10-digit phone" /></label>
            <label>Address<input value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} /></label>
            <label>City<input value={profile.city} onChange={(event) => setProfile({ ...profile, city: event.target.value })} /></label>
            <label>State<select value={profile.state} onChange={(event) => setProfile({ ...profile, state: event.target.value })}>{US_STATES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>ZIP code<input inputMode="numeric" value={profile.zip} onChange={(event) => setProfile({ ...profile, zip: event.target.value })} /></label>
          </div>
          <footer><span>These details can be changed later in My Account.</span><button className="primary-button" disabled={step === "saving-profile"} type="submit">{step === "saving-profile" ? "Saving…" : "Save and continue"}</button>{error ? <p className="form-error" role="alert">{error}</p> : null}</footer>
        </form>
      </main>
    );
  }

  return (
    <main className="first-login-page">
      <section className="agreement-card" aria-labelledby="agreement-title">
        <FirstLoginProgress current="agreement" />
        <header><p className="eyebrow">Required before continuing</p><h1 id="agreement-title">Student enrollment agreement</h1><p>Please review and accept the agreement to access ExamPrep.</p></header>
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

function FirstLoginProgress({ current }: { current: StableStep }) {
  const steps: Array<{ id: StableStep; label: string }> = [
    { id: "agreement", label: "Agreement" },
    { id: "prescreen", label: "Prescreen" },
    { id: "password", label: "Password" },
    { id: "profile", label: "Profile" },
  ];
  const currentIndex = steps.findIndex((item) => item.id === current);
  return (
    <ol className="first-login-progress" aria-label="Account setup progress">
      {steps.map((item, index) => <li className={index < currentIndex ? "complete" : index === currentIndex ? "current" : ""} aria-current={index === currentIndex ? "step" : undefined} key={item.id}><span>{index < currentIndex ? "✓" : index + 1}</span><small>{item.label}</small></li>)}
    </ol>
  );
}
