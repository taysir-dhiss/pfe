// Page CalmCare (ChatbotAI) — interface principale du chatbot médical IA
// Fonctionnalités : espaces de bien-être, sélection du type de session, chat avec Sophie (IA),
//                  analyse de symptômes, partage de conversation
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

// ─── Constantes ───────────────────────────────────────────────────────────────

// Phases de l'exercice de respiration guidée (4-2-4 = inspire-retiens-expire)
const BREATH_PHASES = [
  { label: "Inspirez",  seconds: 4, color: "text-blue-500"   },
  { label: "Retenez",   seconds: 2, color: "text-violet-500" },
  { label: "Expirez",   seconds: 4, color: "text-teal-500"   },
];

// removed SESSION_LABELS — replaced by sessionTitle() helper

const QUOTES = [
  "Vous êtes plus forte que vous ne le pensez. Un jour à la fois.",
  "Le courage ne consiste pas à ne pas avoir peur, mais à avancer malgré elle.",
  "Chaque jour est une nouvelle chance de prendre soin de vous.",
  "Votre force intérieure est plus grande que n'importe quel obstacle.",
];

const SYMPTOM_TYPES = [
  "Douleur", "Fatigue", "Nausées", "Insomnie", "Essoufflement",
  "Perte d'appétit", "Anxiété", "Vomissements", "Maux de tête", "Autre",
];

function severityColor(level) {
  if (level <= 3) return { from: "#4ade80", to: "#16a34a" };
  if (level <= 6) return { from: "#fbbf24", to: "#f59e0b" };
  if (level <= 8) return { from: "#fb923c", to: "#ef4444" };
  return { from: "#ef4444", to: "#b91c1c" };
}

function severityLabel(level) {
  if (level <= 3) return "léger";
  if (level <= 6) return "modéré";
  if (level <= 8) return "élevé";
  return "sévère";
}

// ─── SVG icons for spaces ─────────────────────────────────────────────────────

