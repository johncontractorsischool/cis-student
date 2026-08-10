"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { loginSchema } from "@/lib/auth/schemas";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const valid = useMemo(
    () => loginSchema.safeParse({ email, password }).success,
    [email, password],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const payload = (await response.json()) as { error?: { message?: string } };

      if (!response.ok) {
        setError(payload.error?.message || "Unable to sign in. Please try again.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Temporary network issue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <label>
        Email address
        <input
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-describedby={error ? "login-error" : undefined}
          required
        />
      </label>
      <label>
        Password
        <span className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
          <button
            type="button"
            className="reveal-button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </span>
      </label>
      {error ? (
        <p className="form-error" id="login-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="primary-button" type="submit" disabled={!valid || submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </button>
      <div className="auth-links">
        <Link href="/forgot-password">Forgot password?</Link>
        <Link href="/register">Create account</Link>
      </div>
    </form>
  );
}
