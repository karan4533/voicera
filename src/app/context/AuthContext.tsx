import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  onIdTokenChanged,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import { auth as firebaseAuth } from "../lib/firebase";
import { setCachedSession } from "../lib/auth";
import type { AuthSession } from "../lib/auth";
import type { AgentType } from "../lib/types";
import {
  getRoleFromTokenResult,
  getOrgIdFromTokenResult,
  getSubscribedAgents,
  getOrgFromFirestore,
  getOrgByEmailFromFirestore,
} from "../lib/rbac";

// ── Context shape ─────────────────────────────────────────────────────────────
// Identical surface to the old mock context — all consumers are unchanged.

interface AuthContextValue {
  session: AuthSession | null;
  /** true while Firebase resolves the initial auth state on cold load */
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Kept synchronous at the call-site; Firebase signOut is fire-and-forget */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Helper — map Firebase User → AuthSession ──────────────────────────────────

async function buildSession(user: User): Promise<AuthSession> {
  // getIdTokenResult() returns the decoded token with custom claims.
  // We use this as the primary source for role; rbac.ts falls back to email.
  const tokenResult = await user.getIdTokenResult();
  const email = user.email ?? "";

  const role  = getRoleFromTokenResult(tokenResult, email);
  const orgId = getOrgIdFromTokenResult(tokenResult, email);

  // ── Subscription resolution (two-step) ──────────────────────────────────────
  // 1. Try Firestore — the source of truth for all accounts created via the
  //    Platform Admin console. The `createCustomerAccount` Cloud Function
  //    writes `organizations/{orgId}.subscribedAgents` on account creation.
  // 2. Fall back to the static demo seed map for the 6 pre-seeded orgs whose
  //    orgIds are email-derived and have no Firestore record.
  let subscribedAgents: AgentType[] | undefined;
  let orgStatus: AuthSession["user"]["orgStatus"];
  if (role === "platform_admin") {
    subscribedAgents = undefined;
    orgStatus = undefined;
  } else if (orgId) {
    let org = await getOrgFromFirestore(orgId);
    if (!org && email) {
      const byEmail = await getOrgByEmailFromFirestore(email);
      if (byEmail) {
        org = { subscribedAgents: byEmail.subscribedAgents, status: byEmail.status };
      }
    }
    if (org) {
      subscribedAgents = org.subscribedAgents;
      orgStatus = org.status;
    } else {
      subscribedAgents = getSubscribedAgents(orgId) ?? [];
      orgStatus = "active";
    }
  } else {
    subscribedAgents = [];
    orgStatus = undefined;
  }

  return {
    token: tokenResult.token,
    user: {
      email,
      name:
        user.displayName ??
        (email
          ? email
              .split("@")[0]
              .replace(/[._]/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())
          : "User"),
      role,
      orgId,
      subscribedAgents,
      orgStatus,
    },
    // Firebase ID tokens are valid for 1 hour; onIdTokenChanged fires on
    // automatic refresh so this cache stays current without any polling.
    expiresAt: Date.now() + 60 * 60 * 1000,
  };
}


// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  // Start as `true` — prevents ProtectedRoute from flashing a redirect to
  // /login on page refresh before Firebase has resolved the persisted session.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onIdTokenChanged is preferred over onAuthStateChanged because it fires
    // on three events:
    //   1. Initial load  — resolves the persisted session from IndexedDB
    //   2. Sign-in / sign-out
    //   3. Automatic token refresh (~every 55 min) — keeps getSession().token
    //      fresh for apiFetch() in api.ts without any manual polling.
    const unsubscribe = onIdTokenChanged(firebaseAuth, async (user) => {
      if (user) {
        const s = await buildSession(user);
        setCachedSession(s);   // keep the synchronous cache in auth.ts in sync
        setSession(s);
      } else {
        setCachedSession(null);
        setSession(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      // Set storage persistence before signing in so the credential lands in
      // the right storage tier:
      //   rememberMe=true  → browserLocalPersistence  (survives browser close)
      //   rememberMe=false → browserSessionPersistence (cleared on tab close)
      await setPersistence(
        firebaseAuth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      // onIdTokenChanged fires next and updates session state automatically.
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    // Google sign-in always uses local persistence so the session survives
    // across browser restarts (consistent with typical OAuth UX).
    await setPersistence(firebaseAuth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(firebaseAuth, provider);
    // onIdTokenChanged fires next and updates session state automatically.
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(firebaseAuth, email);
  }, []);

  const logout = useCallback(() => {
    // fire-and-forget — onIdTokenChanged fires with null and clears state
    signOut(firebaseAuth);
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, login, loginWithGoogle, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
