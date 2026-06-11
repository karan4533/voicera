import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Phone, Search } from "lucide-react";
import { getQueueContacts, updateQueueStatus } from "../lib/api";
import { PageHeader } from "../components/shared/PageHeader";
import type { QueueContact } from "../lib/types";

const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-100 text-red-700 border-red-200",
  Normal: "bg-blue-100 text-blue-700 border-blue-200",
  Low: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  calling: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-gray-100 text-gray-500 border-gray-200",
  "no-answer": "bg-orange-50 text-orange-600 border-orange-200",
  skipped: "bg-gray-50 text-gray-400 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  calling: "In Call",
  completed: "Completed",
  "no-answer": "No Answer",
  skipped: "Skipped",
};

export function CallQueuePage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<QueueContact[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    getQueueContacts().then(setContacts);
  }, []);

  const handleCallNow = async (contact: QueueContact) => {
    // Navigate to live calls page — the user will click Start Call there
    navigate("/dashboard/live-calls");
  };

  const handleSkip = async (id: string) => {
    await updateQueueStatus(id, "skipped");
    setContacts(prev => prev.map(c => c.id === id ? { ...c, queueStatus: "skipped" } : c));
  };

  const filtered = contacts.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchStatus = statusFilter === "all" || c.queueStatus === statusFilter;
    const matchPriority = priorityFilter === "all" || c.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const pending = contacts.filter(c => c.queueStatus === "pending" || c.queueStatus === "no-answer").length;
  const done = contacts.filter(c => c.queueStatus === "completed").length;

  return (
    <>
      <PageHeader title="Call Queue" subtitle="Manage and monitor your outbound call queue" />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "In Queue", value: pending, color: "#C8872A" },
          { label: "Completed", value: done, color: "#22C55E" },
          { label: "Total", value: contacts.length, color: "#1E1A14" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E2DDD5] px-5 py-4 shadow-sm">
            <div className="text-[11px] text-[#9E9890] uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#E2DDD5] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C8872A]/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-[13px] border border-[#E2DDD5] rounded-lg bg-white cursor-pointer focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="no-answer">No Answer</option>
          <option value="completed">Completed</option>
          <option value="skipped">Skipped</option>
        </select>
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="px-3 py-2 text-[13px] border border-[#E2DDD5] rounded-lg bg-white cursor-pointer focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="High">High</option>
          <option value="Normal">Normal</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E2DDD5] bg-white overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead className="bg-[#FDFDFD]">
            <tr className="border-b border-[#E2DDD5]">
              {["Contact", "Phone", "Location", "Priority", "Tags", "Attempts", "Status", "Actions"].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold text-[#7A746C] uppercase tracking-wider px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-[13px] text-[#9E9890]">
                  No contacts match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((c, i) => (
                <tr key={c.id} className={`hover:bg-[#F9F9F7] transition-colors ${i < filtered.length - 1 ? "border-b border-[#F0EDE8]" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[13px] text-[#1E1A14]">{c.name}</div>
                    <div className="text-[11px] text-[#9E9890]">{c.jobTitle} · {c.company}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-[#4A453E]">{c.phone}</td>
                  <td className="px-4 py-3 text-[12px] text-[#7A746C]">{c.location}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${PRIORITY_STYLES[c.priority]}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map(t => (
                        <span key={t} className="text-[10px] bg-[#F0EDE8] text-[#7A746C] px-1.5 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-center text-[#7A746C]">
                    {c.attemptNumber}/{c.totalAttempts}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[c.queueStatus]}`}>
                      {STATUS_LABELS[c.queueStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {(c.queueStatus === "pending" || c.queueStatus === "no-answer") && (
                        <>
                          <button
                            onClick={() => handleCallNow(c)}
                            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#22C55E] text-white border-none cursor-pointer hover:bg-[#16A34A] transition-colors"
                          >
                            <Phone size={11} /> Call Now
                          </button>
                          <button
                            onClick={() => handleSkip(c.id)}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white text-[#7A746C] cursor-pointer hover:bg-[#F9F9F7] transition-colors"
                          >
                            Skip
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
