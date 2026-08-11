// Demo authentication only — accepts any email/password combination.
// There is no real backend check; this exists purely to gate the UI behind
// a login screen for demo purposes. Do not use this pattern in production.

const STORAGE_KEY = "tco_auth_session";

export type AuthSession = {
  email: string;
  loginAt: number;
};

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

// Demo login: any non-empty email + password is accepted.
export function login(email: string, _password: string): AuthSession {
  const session: AuthSession = { email, loginAt: Date.now() };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new Event("tco-auth-change"));
  }
  return session;
}

export function logout(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("tco-auth-change"));
}
