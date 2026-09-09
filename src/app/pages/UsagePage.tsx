import { useEffect, useState } from "react";
import { CreditCard, Phone, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getOrgFromFirestore } from "../lib/rbac";
import { recordAuditEvent } from "../lib/adminApi";
import { safeLog } from "../lib/safeLog";
import { PageHeader } from "../components/shared/PageHeader";
import { SkeletonBlock } from "../components/shared/UiKit";

const PLAN_CREDITS: Record<string, number> = {
  Starter: 5000,
  Growth: 20000,
  Enterprise: 100000,
};

export function UsagePage() {
  const { session } = useAuth();
  const orgId = session?.user.orgId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState({
    name: "",
    plan: "Starter",
    totalCalls: 0,
    creditsLimit: 5000,
  });

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      setError("No organisation is linked to this login.");
      return;
    }
    (async () => {
      try {
        const org = await getOrgFromFirestore(orgId);
        if (!org) {
          setError("Could not load your organisation usage.");
          return;
        }
        setUsage({
          name: org.name || session?.user.name || "Your organisation",
          plan: org.plan || "Starter",
          totalCalls: org.totalCalls,
          creditsLimit: org.creditsLimit || PLAN_CREDITS[org.plan || "Starter"] || 5000,
        });
        await recordAuditEvent({ action: "view_usage", orgId, detail: "Opened usage page" });
      } catch (err) {
        safeLog.warn("usage load failed", err);
        setError("Could not load usage for your organisation.");
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId, session?.user.name]);

  const used = usage.totalCalls;
  const limit = usage.creditsLimit;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <div>
      <PageHeader
        title="Usage & credits"
        subtitle="Only your organisation’s numbers are shown."
      />

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-[#FECACA] bg-[#FEE2E2] p-3 mb-4" role="alert">
          <AlertCircle size={14} className="shrink-0 mt-0.5 text-[#DC2626]" />
          <p className="text-[13px] m-0 text-[#DC2626]">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" aria-hidden>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="vo-card p-4 min-h-[96px] flex flex-col gap-3">
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-6 w-24" />
            </div>
          ))}
        </div>
      ) : !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="vo-card p-4">
            <div className="text-[11px] font-medium uppercase tracking-wider mb-2 text-[#7A746C]">Plan</div>
            <div className="text-[20px] font-semibold text-[#1E1A14]">{usage.plan}</div>
            <div className="text-[12px] mt-1 text-[#7A746C]">{usage.name}</div>
          </div>
          <div className="vo-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#7A746C]">Calls used</span>
              <Phone size={14} className="text-[#50381F]" />
            </div>
            <div className="text-[20px] font-semibold text-[#1E1A14]">{used.toLocaleString()}</div>
          </div>
          <div className="vo-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#7A746C]">Credit limit</span>
              <CreditCard size={14} className="text-[#50381F]" />
            </div>
            <div className="text-[20px] font-semibold text-[#1E1A14]">{limit.toLocaleString()}</div>
            <div className="text-[12px] mt-1 text-[#7A746C]">{pct}% used</div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="vo-card p-5">
          <div className="flex justify-between text-[12px] mb-2 text-[#7A746C]">
            <span>Credits consumed (1 call = 1 credit)</span>
            <span>{used.toLocaleString()} / {limit.toLocaleString()}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-[#ECE6D9]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, backgroundColor: pct > 90 ? "#DC2626" : "#50381F" }} />
          </div>
        </div>
      )}
    </div>
  );
}
