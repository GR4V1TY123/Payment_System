export type Account = {
    account_id: string | number;
    name: string;
    email: string;
    currency?: string;
    balance?: number | string;
};

export type Payment = {
    payment_id: string | number;
    sender_id?: string | number;
    receiver_id?: string | number;
    amount: number | string;
    currency?: string;
    status?: string;
    payment_type?: string;
    created_at?: string;
    notes?: string;
};

type ApiResponse = {
    success?: boolean;
    message?: string;
    account?: Account;
    rows?: Array<Account | Payment>;
};

export const accountId = (account: Account) => String(account.account_id);

async function request<T extends ApiResponse>(path: string, options: RequestInit = {}) {
    const response = await fetch(`/api${path}`, {
        ...options,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const data = (await response.json().catch(() => ({}))) as T;
    if (!response.ok) throw new Error(data.message || "Something went wrong");
    return data;
}

export const login = (email: string, password: string) =>
    request<{ account?: Account; message?: string }>("/accounts/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
export const register = (name: string, email: string, password: string, currency: string) =>
    request<{ account?: Account; message?: string }>("/accounts", {
        method: "POST",
        body: JSON.stringify({ name, email, password, currency }),
    });

export const getAccount = async (id: string) => {
    const result = await request<{ rows?: Account[] }>(`/accounts/${id}`);
    return result.rows?.[0];
};

export const getPaymentHistory = async (id: string) => {
    const result = await request<{ rows?: Payment[] }>(`/accounts/${id}/payments`);
    return result.rows || [];
};

export const getLedger = async (id: string) => {
    const result = await request<{ rows?: Payment[] }>(`/accounts/${id}/ledger`);
    return result.rows || [];
};

export const sendPayment = (receiverId: string, amount: number, currency: string, notes: string) =>
    request("/payments", {
        method: "POST",
        headers: { idempotency_key: crypto.randomUUID() },
        body: JSON.stringify({ receiver_id: receiverId, amount, currency, notes }),
    });
export const deposit = (id: string, amount: number, currency: string, notes: string) =>
    request(`/accounts/${id}/deposit`, {
        method: "POST",
        headers: { idempotency_key: crypto.randomUUID() },
        body: JSON.stringify({ amount, currency, notes }),
    });
export const logout = () => request("/accounts/logout", { method: "POST" });

export const saveSession = (account: Account) =>
    window.localStorage.setItem("pocketpay_account", JSON.stringify(account));
export const readSession = () => {
    const saved = window.localStorage.getItem("pocketpay_account");
    return saved ? (JSON.parse(saved) as Account) : null;
};
export const clearSession = () => window.localStorage.removeItem("pocketpay_account");
