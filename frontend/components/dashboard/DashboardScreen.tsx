"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Account,
    accountId,
    clearSession,
    deposit,
    getAccount,
    getPaymentHistory,
    logout,
    Payment,
    readSession,
    saveSession,
    sendPayment,
} from "@/lib/api";

const money = (value: number | string | undefined, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
const dateOf = (value?: string) =>
    value
        ? new Date(value).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
          })
        : "Pending";

export function DashboardScreen() {
    const router = useRouter();
    const [account, setAccount] = useState<Account | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    async function refresh(current: Account) {
        const id = accountId(current);
        const [details, history] = await Promise.all([getAccount(id), getPaymentHistory(id)]);
        const fresh = details || current;
        setAccount(fresh);
        saveSession(fresh);
        setPayments(history);
    }

    useEffect(() => {
        void (async () => {
            await Promise.resolve();
            const saved = readSession();
            if (!saved) {
                router.replace("/login");
                return;
            }
            await refresh(saved)
                .catch(() => {
                    clearSession();
                    router.replace("/login");
                })
                .finally(() => setLoading(false));
        })();
    }, [router]);

    const handlePayment = async (event: FormEvent<HTMLFormElement>, type: "send" | "add") => {
        event.preventDefault();

        const form = event.currentTarget; // capture it immediately

        if (!account) return;

        setBusy(true);
        setError("");
        setNotice("");

        const formData = new FormData(form);
        const amount = Number(formData.get("amount"));
        const currency = account.currency || "INR";

        try {
            if (type === "send") {
                await sendPayment(
                    String(formData.get("receiver")),
                    amount,
                    currency,
                    String(formData.get("notes") || ""),
                );
            } else {
                await deposit(
                    accountId(account),
                    amount,
                    currency,
                    String(formData.get("notes") || ""),
                );
            }

            setNotice(
                type === "send" ? "Payment sent for processing." : "Top-up added for processing.",
            );

            form.reset();

            await refresh(account);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Payment could not be submitted");
        } finally {
            setBusy(false);
        }
    };

    const handleLogout = async () => {
        setBusy(true);
        try {
            await logout();
        } catch {
            /* clear local state when the server token has expired */
        } finally {
            clearSession();
            router.replace("/login");
            setBusy(false);
        }
    };
    if (loading)
        return (
            <main className="splash">
                <div className="brand-mark">P</div>
                <p>Loading your wallet...</p>
            </main>
        );
    if (!account) return null;
    const currency = account.currency || "INR";

    return (
        <main className="shell">
            <header className="topbar">
                <div className="wordmark">
                    <span className="brand-mark">P</span>
                    <span>PocketPay</span>
                </div>
                <div className="profile">
                    <span className="avatar">{account.name.charAt(0).toUpperCase()}</span>
                    <div>
                        <strong>{account.name}</strong>
                        <small>{account.email}</small>
                    </div>
                    <button className="text-button" onClick={handleLogout} disabled={busy}>
                        Log out
                    </button>
                </div>
            </header>
            <section className="welcome">
                <div>
                    <p className="eyebrow">PERSONAL WALLET</p>
                    <h1>Good to see you, {account.name.split(" ")[0]}.</h1>
                    <p className="muted">Move money simply, and keep an eye on every payment.</p>
                </div>
                <div className="status">
                    <span className="status-dot" /> Account active
                </div>
            </section>
            <section className="dashboard-grid">
                <div className="balance-card">
                    <div className="card-label">
                        Available balance <span>•••</span>
                    </div>
                    <div className="balance">{money(account.balance, currency)}</div>
                    <div className="balance-footer">
                        <span>{currency} wallet</span>
                        <span>Account #{accountId(account)}</span>
                    </div>
                </div>
                <div className="action-card">
                    <h2>Make a payment</h2>
                    <p className="muted">Send money to another PocketPay account.</p>
                    <form onSubmit={(event) => handlePayment(event, "send")}>
                        <label>
                            Recipient account ID
                            <input
                                name="receiver"
                                required
                                inputMode="numeric"
                                placeholder="e.g. 1042"
                            />
                        </label>
                        <label>
                            Amount
                            <input
                                name="amount"
                                required
                                type="number"
                                min="1"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </label>
                        <label>
                            Note <span className="optional">optional</span>
                            <input name="notes" placeholder="What is this for?" />
                        </label>
                        <button className="primary-button" disabled={busy}>
                            {busy ? "Sending..." : "Send payment"}
                            <span>→</span>
                        </button>
                    </form>
                </div>
                <div className="action-card">
                    <div className="card-title-row">
                        <div>
                            <h2>Add money</h2>
                            <p className="muted">Top up your {currency} wallet.</p>
                        </div>
                        <span className="round-icon">+</span>
                    </div>
                    <form onSubmit={(event) => handlePayment(event, "add")}>
                        <label>
                            Amount
                            <input
                                name="amount"
                                required
                                type="number"
                                min="1"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </label>
                        <label>
                            Note <span className="optional">optional</span>
                            <input name="notes" placeholder="Add a note" />
                        </label>
                        <button className="secondary-button" disabled={busy}>
                            {busy ? "Adding..." : "Add money"}
                            <span>+</span>
                        </button>
                    </form>
                </div>
            </section>
            {(notice || error) && (
                <div className={error ? "alert error" : "alert success"}>{error || notice}</div>
            )}
            <section className="history">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">YOUR ACTIVITY</p>
                        <h2>Recent payments</h2>
                    </div>
                    <span className="history-count">{payments.length} total</span>
                </div>
                {payments.length === 0 ? (
                    <div className="empty">
                        <div className="empty-icon">↗</div>
                        <strong>Your payment history is empty</strong>
                        <p>Payments and top-ups will appear here.</p>
                    </div>
                ) : (
                    <div className="payment-list">
                        {payments.slice(0, 8).map((payment) => {
                            const incoming = String(payment.receiver_id) === accountId(account);
                            return (
                                <div className="payment-row" key={String(payment.payment_id)}>
                                    <span
                                        className={
                                            incoming ? "payment-icon incoming" : "payment-icon"
                                        }
                                    >
                                        {incoming ? "↓" : "↑"}
                                    </span>
                                    <div className="payment-info">
                                        <strong>
                                            {payment.payment_type === "DEPOSIT"
                                                ? "Added money"
                                                : incoming
                                                  ? "Money received"
                                                  : `To account ${payment.receiver_id}`}
                                        </strong>
                                        <small>
                                            {dateOf(payment.created_at)}
                                            {payment.notes ? ` · ${payment.notes}` : ""}
                                        </small>
                                    </div>
                                    <div className="payment-amount">
                                        <strong className={incoming ? "incoming-text" : ""}>
                                            {incoming ? "+" : "-"}
                                            {money(payment.amount, payment.currency || currency)}
                                        </strong>
                                        <small>{payment.status || "Processing"}</small>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
