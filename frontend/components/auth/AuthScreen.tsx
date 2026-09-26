"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login, register, saveSession } from "@/lib/api";

export function AuthScreen({ mode }: { mode: "login" | "register" }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        const form = new FormData(event.currentTarget);
        try {
            const result =
                mode === "login"
                    ? await login(String(form.get("email")), String(form.get("password")))
                    : await register(
                          String(form.get("name")),
                          String(form.get("email")),
                          String(form.get("password")),
                          String(form.get("currency")),
                      );
            if (!result.account) throw new Error("Account response was incomplete");
            saveSession(result.account);
            router.push("/dashboard");
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Unable to continue");
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="auth-shell">
            <div className="auth-intro">
                <div className="wordmark">
                </div>
                <div className="intro-copy">
                    <p className="eyebrow">MONEY, MADE CLEAR</p>
                    <h1>Your everyday wallet, without the fuss.</h1>
                    <p>Pay, receive, and keep track of your balance in one calm place.</p>
                </div>
                <div className="intro-note">
                    <span>✓</span> Secure cookie-based sign in
                </div>
            </div>
            <section className="auth-panel">
                <div className="auth-tabs">
                    <Link className={mode === "login" ? "active" : ""} href="/login">
                        Sign in
                    </Link>
                    <Link className={mode === "register" ? "active" : ""} href="/register">
                        Create account
                    </Link>
                </div>
                <h2>{mode === "login" ? "Welcome back" : "Open your wallet"}</h2>
                <p className="muted">
                    {mode === "login"
                        ? "Sign in to continue."
                        : "It takes less than a minute to get started."}
                </p>
                <form className="auth-form" onSubmit={submit}>
                    {mode === "register" && (
                        <label>
                            Your name
                            <input name="name" required placeholder="Aarav Mehta" />
                        </label>
                    )}
                    <label>
                        Email address
                        <input name="email" required type="email" placeholder="you@example.com" />
                    </label>
                    <label>
                        Password
                        <input
                            name="password"
                            required
                            type="password"
                            minLength={6}
                            placeholder="At least 6 characters"
                        />
                    </label>
                    {mode === "register" && (
                        <label>
                            Currency
                            <select name="currency" defaultValue="INR">
                                <option value="INR">INR · Indian Rupee</option>
                                <option value="USD">USD · US Dollar</option>
                                <option value="EUR">EUR · Euro</option>
                            </select>
                        </label>
                    )}
                    {error && <div className="alert error">{error}</div>}
                    <button className="primary-button" disabled={busy}>
                        {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
                        <span>→</span>
                    </button>
                </form>
            </section>
        </main>
    );
}
