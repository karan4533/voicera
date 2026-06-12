import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play, ArrowRightLeft,
  MapPin, Briefcase, Clock, Users
} from "lucide-react";
import { getReminderContacts, updateReminderStatus } from "../lib/api";
import { PAYMENT_SCRIPT } from "../lib/mock-api";
import { formatDuration } from "../lib/csv";
import type { ReminderContact, LiveCallSession, TranscriptTurn } from "../lib/types";
import { useAgent } from "../context/AgentContext";

// ── Priority helpers ──────────────────────────────────────────────────────────
const PRIORITY_STYLES: Record<string, string> = {
  High:   "bg-red-100 text-red-700 border-red-200",
  Normal: "bg-blue-100 text-blue-700 border-blue-200",
  Low:    "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-amber-50 text-amber-700",
  calling:    "bg-green-50 text-green-700",
  completed:  "bg-gray-100 text-gray-500",
  "no-answer":"bg-orange-50 text-orange-600",
  skipped:    "bg-gray-100 text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending:    "Pending",
  calling:    "In Call",
  completed:  "Done",
  "no-answer":"No Answer",
  skipped:    "Skipped",
};

// ── Waveform bars (AI speaking indicator) ────────────────────────────────────
function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-6">
      {[3, 5, 4, 6, 3, 5, 4, 6, 3].map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-[#C8872A] transition-all duration-150"
          style={{
            height: active ? `${h * 3 + Math.random() * 4}px` : "4px",
            opacity: active ? 1 : 0.3,
            animationDelay: `${i * 80}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ── Queue contact card ────────────────────────────────────────────────────────
function QueueCard({
  contact, isSelected, isActive, onSelect, onStart,
}: {
  contact: ReminderContact;
  isSelected: boolean;
  isActive: boolean;
  onSelect: () => void;
  onStart: () => void;
}) {
  const canCall = contact.status === "pending" || contact.status === "no-answer";
  return (
    <div
      onClick={onSelect}
      className={`px-4 py-3 cursor-pointer border-b border-[#F0EDE8] transition-colors ${
        isSelected ? "bg-[#FDF3E3]" : "hover:bg-[#F9F9F7]"
      } ${isActive ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[13px] text-[#1E1A14] truncate">{contact.name}</span>
            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[contact.priority]}`}>
              {contact.priority}
            </span>
          </div>
          <div className="text-[11px] text-[#7A746C] font-mono mb-1.5">{contact.phone}</div>
          <div className="flex flex-wrap gap-1">
            {contact.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] bg-[#F0EDE8] text-[#7A746C] px-1.5 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[contact.status]}`}>
            {STATUS_LABELS[contact.status]}
          </span>
          <span className="text-[10px] text-[#9E9890]">{contact.attemptNumber}/{contact.totalAttempts} attempts</span>
          {isSelected && canCall && !isActive && (
            <button
              id={`start-call-${contact.id}`}
              onClick={(e) => { e.stopPropagation(); onStart(); }}
              className="flex items-center gap-1 bg-[#22C55E] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg hover:bg-[#16A34A] transition-colors cursor-pointer border-none"
            >
              <Phone size={11} />
              Start Call
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function LiveCallsPage() {
  const navigate = useNavigate();
  const { agent } = useAgent();

  // Queue state
  const [queue, setQueue] = useState<ReminderContact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Live call state
  const [session, setSession] = useState<LiveCallSession | null>(null);

  // Timer tick
  const [, setTick] = useState(0);

  // Transcript script index
  const scriptIdxRef = useRef(0);
  const transcriptTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load queue
  const loadQueue = useCallback(() => {
    getReminderContacts().then(setQueue);
  }, []);

  useEffect(() => {
    loadQueue();
    // Tick for live timer
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, [loadQueue]);

  // Start the live transcript simulation
  const startTranscriptSim = useCallback((sess: LiveCallSession) => {
    scriptIdxRef.current = 0;
    if (transcriptTimerRef.current) clearInterval(transcriptTimerRef.current);

    transcriptTimerRef.current = setInterval(() => {
      const idx = scriptIdxRef.current;
      if (idx >= PAYMENT_SCRIPT.length) {
        clearInterval(transcriptTimerRef.current!);
        return;
      }

      const line = PAYMENT_SCRIPT[idx];
      const firstName = sess.contact.name.split(" ")[0];
      const text = line.text
        .replace("{name}", sess.contact.name)
        .replace("{firstName}", firstName)
        .replace("{amount}", "12,500")
        .replace("{partial}", "6,000");

      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const newTurn: TranscriptTurn = {
        id: `t-${idx}`,
        speaker: line.speaker,
        text,
        timestamp: ts,
      };

      scriptIdxRef.current = idx + 1;

      setSession(prev => {
        if (!prev) return prev;
        // Drift sentiment + engagement slightly
        const dSentiment = (Math.random() - 0.4) * 0.04;
        const dEngagement = (Math.random() - 0.3) * 0.03;
        const newNlu = 0.88 + Math.random() * 0.11;
        return {
          ...prev,
          aiSpeaking: line.speaker === "AI",
          sentiment: Math.min(1, Math.max(0.2, prev.sentiment + dSentiment)),
          engagement: Math.min(1, Math.max(0.3, prev.engagement + dEngagement)),
          nluConfidence: newNlu,
          transcript: [...prev.transcript, newTurn],
        };
      });
    }, 3500);
  }, []);

  // Handle Start Call
  const handleStartCall = useCallback(async (contact: ReminderContact) => {
    // Mark calling in queue
    await updateReminderStatus(contact.id, "calling");
    setQueue(prev => prev.map(c => c.id === contact.id ? { ...c, status: "calling" } : c));

    const newSession: LiveCallSession = {
      contactId: contact.id,
      contact,
      startedAt: Date.now(),
      status: "dialing",
      sentiment: 0.5,
      engagement: 0.6,
      nluConfidence: 0.94,
      aiSpeaking: false,
      isMuted: false,
      isOnHold: false,
      autoSummarize: true,
      transcript: [],
    };

    setSession(newSession);

    // Dialing → Active after 1.5s
    dialTimerRef.current = setTimeout(() => {
      setSession(prev => prev ? { ...prev, status: "active" } : prev);
      startTranscriptSim(newSession);
    }, 1500);
  }, [startTranscriptSim]);

  // Handle End Call
  const handleEndCall = useCallback(async () => {
    if (!session) return;
    if (transcriptTimerRef.current) clearInterval(transcriptTimerRef.current);
    if (dialTimerRef.current) clearTimeout(dialTimerRef.current);

    // Update final status
    await updateReminderStatus(session.contactId, "completed");
    setQueue(prev => prev.map(c => c.id === session.contactId ? { ...c, status: "completed" } : c));

    setSession(null);
    setSelectedId(null);

    // Navigate to analytics to review the call
    navigate("/dashboard/analytics");
  }, [session, navigate]);

  // Toggle mute
  const handleMute = () => setSession(p => p ? { ...p, isMuted: !p.isMuted } : p);

  // Toggle hold
  const handleHold = () =>
    setSession(p => p ? { ...p, isOnHold: !p.isOnHold, status: p.isOnHold ? "active" : "hold" } : p);

  // Cleanup on unmount
  useEffect(() => () => {
    if (transcriptTimerRef.current) clearInterval(transcriptTimerRef.current);
    if (dialTimerRef.current) clearTimeout(dialTimerRef.current);
  }, []);

  // Derived stats
  const pendingCount = queue.filter(c => c.status === "pending" || c.status === "no-answer").length;
  const filteredQueue = queue.filter(c => c.domain === agent);
  
  const completedCount = queue.filter(c => c.status === "completed").length;
  const conversionRate = queue.length > 0 ? Math.round((completedCount / queue.length) * 100) : 0;

  // Auto-scroll transcript
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.transcript.length]);

  return (
    <div className="flex -m-4 sm:-m-6 lg:-m-7" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Left: Queue Panel ─────────────────────────────────────────────── */}
      <div className="w-[300px] shrink-0 flex flex-col border-r border-[#E2DDD5] bg-white overflow-hidden">

        {/* Stats bar */}
        <div className="px-4 py-3 border-b border-[#E2DDD5] bg-[#FDFDFD]">
          <div className="text-[11px] font-bold text-[#7A746C] uppercase tracking-wider mb-2">Queue Overview</div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-[#1E1A14]">{filteredQueue.length}</div>
              <div className="text-[10px] text-[#9E9890]">Total</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[#C8872A]">{pendingCount}</div>
              <div className="text-[10px] text-[#9E9890]">In Queue</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[#22C55E]">{conversionRate}%</div>
              <div className="text-[10px] text-[#9E9890]">Done</div>
            </div>
          </div>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto">
          {filteredQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Users size={28} className="text-[#D4CBBF] mb-2" />
              <p className="text-[12px] text-[#9E9890]">No contacts in queue</p>
            </div>
          ) : (
            filteredQueue.map(contact => (
              <QueueCard
                key={contact.id}
                contact={contact}
                isSelected={selectedId === contact.id}
                isActive={!!session && session.contactId !== contact.id}
                onSelect={() => setSelectedId(contact.id)}
                onStart={() => handleStartCall(contact)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right: Active Call Panel ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9F9F7] overflow-hidden">

        {/* No active call */}
        {!session && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-full bg-[#F0EDE8] flex items-center justify-center mb-4">
              <Phone size={28} className="text-[#C8872A]" />
            </div>
            <h2 className="text-xl font-bold text-[#1E1A14] mb-2">Ready to Call</h2>
            <p className="text-[13px] text-[#7A746C] max-w-xs">
              Select a contact from the queue on the left and click <strong>Start Call</strong> to initiate an outbound AI call.
            </p>
          </div>
        )}

        {/* Active call view */}
        {session && (
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Call header bar */}
            <div className="flex items-center gap-3 px-5 py-2.5 bg-white border-b border-[#E2DDD5] shrink-0">
              <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                session.status === "dialing"
                  ? "bg-amber-100 text-amber-700"
                  : session.status === "hold"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  session.status === "dialing" ? "bg-amber-500 animate-pulse"
                  : session.status === "hold" ? "bg-blue-500"
                  : "bg-green-500 animate-pulse"
                }`} />
                {session.status === "dialing" ? "DIALING..." : session.status === "hold" ? "ON HOLD" : "ACTIVE CALL"}
              </span>
              <span className="text-[11px] text-[#9E9890] font-medium">Outbound</span>
              <span className="text-[11px] text-[#9E9890]">·</span>
              <span className="text-[11px] text-[#9E9890] font-medium">
                Attempt {session.contact.attemptNumber} of {session.contact.totalAttempts}
              </span>
              <div className="ml-auto flex items-center gap-1.5 font-mono text-lg font-bold text-[#1E1A14]">
                <Clock size={14} className="text-[#9E9890]" />
                {formatDuration(Math.floor((Date.now() - session.startedAt) / 1000))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

              {/* Contact card */}
              <div className="bg-white rounded-xl border border-[#E2DDD5] p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-[#B8946A] flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-white">
                      {session.contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-[#1E1A14] mb-0.5">{session.contact.name}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#7A746C] mb-3">
                      <span className="flex items-center gap-1">
                        <Phone size={11} /> {session.contact.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {session.contact.location}
                      </span>
                      {Object.entries(session.contact.attributes).slice(0, 3).map(([key, val]) => (
                        <span key={key} className="flex items-center gap-1">
                          <Briefcase size={11} /> {String(val)}
                        </span>
                      ))}
                    </div>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {session.contact.tags.map(tag => (
                        <span key={tag} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F0EDE8] text-[#7A746C] border border-[#E2DDD5]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sentiment + Engagement + NLU row */}
              {session.status !== "dialing" && (
                <div className="grid grid-cols-3 gap-4">
                  {/* Sentiment */}
                  <div className="col-span-1 bg-white rounded-xl border border-[#E2DDD5] p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[12px] font-semibold text-[#7A746C]">Sentiment</span>
                      <span className={`text-[12px] font-bold ${
                        session.sentiment >= 0.7 ? "text-green-600"
                        : session.sentiment >= 0.4 ? "text-amber-600"
                        : "text-red-600"
                      }`}>
                        {Math.round(session.sentiment * 100)}% {session.sentiment >= 0.7 ? "Positive" : session.sentiment >= 0.4 ? "Neutral" : "Negative"}
                      </span>
                    </div>
                    <div className="h-2 bg-[#F0EDE8] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${session.sentiment * 100}%`,
                          backgroundColor: session.sentiment >= 0.7 ? "#22C55E" : session.sentiment >= 0.4 ? "#F59E0B" : "#EF4444",
                        }}
                      />
                    </div>
                  </div>

                  {/* Engagement */}
                  <div className="col-span-1 bg-white rounded-xl border border-[#E2DDD5] p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[12px] font-semibold text-[#7A746C]">Engagement</span>
                      <span className="text-[12px] font-bold text-[#4F46E5]">
                        {Math.round(session.engagement * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-[#F0EDE8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4F46E5] rounded-full transition-all duration-700"
                        style={{ width: `${session.engagement * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* NLU Confidence + AI Speaking */}
                  <div className="col-span-1 bg-white rounded-xl border border-[#E2DDD5] p-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#9E9890] uppercase tracking-wider mb-1">
                        {session.aiSpeaking ? "AI SPEAKING" : "LISTENING"}
                      </div>
                      <WaveformBars active={session.aiSpeaking && session.status === "active"} />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#1E1A14]">
                        {Math.round(session.nluConfidence * 100)}%
                      </div>
                      <div className="text-[10px] text-[#9E9890]">NLU Confidence</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dialing state */}
              {session.status === "dialing" && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#FDF3E3] flex items-center justify-center mb-3 animate-pulse">
                    <Phone size={24} className="text-[#C8872A]" />
                  </div>
                  <p className="text-sm font-semibold text-[#1E1A14]">Dialing {session.contact.name}...</p>
                  <p className="text-[12px] text-[#9E9890]">{session.contact.phone}</p>
                </div>
              )}

              {/* Live Transcript */}
              {session.status === "active" && session.transcript.length > 0 && (
                <div className="bg-white rounded-xl border border-[#E2DDD5] overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2DDD5] bg-[#FDFDFD]">
                    <span className="font-semibold text-[13px] text-[#1E1A14]">Live Transcript</span>
                    <div className="flex items-center gap-2 text-[11px] text-[#9E9890]">
                      <span>GPT-4o</span>
                      <span>·</span>
                      <span>Real-time STT</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 max-h-[280px] overflow-y-auto">
                    {session.transcript.map(turn => (
                      <div key={turn.id} className={`flex gap-2.5 ${turn.speaker === "Customer" ? "flex-row-reverse" : ""}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          turn.speaker === "AI"
                            ? "bg-[#B8946A] text-white"
                            : "bg-[#4F46E5] text-white"
                        }`}>
                          {turn.speaker === "AI" ? "AI" : session.contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className={`max-w-[75%] ${turn.speaker === "Customer" ? "items-end" : "items-start"} flex flex-col`}>
                          <div className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                            turn.speaker === "AI"
                              ? "bg-[#F9F9F7] text-[#1E1A14] rounded-tl-none border border-[#E2DDD5]"
                              : "bg-[#4F46E5] text-white rounded-tr-none"
                          }`}>
                            {turn.text}
                          </div>
                          <span className="text-[10px] text-[#9E9890] mt-1 px-1">{turn.timestamp}</span>
                        </div>
                      </div>
                    ))}
                    <div ref={transcriptEndRef} />
                  </div>
                </div>
              )}
            </div>

            {/* ── Call Controls ────────────────────────────────────────── */}
            <div className="shrink-0 bg-white border-t border-[#E2DDD5] px-5 py-3 flex items-center gap-3">
              {/* Mute */}
              <button
                onClick={handleMute}
                title={session.isMuted ? "Unmute" : "Mute"}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold border cursor-pointer transition-colors ${
                  session.isMuted
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "bg-[#F9F9F7] border-[#E2DDD5] text-[#1E1A14] hover:bg-[#F0EDE8]"
                }`}
              >
                {session.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                {session.isMuted ? "Unmute" : "Mute"}
              </button>

              {/* Hold */}
              <button
                onClick={handleHold}
                title={session.isOnHold ? "Resume" : "Hold"}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold border cursor-pointer transition-colors ${
                  session.isOnHold
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : "bg-[#F9F9F7] border-[#E2DDD5] text-[#1E1A14] hover:bg-[#F0EDE8]"
                }`}
              >
                {session.isOnHold ? <Play size={14} /> : <Pause size={14} />}
                {session.isOnHold ? "Resume" : "Hold"}
              </button>

              {/* Transfer */}
              <button
                title="Transfer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold border border-[#E2DDD5] bg-[#F9F9F7] text-[#1E1A14] hover:bg-[#F0EDE8] cursor-pointer transition-colors"
              >
                <ArrowRightLeft size={14} />
                Transfer
              </button>

              {/* Auto-Summarize toggle */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[12px] text-[#7A746C]">Auto-Summarize</span>
                <button
                  onClick={() => setSession(p => p ? { ...p, autoSummarize: !p.autoSummarize } : p)}
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer border-none ${
                    session.autoSummarize ? "bg-[#C8872A]" : "bg-[#D4CBBF]"
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                    session.autoSummarize ? "left-[18px]" : "left-0.5"
                  }`} />
                </button>
              </div>

              {/* End Call */}
              <button
                id="end-call-btn"
                onClick={handleEndCall}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#DC2626] text-white text-[12px] font-bold border-none cursor-pointer hover:bg-[#B91C1C] transition-colors ml-2"
              >
                <PhoneOff size={14} />
                End Call
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
