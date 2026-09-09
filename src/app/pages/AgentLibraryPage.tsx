import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Utensils, Landmark, ShoppingBag, Headphones, Stethoscope,
  Building2, Shield, Users, CreditCard, Cpu, Bot, Rocket,
} from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { EmptyState, SearchField } from "../components/shared/UiKit";
import { AGENT_TYPES } from "../context/AgentContext";
import { useAuth } from "../context/AuthContext";
import type { AgentType } from "../lib/types";

const ICON_MAP: Record<string, React.ElementType> = {
  Utensils, Landmark, ShoppingBag, HeadphonesIcon: Headphones,
  Stethoscope, Building2, Shield, Users, CreditCard, Cpu, Bot,
};

function TemplateIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name] ?? Bot;
  return <Icon size={size} />;
}

/**
 * Agent Library — template catalog in tabular form (desktop) / cards (mobile).
 * Selecting Configure & Launch opens the configuration flow.
 */
export function AgentLibraryPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [search, setSearch] = useState("");

  const subscribed = session?.user.subscribedAgents;

  const templates = useMemo(() => {
    const q = search.toLowerCase().trim();
    return AGENT_TYPES.filter((t) => {
      if (subscribed && subscribed.length > 0 && !subscribed.includes(t.id as AgentType)) {
        return false;
      }
      if (!q) return true;
      return (
        t.label.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    });
  }, [search, subscribed]);

  const openConfigure = (type: AgentType) => {
    navigate(`/dashboard/configure?template=${type}`);
  };

  const empty = (
    <EmptyState
      icon={Bot}
      title="No templates match your search"
      description="Try a different name or category, or clear the search to see purchased templates."
    />
  );

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="shrink-0 mb-4 sm:mb-5">
        <PageHeader
          title="Agent Library"
          subtitle="Catalog of agent templates by use case — select one to configure and launch"
        />
      </div>

      <div className="mb-4 w-full max-w-md shrink-0">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search templates by name or category…"
        />
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden flex-1 overflow-auto min-h-0 flex flex-col gap-3 pb-2">
        {templates.length === 0 ? (
          <div className="rounded-xl border border-[#E2DDD5] bg-white">{empty}</div>
        ) : (
          templates.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-[#E2DDD5] bg-white p-4 shadow-sm vo-card-hover"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${t.color}15`,
                    color: t.color,
                    border: `1px solid ${t.color}30`,
                  }}
                >
                  <TemplateIcon name={t.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[14px] text-[#1E1A14] leading-snug">{t.label}</div>
                  <span className="inline-block mt-1 text-[11px] font-bold text-[#4A453E] bg-[#F7F4EF] border border-[#E2DDD5] px-2 py-0.5 rounded-md">
                    {t.category}
                  </span>
                </div>
              </div>
              <p className="m-0 mb-4 text-[13px] text-[#7A746C] leading-relaxed">{t.description}</p>
              <button
                type="button"
                onClick={() => openConfigure(t.id as AgentType)}
                className="w-full vo-btn vo-btn-primary h-10"
              >
                <Rocket size={14} />
                Configure &amp; Launch
              </button>
            </div>
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block flex-1 overflow-auto rounded-xl border border-[#E2DDD5] bg-white shadow-sm min-h-0">
        <div className="overflow-x-auto">
          <table className="vo-table w-full min-w-[720px] border-collapse text-[13px]">
            <thead className="sticky top-0 bg-[#F7F4EF] z-10">
              <tr className="border-b border-[#E2DDD5]">
                <th className="text-left text-[11px] font-bold text-[#7A746C] uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                  Template
                </th>
                <th className="text-left text-[11px] font-bold text-[#7A746C] uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                  Category
                </th>
                <th className="text-left text-[11px] font-bold text-[#7A746C] uppercase tracking-wider px-4 py-3">
                  Description
                </th>
                <th className="text-right text-[11px] font-bold text-[#7A746C] uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={4}>{empty}</td>
                </tr>
              ) : (
                templates.map((t, i) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-[#FAFAF8] transition-colors ${
                      i < templates.length - 1 ? "border-b border-[#F0EDE8]" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${t.color}15`,
                            color: t.color,
                            border: `1px solid ${t.color}30`,
                          }}
                        >
                          <TemplateIcon name={t.icon} />
                        </div>
                        <div>
                          <div className="font-bold text-[#1E1A14]">{t.label}</div>
                          <div className="text-[11px] text-[#7A746C] font-mono mt-0.5">{t.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[11px] font-bold text-[#4A453E] bg-[#F7F4EF] border border-[#E2DDD5] px-2 py-1 rounded-md whitespace-nowrap">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#7A746C] max-w-md">
                      <span className="line-clamp-2">{t.description}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openConfigure(t.id as AgentType)}
                        className="vo-btn vo-btn-primary h-9 px-3.5 text-[12px] whitespace-nowrap"
                      >
                        <Rocket size={13} />
                        Configure &amp; Launch
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
