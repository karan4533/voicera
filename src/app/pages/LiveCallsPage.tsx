import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play, ArrowRightLeft,
  MapPin, Briefcase, Clock
} from "lucide-react";
import { getReminderContacts, updateReminderStatus } from "../lib/api";
import { PAYMENT_SCRIPT } from "../lib/mock-api";
import { formatDuration } from "../lib/csv";
import type { ReminderContact, LiveCallSession, TranscriptTurn } from "../lib/types";



// ── Main Page ─────────────────────────────────────────────────────────────────
export function LiveCallsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Queue state
  const [queue, setQueue] = useState<ReminderContact[]>([]);

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

  // Handle Start Call (moved up so it can be used in the auto-start effect)
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
      // We will call startTranscriptSim below, but it's okay to delay it or inline it
    }, 1500);
  }, []);

  // Auto-start from navigation parameters
  useEffect(() => {
    const startId = searchParams.get("start");
    if (startId && queue.length > 0 && !session) {
      const contact = queue.find(c => c.id === startId);
      if (contact && (contact.status === "pending" || contact.status === "no-answer" || contact.status === "calling" || contact.status === "rescheduled")) {
        handleStartCall(contact);
        searchParams.delete("start");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, queue, session, handleStartCall, setSearchParams]);

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

  // Start the transcript simulator once the session becomes active
  useEffect(() => {
    if (session?.status === "active" && session.transcript.length === 0) {
      startTranscriptSim(session);
    }
  }, [session?.status, session?.transcript.length, startTranscriptSim, session]);

  // Handle End Call
  const handleEndCall = useCallback(async () => {
    if (!session) return;
    if (transcriptTimerRef.current) clearInterval(transcriptTimerRef.current);
    if (dialTimerRef.current) clearTimeout(dialTimerRef.current);

    // Update final status
    await updateReminderStatus(session.contactId, "completed");
    setQueue(prev => prev.map(c => c.id === session.contactId ? { ...c, status: "completed" } : c));

    setSession(null);

    // Navigate to monitoring to review the call results
    navigate("/dashboard/monitoring");
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

  // Auto-scroll transcript
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.transcript.length]);

  return (
    <div className="flex flex-col -m-4 sm:-m-6 lg:-m-7 bg-[#F9F9F7]" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Active Call Panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* No active call */}
        {!session && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-full bg-[#F0EDE8] flex items-center justify-center mb-4">
              <Phone size={28} className="text-[#C8872A]" />
            </div>
            <h2 className="text-xl font-bold text-[#1E1A14] mb-2">No Active Call</h2>
            <p className="text-[13px] text-[#7A746C] max-w-sm mx-auto">
              You don't have any ongoing calls. Go to <strong>Call Scheduler</strong> to select a lead and initiate an outbound AI call.
            </p>
            <button 
              onClick={() => navigate("/dashboard/call-reminders")}
              className="mt-6 px-4 py-2 bg-[#1E1A14] text-white rounded-lg text-[13px] font-semibold hover:bg-[#322C23] transition-colors"
            >
              Go to Call Scheduler
            </button>
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
                    <div className="flex items-center justify-between gap-3 mb-0.5">
                      <h2 className="text-xl font-bold text-[#1E1A14]">{session.contact.name}</h2>
                      {/* Sentiment indicator — shown once call is active */}
                      {session.status === "active" && (
                        <div className="flex items-center gap-2 shrink-0">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                session.sentiment >= 0.7 ? "#22C55E"
                                : session.sentiment >= 0.4 ? "#F59E0B"
                                : "#EF4444",
                              boxShadow:
                                session.sentiment >= 0.7 ? "0 0 6px #22C55E88"
                                : session.sentiment >= 0.4 ? "0 0 6px #F59E0B88"
                                : "0 0 6px #EF444488",
                            }}
                          />
                          <span
                            className="text-[12px] font-semibold"
                            style={{
                              color:
                                session.sentiment >= 0.7 ? "#16A34A"
                                : session.sentiment >= 0.4 ? "#D97706"
                                : "#DC2626",
                            }}
                          >
                            {session.sentiment >= 0.7 ? "Positive" : session.sentiment >= 0.4 ? "Neutral" : "Negative"}
                          </span>
                        </div>
                      )}
                    </div>
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