const IconHeart = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const IconPill = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15m-6.75-5.657l-3.714 3.714" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.8 15l1.616 1.616a2.25 2.25 0 010 3.182l-.818.818a2.25 2.25 0 01-3.182 0l-5.657-5.657" />
  </svg>
);
const IconCalendar = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);
const IconCommunity = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const SPACES = [
  { to: "/recommendations", Icon: IconHeart,       label: "Recommandations", iconColor: "text-pink-500",   iconBg: "bg-pink-100"   },
  { to: "/community",       Icon: IconCommunity,   label: "Communauté", iconColor: "text-teal-500",   iconBg: "bg-teal-100"   },
  { to: "/content",         Icon: IconPill,        label: "Contenu médical", iconColor: "text-violet-500", iconBg: "bg-violet-100" },
  { to: "/appointments",    Icon: IconCalendar,    label: "RDV",        iconColor: "text-blue-500",   iconBg: "bg-blue-100"   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMessage(contenu) {
  const idx = contenu.indexOf("⚕️");
  if (idx === -1) return { body: contenu, disclaimer: null };
  return { body: contenu.slice(0, idx).trimEnd(), disclaimer: contenu.slice(idx).trim() };
}

const SESSION_TYPE_LABELS = {
  analyseSymptome: "Analyse de symptômes",
  general_support: "Consultation CalmCare",
  poserQuest:      "Questions médicales",
};

function sessionTitle(s) {
  return SESSION_TYPE_LABELS[s.type] || "Conversation";
}

function formatSessionDate(dateStr) {
  const d    = new Date(dateStr);
  const diff = Math.floor((Date.now() - d) / 86400000);
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diff === 0) return `Aujourd'hui, ${time}`;
  if (diff === 1) return `Hier, ${time}`;
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}, ${time}`;
}

// ─── Minimal girl icon (no facial features) ──────────────────────────────────

function Orb({ size = "md", float = false }) {
  const sz = {
    xs: "w-9 h-9",
    sm: "w-10 h-10",
    md: "w-12 h-12",
    xl: "w-44 h-44",
  }[size];

  const isXl = size === "xl";

  return (
    <div
      className={`${sz} rounded-full flex-shrink-0 overflow-hidden ${float ? "animate-float" : ""}`}
      style={{
        background: "linear-gradient(145deg, #fff0f6 0%, #fda4c0 45%, #f472b6 75%, #db2777 100%)",
        boxShadow: isXl
          ? [
              "0 20px 60px rgba(236,72,153,0.40)",
              "0 6px 20px rgba(251,207,232,0.50)",
              "inset 0 1px 0 rgba(255,255,255,0.35)",
            ].join(", ")
          : "0 2px 10px rgba(236,72,153,0.35)",
      }}
    >
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={`hair-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#f472b6" />
            <stop offset="100%" stopColor="#be185d" />
          </linearGradient>
          <linearGradient id={`face-${size}`} x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%"   stopColor="#fff0f6" />
            <stop offset="100%" stopColor="#fce7f3" />
          </linearGradient>
          <linearGradient id={`body-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#fb7bb8" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>
        </defs>

        {/* ── Hair silhouette ── */}
        <ellipse cx="50" cy="34" rx="23" ry="20" fill={`url(#hair-${size})`} />
        <ellipse cx="27" cy="50" rx="7"  ry="16" fill={`url(#hair-${size})`} />
        <ellipse cx="73" cy="50" rx="7"  ry="16" fill={`url(#hair-${size})`} />

        {/* ── Blank face (no features) ── */}
        <ellipse cx="50" cy="51" rx="19" ry="21" fill={`url(#face-${size})`} />

        {/* ── Shoulders / body ── */}
        <path
          d="M18 100 Q22 76 50 70 Q78 76 82 100Z"
          fill={`url(#body-${size})`}
          opacity="0.88"
        />

        {/* ── Soft inner glow on background ── */}
        <circle cx="50" cy="50" r="50" fill="white" opacity="0.04" />
      </svg>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4">
      <Orb size="xs" />
      <div className="bg-white border border-pink-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-5">
          {[0, 150, 300].map(d => (
            <span key={d} className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
              style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Message bubbles ──────────────────────────────────────────────────────────

function BotBubble({ contenu, animate }) {
  const { body, disclaimer } = parseMessage(contenu);
  return (
    <div className={`flex items-end gap-3 mb-5 ${animate ? "animate-fade-in" : ""}`}>
      <Orb size="xs" />
      <div className="max-w-[78%] space-y-1.5">
        <div className="bg-white border border-pink-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{body}</p>
        </div>
        {disclaimer && (
          <p className="text-[11px] text-gray-700 italic px-1 leading-snug">{disclaimer}</p>
        )}
      </div>
    </div>
  );
}

function UserBubble({ contenu, animate }) {
  return (
    <div className={`flex justify-end mb-5 ${animate ? "animate-fade-in" : ""}`}>
      <div className="max-w-[78%] rounded-2xl rounded-br-none px-4 py-3 shadow-sm"
        style={{ background: "linear-gradient(135deg, #f9a8d4 0%, #f472b6 50%, #db2777 100%)" }}>
        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{contenu}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChatbotAI() {
  const location = useLocation();
  const navigate = useNavigate();
  const symptoms = location.state?.symptoms || [];

  const [sessionId, setSessionId]     = useState(null);
  const [sessions, setSessions]       = useState([]);
  const [messages, setMessages]       = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput]             = useState("");
  const [typing, setTyping]           = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [breathPhase, setBreathPhase] = useState(0);
  const [error, setError]             = useState("");
  const [deletingId, setDeletingId]   = useState(null);
  const [view, setView]               = useState("landing"); // "landing" | "declare" | "chat"
  const [sessionSymptoms, setSessionSymptoms] = useState([]); // symptoms declared for current session
  const [pendingSymptoms, setPending] = useState([]);
  const [newType, setNewType]         = useState(SYMPTOM_TYPES[0]);
  const [newLevel, setNewLevel]       = useState(5);

  const bottomRef      = useRef(null);
  const quote          = QUOTES[new Date().getDate() % QUOTES.length];
  const hasUserMessage = messages.some(m => m.role === "patient");

  // Breathing cycle
  useEffect(() => {
    const { seconds } = BREATH_PHASES[breathPhase];
    const t = setTimeout(() => setBreathPhase(p => (p + 1) % 3), seconds * 1000);
    return () => clearTimeout(t);
  }, [breathPhase]);

  // On mount: fetch session history only — no auto-session
  useEffect(() => {
    api.get("/chat/sessions?all=true")
      .then(res => setSessions(res.data || []))
      .catch(() => {})
      .finally(() => setInitLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const startNewSession = async (symptomsPayload = []) => {
    setMessages([]); setSuggestions([]); setError("");
    setInitLoading(true);
    try {
      const { data } = await api.post("/chat/initialize", { symptoms: symptomsPayload });
      setSessionId(data.session._id);
      setSuggestions(data.suggestions || []);
      setMessages([{ _id: "welcome", contenu: data.welcome, role: "assistant_ia", isNew: false }]);
      setSessionSymptoms(symptomsPayload);
      const sessRes = await api.get("/chat/sessions?all=true");
      setSessions(sessRes.data || []);
      setView("chat");
    } catch (err) {
      const detail = err.response?.data?.message || err.message || "";
      setError(`Impossible de créer une nouvelle session.${detail ? " — " + detail : ""}`);
    }
    finally { setInitLoading(false); }
  };

  const addPendingSymptom = () => {
    if (pendingSymptoms.some(s => s.type === newType)) return;
    setPending(prev => [...prev, { type: newType, intensite: newLevel }]);
  };

  const removePending = (type) => setPending(prev => prev.filter(s => s.type !== type));

  const submitSymptoms = async () => {
    if (!pendingSymptoms.length) return;
    setInitLoading(true);
    try {
      await Promise.all(pendingSymptoms.map(s =>
        api.post("/symptoms", { type: s.type, intensite: s.intensite })
      ));
      await startNewSession(pendingSymptoms);
      setPending([]);
    } catch { setError("Erreur lors de la déclaration des symptômes."); setInitLoading(false); }
  };

  const loadSession = async (sid) => {
    if (sid === sessionId) return;
    try {
      const { data } = await api.get(`/chat/sessions/${sid}/messages`);
      setSessionId(sid); setMessages(data.map(m => ({ ...m, isNew: false }))); setSuggestions([]); setSessionSymptoms([]); setView("chat");
    } catch (err) {
      if (err.response?.status === 404) {
        setSessions(prev => prev.filter(s => s._id !== sid));
      } else {
        setError("Impossible de charger la conversation.");
      }
    }
  };

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || !sessionId) return;
    setInput(""); setSuggestions([]); setError("");
    setMessages(prev => [...prev, { _id: `u-${Date.now()}`, contenu: content, role: "patient", isNew: true }]);
    setTyping(true);

    try {
      const { data } = await api.post(`/chat/sessions/${sessionId}/messages`, { contenu: content });
      setMessages(prev => [...prev, { ...data.response, metadata: data.metadata, isNew: true }]);
      if (data.requiresEscalation) setTimeout(() => navigate("/appointments"), 3500);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "Session terminée") {
        try {
          const { data: init } = await api.post("/chat/initialize", { symptoms });
          setSessionId(init.session._id);
          const { data } = await api.post(`/chat/sessions/${init.session._id}/messages`, { contenu: content });
          setMessages(prev => [...prev, { ...data.response, metadata: data.metadata, isNew: true }]);
          if (data.requiresEscalation) setTimeout(() => navigate("/appointments"), 3500);
        } catch { setError("Erreur lors de l'envoi. Veuillez réessayer."); }
      } else {
        setError("Erreur lors de l'envoi. Veuillez réessayer.");
      }
    } finally { setTyping(false); }
  };

  const handleDeleteSession = async (e, sid) => {
    e.stopPropagation();
    setDeletingId(sid);
    try {
      await api.delete(`/chat/sessions/${sid}`);
      setSessions(prev => prev.filter(s => s._id !== sid));
      if (sid === sessionId) {
        setSessionId(null); setMessages([]); setSuggestions([]);
      }
    } catch { setError("Impossible de supprimer la conversation."); }
    finally { setDeletingId(null); }
  };

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (initLoading) return <Spinner />;

  const phase = BREATH_PHASES[breathPhase];
  const sliderPct = ((newLevel - 1) / 9) * 100;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
    <style>{`
      .calm-slider { -webkit-appearance: none; appearance: none; outline: none; }
      .calm-slider::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 22px; height: 22px; border-radius: 50%;
        background: white; border: 3px solid #ec4899;
        box-shadow: 0 2px 8px rgba(236,72,153,0.35);
        cursor: pointer; transition: transform 0.1s;
      }
      .calm-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
      .calm-slider::-moz-range-thumb {
        width: 22px; height: 22px; border-radius: 50%;
        background: white; border: 3px solid #ec4899;
        box-shadow: 0 2px 8px rgba(236,72,153,0.35);
        cursor: pointer; border: none;
      }
    `}</style>
    <div className="flex overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>

      {/* ══════════════════ LEFT SIDEBAR ══════════════════════════════════ */}
      <aside className="w-[272px] flex-shrink-0 flex flex-col gap-5 p-5 overflow-y-auto border-r border-gray-100 bg-white/80 backdrop-blur-md">

        {/* Logo row */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-pink-100 flex items-center justify-center flex-shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#f472b6,#e11d48)" }}>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          {/* green online dot */}
          <div className="relative -ml-4 -mt-6">
            <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm" />
          </div>
          <div>
            <p className="font-display font-bold text-gray-900 text-base leading-tight">CalmCare</p>
            <p className="text-[11px] text-gray-700">Compagnon IA bienveillant</p>
          </div>
        </div>

        {/* New conversation button */}
        <button onClick={() => startNewSession()}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm text-white shadow-md transition hover:opacity-90 hover:shadow-lg active:scale-95"
          style={{ background: "linear-gradient(135deg,#f472b6 0%,#ec4899 50%,#db2777 100%)" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle conversation
        </button>

        {/* Spaces */}
        <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
          <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-3">Vos espaces</p>
          <div className="grid grid-cols-2 gap-2.5">
            {SPACES.map(({ to, Icon, label, iconColor, iconBg }) => (
              <Link key={to} to={to}
                className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center gap-2 hover:shadow-sm hover:border-pink-200 transition">
                <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center ${iconColor}`}>
                  <Icon />
                </div>
                <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight break-words w-full">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Conversations */}
        {sessions.length > 0 && (
          <div className="flex-1 min-h-0">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Conversations</p>
              <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="space-y-0.5">
              {sessions.slice(0, 10).map((s) => {
                const isActive   = s._id === sessionId;
                const isDeleting = deletingId === s._id;
                return (
                  <div key={s._id}
                    className={`group flex items-center gap-1 rounded-xl transition-all ${
                      isActive ? "bg-pink-100 border border-pink-200" : "hover:bg-gray-50"
                    }`}>

                    {/* Main clickable area */}
                    <button onClick={() => loadSession(s._id)}
                      className="flex-1 min-w-0 text-left px-3 py-2.5">
                      <p className={`text-sm truncate ${isActive ? "font-semibold text-brand-700" : "font-medium text-gray-700"}`}>
                        {sessionTitle(s)}
                      </p>
                      <p className="text-[11px] text-gray-700 mt-0.5">{formatSessionDate(s.dateDebut)}</p>
                    </button>

                    {/* Delete button — visible on group hover */}
                    <div className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={(e) => handleDeleteSession(e, s._id)}
                        disabled={isDeleting}
                        title="Supprimer la conversation"
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-gray-700 hover:text-red-500 transition disabled:opacity-40">
                        {isDeleting
                          ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                          : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        }
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* ══════════════════ CENTER PANEL ══════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white/40 backdrop-blur-sm">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-4 px-6 py-3.5 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <Orb size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-gray-900 text-base">CalmCare</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                En ligne
              </span>
            </div>
            <p className="text-[11px] text-gray-700">🔒 Conversations chiffrées · Confidentialité médicale</p>
          </div>
        </div>


        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Landing choice */}
          {view === "landing" && (
            <div className="flex flex-col items-center justify-center min-h-full py-6 animate-fade-in select-none">
              <Orb size="xl" float />

              <h2 className="mt-7 text-[22px] font-display font-bold text-center leading-tight"
                style={{
                  background: "linear-gradient(135deg,#ec4899 0%,#a855f7 60%,#7c3aed 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                Un espace doux, rien que pour vous
              </h2>
              <p className="text-sm text-gray-900 text-center max-w-sm leading-relaxed mt-2 mb-8">
                Posez toutes vos questions, partagez vos émotions. Je suis formée
                pour l'accompagnement oncologique et je ne vous jugerai jamais.
              </p>

              {/* Choice cards */}
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">

                {/* Option 1 — Declare symptom */}
                <button onClick={() => setView("declare")}
                  className="flex-1 flex flex-col items-center gap-3 p-6 bg-white border-2 border-pink-200 rounded-2xl shadow-sm hover:shadow-md hover:border-pink-400 hover:-translate-y-1 transition-all duration-200 text-center group">
                  <div className="w-14 h-14 rounded-2xl bg-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H6a2 2 0 00-2 2v5a7 7 0 007 7 7 7 0 007-7V5a2 2 0 00-2-2h-3M9 3v2m6-2v2M12 17v4m0 0h3m-3 0H9"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Déclarer un symptôme</p>
                    <p className="text-xs text-gray-700 leading-snug">Renseignez vos symptômes pour une analyse IA personnalisée</p>
                  </div>
                  <span className="text-xs font-semibold text-pink-500 flex items-center gap-1">
                    Commencer
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </span>
                </button>

                {/* Option 2 — Start conversation */}
                <button onClick={() => startNewSession()}
                  className="flex-1 flex flex-col items-center gap-3 p-6 bg-white border-2 border-violet-200 rounded-2xl shadow-sm hover:shadow-md hover:border-violet-400 hover:-translate-y-1 transition-all duration-200 text-center group">
                  <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Nouvelle conversation</p>
                    <p className="text-xs text-gray-700 leading-snug">Parlez directement avec Sophie, votre assistante médicale IA</p>
                  </div>
                  <span className="text-xs font-semibold text-violet-500 flex items-center gap-1">
                    Démarrer
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Declare view — inline symptom form */}
          {view === "declare" && (
            <div className="flex flex-col items-center justify-center min-h-full py-6 animate-fade-in">
              <div className="w-full max-w-md">

                <button onClick={() => setView("landing")}
                  className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-600 mb-6 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                  Retour
                </button>

                <h2 className="text-xl font-bold text-gray-800 mb-1">Déclarez vos symptômes</h2>
                <p className="text-sm text-gray-700 mb-5 leading-relaxed">
                  Sophie analysera vos symptômes et vous proposera un accompagnement personnalisé.
                </p>

                {/* Form */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-4">
                  <div className="flex gap-3 mb-5">
                    <select value={newType} onChange={e => setNewType(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 text-gray-700 bg-white">
                      {SYMPTOM_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <button onClick={addPendingSymptom}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#f472b6,#a855f7)" }}>
                      Ajouter
                    </button>
                  </div>

                  <div>
                    {/* Header row */}
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Intensité</span>
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full transition-colors"
                        style={{
                          background: severityColor(newLevel).from + "28",
                          color: severityColor(newLevel).to,
                        }}>
                        {newLevel}/10 — {severityLabel(newLevel)}
                      </span>
                    </div>

                    {/* Gradient-filled track */}
                    <input
                      type="range" min={1} max={10} value={newLevel}
                      onChange={e => setNewLevel(+e.target.value)}
                      className="calm-slider w-full h-2.5 rounded-full cursor-pointer"
                      style={{
                        background: `linear-gradient(to right,
                          #f472b6 0%,
                          #db2777 ${sliderPct}%,
                          #fce7f3 ${sliderPct}%,
                          #fce7f3 100%)`,
                      }}
                    />

                    {/* Numbered ticks */}
                    <div className="flex justify-between mt-2 px-0.5">
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <span key={n}
                          className={`text-[10px] transition-all ${n === newLevel ? "font-bold text-pink-500" : "text-gray-600"}`}>
                          {n}
                        </span>
                      ))}
                    </div>

                    {/* Labels */}
                    <div className="flex justify-between mt-0.5 px-0.5">
                      <span className="text-[10px] text-gray-700">Faible</span>
                      <span className="text-[10px] text-gray-700">Modérée</span>
                      <span className="text-[10px] text-gray-700">Sévère</span>
                    </div>
                  </div>
                </div>

                {/* Pending list */}
                {pendingSymptoms.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {pendingSymptoms.map(s => {
                      const { from, to } = severityColor(s.intensite);
                      return (
                        <div key={s.type}
                          className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between mb-1.5">
                              <span className="text-sm font-medium text-gray-800">{s.type}</span>
                              <span className="text-xs font-bold text-gray-700">{s.intensite}/10</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full"
                                style={{ width: `${s.intensite * 10}%`, background: `linear-gradient(90deg, ${from}, ${to})` }} />
                            </div>
                          </div>
                          <button onClick={() => removePending(s.type)}
                            className="w-6 h-6 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-700 hover:text-red-500 transition flex-shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button onClick={submitSymptoms}
                  disabled={!pendingSymptoms.length || initLoading}
                  className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white shadow-md transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#f472b6 0%,#ec4899 50%,#a855f7 100%)" }}>
                  {initLoading
                    ? "Analyse en cours…"
                    : `Démarrer l'analyse IA${pendingSymptoms.length ? ` (${pendingSymptoms.length} symptôme${pendingSymptoms.length > 1 ? "s" : ""})` : ""}`}
                </button>

                {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
              </div>
            </div>
          )}

          {/* Messages — only when a session is active */}
          {view === "chat" && sessionId && messages.map(m =>
            m.role === "patient"
              ? <UserBubble key={m._id} contenu={m.contenu} animate={m.isNew} />
              : <BotBubble  key={m._id} contenu={m.contenu} animate={m.isNew} />
          )}

          {view === "chat" && sessionId && typing && <TypingIndicator />}

          {/* Suggestion chips */}
          {view === "chat" && suggestions.length > 0 && !typing && (
            <div className="mt-3 mb-4 animate-fade-in">
              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2.5">
                Suggestions pour commencer
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => {
                  const icons = ["💗", "🌙", "💬", "🌿", "🤒"];
                  const colors = [
                    "border-pink-200 text-pink-700 bg-pink-50 hover:bg-pink-100",
                    "border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100",
                    "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100",
                  ];
                  return (
                    <button key={i} onClick={() => sendMessage(s)}
                      className={`flex items-center gap-1.5 text-xs border rounded-full px-3.5 py-2 font-medium shadow-sm transition ${colors[i % colors.length]}`}>
                      <span>{icons[i % icons.length]}</span>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4 animate-fade-in">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar — hidden on landing */}
        {sessionId && <div className="flex-shrink-0 px-6 py-4 bg-white/80 backdrop-blur-md border-t border-gray-100">
          <div className="flex items-end gap-3 bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-2.5">
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Parlez-moi de ce que vous ressentez…"
              className="flex-1 resize-none bg-transparent text-sm focus:outline-none leading-relaxed max-h-32 py-1 text-gray-700 placeholder-gray-300"
              style={{ minHeight: "34px" }}
              disabled={!sessionId || typing}
            />
            <button onClick={() => sendMessage()}
              disabled={!input.trim() || !sessionId || typing}
              className="flex-shrink-0 w-9 h-9 rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition hover:opacity-90 shadow-sm"
              style={{ background: "linear-gradient(135deg,#e879f9,#7c3aed)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>}
      </main>

      {/* ══════════════════ RIGHT SIDEBAR ═════════════════════════════════ */}
      <aside className="w-[220px] flex-shrink-0 flex flex-col gap-4 p-4 overflow-y-auto border-l border-gray-100 bg-white/80 backdrop-blur-md">

        {/* Breathing widget */}
        <div className="rounded-2xl p-4 border border-blue-100 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
          <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.12em] mb-3">Pause respiration</p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white border border-indigo-100 shadow-sm flex items-center justify-center text-xl flex-shrink-0">
              🌬️
            </div>
            <div>
              <p className={`text-xl font-bold leading-none ${phase.color}`}>{phase.label}</p>
              <p className="text-[10px] text-gray-700 mt-1 leading-tight">Cohérence cardiaque · 4-2-4</p>
            </div>
          </div>
          <div className="mt-3 h-1 bg-indigo-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-violet-500 rounded-full transition-all duration-1000"
              style={{ width: `${((breathPhase + 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Recent symptoms */}
        <div className="rounded-2xl p-4 border border-gray-100 bg-white shadow-sm">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-sm font-bold text-gray-800">Mes symptômes</p>
            <p className="text-[11px] text-gray-700">
              {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </p>
          </div>
          {sessionSymptoms.length === 0 ? (
            <p className="text-xs text-gray-700 text-center py-3 leading-snug">
              Déclarez des symptômes pour les voir apparaître ici
            </p>
          ) : (
            <div className="space-y-3.5">
              {sessionSymptoms.map((s, i) => {
                const { from, to } = severityColor(s.intensite);
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600 truncate max-w-[110px]">{s.type}</span>
                      <span className="text-xs font-semibold" style={{ color: to }}>
                        {severityLabel(s.intensite)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${s.intensite * 10}%`,
                          background: `linear-gradient(90deg, ${from}, ${to})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Daily quote */}
        <div className="rounded-2xl p-4 border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 shadow-sm">
          <div className="text-pink-400 text-base mb-2">✦</div>
          <p className="text-sm font-semibold text-gray-800 leading-snug mb-2">
            "{quote}"
          </p>
          <p className="text-[11px] text-gray-700">Pensée du jour · CalmCare</p>
        </div>


      </aside>
    </div>
    </>
  );
}
