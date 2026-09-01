"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";

import { forgotPasswordSchema } from "@/lib/auth/schemas";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const valid = useMemo(() => forgotPasswordSchema.safeParse({ email }).success, [email]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || state === "saving") return;
    setState("saving");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const payload = (await response.json()) as { error?: { message?: string }; message?: string };
      if (!response.ok) throw new Error(payload.error?.message || "Unable to request password recovery.");
      setMessage(payload.message || "Password recovery instructions have been sent.");
      setState("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to request password recovery.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="auth-success" role="status">
        <h2>Check your email</h2>
        <p>{message}</p>
        <Link className="primary-button" href="/login">Return to sign in</Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <label>
        Email address
        <input type="email" autoComplete="email" inputMode="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      {state === "error" && message ? <p className="form-error" role="alert">{message}</p> : null}
      <button className="primary-button" type="submit" disabled={!valid || state === "saving"}>
        {state === "saving" ? "Sending…" : "Send recovery email"}
      </button>
      <div className="auth-links"><Link href="/login">Back to sign in</Link></div>
    </form>
  );
}
