"use client";

import {
  ArrowLeft,
  KeyRound,
  Languages,
  RefreshCcw,
  Save,
  ShieldAlert,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { AccountProfile } from "@/lib/account/presentation";
import { US_STATES } from "@/lib/account/states";

const LANGUAGE_STORAGE_KEY = "cis:demo-language";

type Notice = { kind: "error" | "success"; message: string } | null;

async function responseData<T>(response: Response, fallback: string): Promise<T> {
  const payload = (await response.json()) as { data?: T; error?: { message?: string } };
  if (!response.ok || !payload.data) throw new Error(payload.error?.message || fallback);
  return payload.data;
}

export function AccountSettings({ initialProfile }: { initialProfile: AccountProfile }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState<Notice>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [languageSaving, setLanguageSaving] = useState(false);
  const [languageNotice, setLanguageNotice] = useState<Notice>(null);
  const [resetting, setResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState<Notice>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<Notice>(null);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileSaving(true);
    setProfileNotice(null);
    try {
      const updated = await responseData<AccountProfile>(await fetch("/api/account/profile", {
        method: "PATCH",
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
      }), "Unable to update your profile.");
      setProfile(updated);
      setProfileNotice({ kind: "success", message: "Profile updated." });
    } catch (cause) {
      setProfileNotice({ kind: "error", message: cause instanceof Error ? cause.message : "Unable to update your profile." });
    } finally {
      setProfileSaving(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordNotice(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await responseData<{ updated: boolean }>(await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.get("currentPassword"),
          newPassword: data.get("newPassword"),
          confirmPassword: data.get("confirmPassword"),
        }),
      }), "Unable to update your password.");
      form.reset();
      setPasswordNotice({ kind: "success", message: "Password updated." });
    } catch (cause) {
      setPasswordNotice({ kind: "error", message: cause instanceof Error ? cause.message : "Unable to update your password." });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function changeLanguage(language: "en" | "es") {
    if (languageSaving || language === profile.language) return;
    setLanguageSaving(true);
    setLanguageNotice(null);
    try {
      const updated = await responseData<AccountProfile>(await fetch("/api/account/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: language }),
      }), "Unable to update your language.");
      setProfile(updated);
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      setLanguageNotice({ kind: "success", message: "Language preference updated." });
    } catch (cause) {
      setLanguageNotice({ kind: "error", message: cause instanceof Error ? cause.message : "Unable to update your language." });
    } finally {
      setLanguageSaving(false);
    }
  }

  async function resetExams() {
    if (!window.confirm("Reset all completed exams and attempt history? This cannot be undone.")) return;
    setResetting(true);
    setResetNotice(null);
    try {
      await responseData<{ reset: boolean }>(await fetch("/api/account/reset-exams", { method: "POST" }), "Unable to reset your exams.");
      setResetNotice({ kind: "success", message: "Completed exams were reset." });
    } catch (cause) {
      setResetNotice({ kind: "error", message: cause instanceof Error ? cause.message : "Unable to reset your exams." });
    } finally {
      setResetting(false);
    }
  }

  async function deleteAccount() {
    if (deleteConfirmation !== "DELETE" || deleting) return;
    if (!window.confirm("Permanently delete this account? This action cannot be undone.")) return;
    setDeleting(true);
    setDeleteNotice(null);
    try {
      await responseData<{ deleted: boolean }>(await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      }), "Unable to delete your account.");
      router.replace("/login");
      router.refresh();
    } catch (cause) {
      setDeleteNotice({ kind: "error", message: cause instanceof Error ? cause.message : "Unable to delete your account." });
      setDeleting(false);
    }
  }

  return (
    <main className="account-page">
      <header className="account-heading">
        <Link href="/dashboard" aria-label="Back to dashboard"><ArrowLeft aria-hidden="true" /></Link>
        <span><UserRound aria-hidden="true" /></span>
        <div><p>Student settings</p><h1>My Account</h1><strong>{profile.email}</strong></div>
      </header>

      <div className="account-layout">
        <form className="account-card account-profile-card" onSubmit={saveProfile}>
          <AccountCardHeading icon={UserRound} title="Profile information" description="Keep your contact details current." />
          <div className="account-form-grid">
            <label>First name<input value={profile.firstName} onChange={(event) => setProfile({ ...profile, firstName: event.target.value })} required /></label>
            <label>Last name<input value={profile.lastName} onChange={(event) => setProfile({ ...profile, lastName: event.target.value })} required /></label>
            <label className="wide">Email<input value={profile.email} readOnly aria-readonly="true" /><small>Contact CIS to change your sign-in email.</small></label>
            <label>Phone<input inputMode="tel" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="10-digit phone" /></label>
            <label>Address<input value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} /></label>
            <label>City<input value={profile.city} onChange={(event) => setProfile({ ...profile, city: event.target.value })} /></label>
            <label>State<select value={profile.state} onChange={(event) => setProfile({ ...profile, state: event.target.value })}>{US_STATES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>ZIP code<input inputMode="numeric" value={profile.zip} onChange={(event) => setProfile({ ...profile, zip: event.target.value })} /></label>
          </div>
          <AccountNotice notice={profileNotice} />
          <button className="account-action" type="submit" disabled={profileSaving}><Save aria-hidden="true" />{profileSaving ? "Saving…" : "Save profile"}</button>
        </form>

        <div className="account-side">
          <section className="account-card">
            <AccountCardHeading icon={Languages} title="Language" description="Persist your preferred course language." />
            <div className="account-language" role="group" aria-label="Preferred language">
              <button className={profile.language === "en" ? "selected" : ""} disabled={languageSaving} onClick={() => void changeLanguage("en")}>English</button>
              <button className={profile.language === "es" ? "selected" : ""} disabled={languageSaving} onClick={() => void changeLanguage("es")}>Español</button>
            </div>
            <AccountNotice notice={languageNotice} />
          </section>

          <form className="account-card" onSubmit={changePassword}>
            <AccountCardHeading icon={KeyRound} title="Change password" description="Use at least six characters with a letter and number." />
            <div className="account-password-fields">
              <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
              <label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength={6} required /></label>
              <label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={6} required /></label>
            </div>
            <AccountNotice notice={passwordNotice} />
            <button className="account-action" type="submit" disabled={passwordSaving}><KeyRound aria-hidden="true" />{passwordSaving ? "Updating…" : "Update password"}</button>
          </form>

          <section className="account-card account-danger-card">
            <AccountCardHeading icon={RefreshCcw} title="Reset completed exams" description="Clear completed tests and attempt history so you can start again." />
            <AccountNotice notice={resetNotice} />
            <button className="account-secondary-action" type="button" disabled={resetting} onClick={() => void resetExams()}><RefreshCcw aria-hidden="true" />{resetting ? "Resetting…" : "Reset exams"}</button>
          </section>

          {profile.canDelete ? (
            <section className="account-card account-danger-card">
              <AccountCardHeading icon={ShieldAlert} title="Delete account" description="Permanently remove this eligible app-created account." />
              <label>Type DELETE to confirm<input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /></label>
              <AccountNotice notice={deleteNotice} />
              <button className="account-delete-action" type="button" disabled={deleteConfirmation !== "DELETE" || deleting} onClick={() => void deleteAccount()}><ShieldAlert aria-hidden="true" />{deleting ? "Deleting…" : "Delete account"}</button>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function AccountCardHeading({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return <header className="account-card-heading"><span><Icon aria-hidden="true" /></span><div><h2>{title}</h2><p>{description}</p></div></header>;
}

function AccountNotice({ notice }: { notice: Notice }) {
  return notice ? <p className={`account-notice ${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>{notice.message}</p> : null;
}
