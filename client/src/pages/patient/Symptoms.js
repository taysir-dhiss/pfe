// Symptoms — popup modal declaration + AI analysis + inline chat
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

const TYPES = [
  "Douleur", "Fatigue", "Nausée", "Vomissement",
  "Essoufflement", "Insomnie", "Perte d'appétit", "Autre",
];

const intensiteLevel = (n) =>
  n >= 8 ? { label: "Sévère",   bar: "bg-red-400",    pill: "bg-red-50 text-red-600 border-red-200",     track: "#fca5a5" }
: n >= 5 ? { label: "Modérée",  bar: "bg-amber-400",   pill: "bg-amber-50 text-amber-600 border-amber-200", track: "#fcd34d" }
         : { label: "Faible",   bar: "bg-emerald-400", pill: "bg-emerald-50 text-emerald-600 border-emerald-200", track: "#6ee7b7" };

// ─── Symptom Popup Modal ───────────────────────────────────────────────────────
function SymptomModal({ open, onClose, onAdded }) {
  const [form, setForm]           = useState({ type: TYPES[0], intensite: 5 });
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError]         = useState("");
  const [adding, setAdding]       = useState(false);
  const [closing, setClosing]     = useState(false);

  useEffect(() => {
    if (open) { setForm({ type: TYPES[0], intensite: 5 }); setJustAdded(false); setError(""); setClosing(false); }
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") handleClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 180);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setAdding(true);
    try {
      await api.post("/symptoms", form);
      onAdded();
      setJustAdded(true);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout.");
    } finally {
      setAdding(false);
    }
  };

  if (!open && !closing) return null;

  const lvl = intensiteLevel(form.intensite);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${closing ? "" : "animate-overlay-in"}`}
      style={{ background: "rgba(255,240,247,0.72)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className={`w-full max-w-md ${closing ? "animate-modal-out" : "animate-modal-in"}`}>
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-100">

          {/* Modal header */}
          <div className="relative px-7 pt-7 pb-5 border-b border-pink-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#fce7f3,#fda4af)" }}>
                <svg className="w-5 h-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 leading-none">Déclarer un Symptôme</h2>
                <p className="text-xs text-gray-400 mt-0.5">Renseignez le type et l'intensité</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-7 py-6">
            {!justAdded ? (
              <form onSubmit={handleAdd} className="space-y-6">
                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
                )}

                {/* Type dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Type de symptôme
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl px-4 py-3.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 appearance-none transition"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {/* Quick-select chips */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {TYPES.map((t) => (
                      <button
                        key={t} type="button"
                        onClick={() => setForm({ ...form, type: t })}
                        className={`text-xs px-3.5 py-1.5 rounded-full font-medium border transition ${
                          form.type === t
                            ? "bg-pink-500 text-white border-pink-500 shadow-sm"
                            : "bg-white text-gray-500 border-gray-200 hover:border-pink-300 hover:text-pink-500"
                        }`}
                      >{t}</button>
                    ))}
                  </div>
                </div>

                {/* Intensity slider */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Intensité</label>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${lvl.pill}`}>
                      {form.intensite}/10 — {lvl.label}
                    </span>
                  </div>
                  <input
                    type="range" min={1} max={10}
                    value={form.intensite}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #f472b6 0%, #f472b6 ${(form.intensite - 1) / 9 * 100}%, #fce7f3 ${(form.intensite - 1) / 9 * 100}%, #fce7f3 100%)`
                    }}
                    onChange={(e) => setForm({ ...form, intensite: +e.target.value })}
                  />
                  <div className="flex justify-between mt-1.5 px-0.5">
                    {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                      <span key={n} className={`text-[10px] font-medium transition ${
                        n === form.intensite ? "text-pink-500 font-bold" : "text-gray-300"
                      }`}>{n}</span>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-400">Faible</span>
                    <span className="text-[10px] text-gray-400">Modérée</span>
                    <span className="text-[10px] text-gray-400">Sévère</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={adding}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#f472b6,#ec4899,#db2777)" }}
                >
                  {adding ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  {adding ? "Enregistrement…" : "Ajouter le symptôme"}
                </button>
              </form>
            ) : (
              <div className="text-center py-4 animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-1">Symptôme enregistré</h3>
                <p className="text-sm text-gray-500 mb-6">Souhaitez-vous ajouter un autre symptôme ?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setForm({ type: TYPES[0], intensite: 5 }); setJustAdded(false); }}
                    className="flex-1 py-2.5 rounded-xl bg-pink-50 text-pink-600 border border-pink-200 font-semibold text-sm hover:bg-pink-100 transition"
                  >Oui, ajouter</button>
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl bg-gray-50 text-gray-600 border border-gray-200 font-semibold text-sm hover:bg-gray-100 transition"
                  >Non, continuer</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analysis helpers ──────────────────────────────────────────────────────────
function parseAnalysis(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const sections = [];
  let current = null;
  for (const line of lines) {
    if (line.startsWith("⚕️")) { sections.push({ type: "disclaimer", text: line }); continue; }
    if (line.startsWith("Analyse préliminaire")) { sections.push({ type: "title", text: line }); continue; }
    if (line.startsWith("Niveau") || line.startsWith("Intensité")) { sections.push({ type: "meta", text: line }); continue; }
    if (!line.startsWith("•") && !line.startsWith("-") && line.endsWith(":")) {
      current = { type: "section", heading: line.replace(/:$/, ""), items: [] };
      sections.push(current); continue;
    }
    if ((line.startsWith("•") || line.startsWith("-")) && current) {
      current.items.push(line.replace(/^[•\-]\s*/, "")); continue;
    }
    current = null;
    sections.push({ type: "paragraph", text: line });
  }
  return sections;
}

function splitDisclaimer(text) {
  const idx = text.indexOf("⚕️");
  if (idx === -1) return { body: text.trim(), disclaimer: null };
  return { body: text.slice(0, idx).trimEnd(), disclaimer: text.slice(idx).trim() };
}

function AnalysisBubble({ contenu }) {
  const { body } = splitDisclaimer(contenu);
  const sections = parseAnalysis(body);
  return (
    <div className="mb-5 animate-slide-up">
      <div className="rounded-2xl overflow-hidden shadow-md border border-pink-100">
        <div className="flex items-center gap-3 px-5 py-3.5"
          style={{ background: "linear-gradient(135deg,#f472b6,#ec4899)" }}>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <img src={`${process.env.PUBLIC_URL}/images/ribonTN.png`} alt="" className="w-4 h-4 object-contain" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Analyse Préliminaire IA</p>
            <p className="text-white/70 text-[11px] mt-0.5">Basée sur vos symptômes déclarés</p>
          </div>
        </div>
        <div className="bg-white px-5 py-4 space-y-3">
          {sections.map((s, i) => {
            if (s.type === "title") return null;
            if (s.type === "disclaimer") return (
              <p key={i} className="text-[10px] text-gray-400 italic pt-3 border-t border-gray-100 leading-relaxed">{s.text}</p>
            );
            if (s.type === "meta") return (
              <p key={i} className="text-xs font-semibold text-pink-500 bg-pink-50 rounded-lg px-3 py-1.5">{s.text}</p>
            );
            if (s.type === "section") return (
              <div key={i}>
                {s.heading && <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">{s.heading}</p>}
                <ul className="space-y-1">
                  {s.items.map((item, j) => (
                    <li key={j} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
            if (s.type === "paragraph") return (
              <p key={i} className="text-sm text-gray-700 leading-relaxed">{s.text}</p>
            );
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

function BotBubble({ contenu }) {
  const { body, disclaimer } = splitDisclaimer(contenu);
  return (
    <div className="flex items-end gap-2 mb-3 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
        <img src={`${process.env.PUBLIC_URL}/images/ribonTN.png`} alt="" className="w-4 h-4 object-contain" />
      </div>
      <div className="max-w-[78%] space-y-1">
        <div className="bg-white border border-pink-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{body}</p>
        </div>
        {disclaimer && <p className="text-[10px] text-gray-400 italic px-1 leading-snug">{disclaimer}</p>}
      </div>
    </div>
  );
}

function UserBubble({ contenu }) {
  return (
    <div className="flex justify-end mb-3 animate-fade-in">
      <div className="max-w-[78%] rounded-2xl rounded-br-sm px-4 py-3 shadow-sm"
        style={{ background: "linear-gradient(135deg,#f472b6,#ec4899)" }}>
        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{contenu}</p>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
        <img src={`${process.env.PUBLIC_URL}/images/ribonTN.png`} alt="" className="w-4 h-4 object-contain" />
      </div>
      <div className="bg-white border border-pink-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 h-4 items-center">
          {[0, 150, 300].map((d) => (
            <span key={d} className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Toast notification ────────────────────────────────────────────────────────
function Toast({ message, visible }) {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300"
      style={{ opacity: visible ? 1 : 0, transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)` }}
    >
      <div className="bg-gray-900 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        {message}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Symptoms() {
  const navigate = useNavigate();
  const [symptoms, setSymptoms]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modalOpen, setModalOpen]       = useState(false);
  const [pastSessions, setPastSessions] = useState([]);

  // Chat state
  const [chatMode, setChatMode]       = useState(false);
  const [sessionId, setSessionId]     = useState(null);
  const [messages, setMessages]       = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput]             = useState("");
  const [typing, setTyping]           = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError]     = useState("");

  // Share + toast + new-chat state
  const [sharingId, setSharingId]       = useState(null);
  const [toast, setToast]               = useState({ visible: false, message: "" });
  const [clearingChat, setClearingChat] = useState(false);

  // Tracks when the current "session" started — symptoms declared before this are stale
  const sessionStartRef = useRef(Date.now());

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 2800);
  };

  const bottomRef = useRef(null);

  const loadSymptoms     = () => api.get("/symptoms").then(({ data }) => setSymptoms(data)).catch(() => {}).finally(() => setLoading(false));
  const loadPastSessions = () => api.get("/chat/sessions").then(({ data }) => setPastSessions(data)).catch(() => {});

  useEffect(() => { loadSymptoms(); loadPastSessions(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const handleDeleteSymptom = async (id) => {
    try {
      await api.delete(`/symptoms/${id}`);
    } catch { /* already deleted — ignore */ }
    setSymptoms((prev) => prev.filter((s) => s._id !== id));
  };

  const newChat = async () => {
    setClearingChat(true);
    sessionStartRef.current = Date.now(); // mark fresh session boundary
    setSymptoms([]);
    setChatMode(false);
    setSessionId(null);
    setMessages([]);
    setSuggestions([]);
    setInput("");
    setChatError("");
    try {
      const snapshot = await api.get("/symptoms");
      await Promise.allSettled((snapshot.data || []).map((s) => api.delete(`/symptoms/${s._id}`)));
    } catch { /* ignore — local state already cleared */ }
    setClearingChat(false);
    showToast("Nouveau chat prêt — déclarez vos symptômes !");
  };

  const shareSession = async (sid) => {
    setSharingId(sid);
    try {
      const { data } = await api.post(`/chat/sessions/${sid}/share`);
      const url = `${window.location.origin}/share/${data.shareToken}`;
      await navigator.clipboard.writeText(url);
      showToast("Lien copié dans le presse-papier !");
    } catch {
      showToast("Impossible de générer le lien.");
    } finally {
      setSharingId(null);
    }
  };

  const startChat = async () => {
    setChatLoading(true);
    setChatError("");
    try {
      // Purge symptoms declared before the current session started
      const cutoff = sessionStartRef.current;
      const stale  = symptoms.filter((s) => new Date(s.dateDeclaration || s.createdAt).getTime() < cutoff);
      const fresh  = symptoms.filter((s) => new Date(s.dateDeclaration || s.createdAt).getTime() >= cutoff);
      if (stale.length > 0) {
        await Promise.allSettled(stale.map((s) => api.delete(`/symptoms/${s._id}`)));
        setSymptoms(fresh);
      }

      const { data } = await api.post("/chat/initialize", { symptoms: fresh.length > 0 ? fresh : symptoms });
      setSessionId(data.session._id);
      setMessages([{ _id: "analysis", contenu: data.analysis, role: "assistant_ia", isAnalysis: true }]);
      setSuggestions(data.suggestions);
      setChatMode(true);
      loadPastSessions();
    } catch {
      setChatError("Impossible de démarrer la session.");
    } finally {
      setChatLoading(false);
    }
  };

  const openSession = async (sid) => {
    setChatLoading(true);
    try {
      const { data } = await api.get(`/chat/sessions/${sid}/messages`);
      setSessionId(sid);
      setMessages(data.map((m, i) => ({ ...m, isAnalysis: i === 0 && m.role === "assistant_ia" })));
      setSuggestions([]);
      setChatMode(true);
    } catch {
      setChatError("Impossible d'ouvrir cette conversation.");
    } finally {
      setChatLoading(false);
    }
  };

  const deleteSession = async (sid) => {
    try {
      await api.put(`/chat/sessions/${sid}/close`);
      setPastSessions((prev) => prev.filter((s) => s._id !== sid));
      if (sessionId === sid) { setChatMode(false); setSessionId(null); setMessages([]); }
    } catch {}
  };

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || !sessionId) return;
    setInput(""); setSuggestions([]);
    setMessages((prev) => [...prev, { _id: `u-${Date.now()}`, contenu: content, role: "patient" }]);
    setTyping(true); setChatError("");
    try {
      const { data } = await api.post(`/chat/sessions/${sessionId}/messages`, { contenu: content });
      setMessages((prev) => [...prev, { ...data.response, metadata: data.metadata }]);
      if (data.requiresEscalation) {
        setTimeout(() => navigate("/appointments"), 3500);
      }
    } catch {
      setChatError("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (loading) return <Spinner />;

  return (
    <>
      <SymptomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={loadSymptoms}
      />

      <Toast visible={toast.visible} message={toast.message} />

      <div className="min-h-screen relative">
        <div className="absolute inset-0" style={{ background: "rgba(255,240,248,0.90)", backdropFilter: "blur(6px)" }} />

        <div className="relative z-10 flex flex-col px-5 py-6 gap-5" style={{ minHeight: "100vh" }}>

          {/* Page header */}
          <div className="flex items-center gap-3">
            <img src={`${process.env.PUBLIC_URL}/images/ribonTN.png`} alt="" className="w-7 h-7 object-contain drop-shadow" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-800 leading-none">CalmCare</h1>
              <p className="text-xs text-gray-400 mt-0.5">Déclarez vos symptômes · Analyse IA · Conversation</p>
            </div>
            <button
              onClick={newChat}
              disabled={clearingChat}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-pink-200 text-pink-600 bg-white/70 hover:bg-pink-50 transition shadow-sm disabled:opacity-60"
            >
              {clearingChat ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              )}
              {clearingChat ? "Réinitialisation…" : "Nouveau Chat"}
            </button>
          </div>

          {/* Two-column body */}
          <div className="flex gap-5 flex-1">

            {/* ══ LEFT SIDEBAR ════════════════════════════════════════════ */}
            <aside className="w-64 flex-shrink-0 flex flex-col gap-4 self-start sticky top-6">

              {/* Declare button */}
              <button
                onClick={() => setModalOpen(true)}
                className="w-full py-3 rounded-2xl font-bold text-sm text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#f9a8d4,#ec4899)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Déclarer un Symptôme
              </button>

              {/* My Symptoms */}
              <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-pink-50">
                  <h2 className="text-sm font-semibold text-gray-800">Mes Symptômes</h2>
                  <span className="text-xs font-bold bg-pink-100 text-pink-600 rounded-full px-2 py-0.5">{symptoms.length}</span>
                </div>
                <div className="p-3">
                  {symptoms.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-5">Aucun symptôme déclaré</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {symptoms.map((s) => {
                        const c = intensiteLevel(s.intensite);
                        return (
                          <div key={s._id} className="group flex items-center gap-2">
                            <div className="flex-1 rounded-xl px-3 py-2.5 border border-gray-100 bg-gray-50">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-semibold text-gray-700">{s.type}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${c.pill}`}>{s.intensite}/10</span>
                              </div>
                              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${s.intensite * 10}%` }} />
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteSymptom(s._id)}
                              className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-xs flex-shrink-0 transition"
                            >✕</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Conversations */}
              <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-pink-50">
                  <h2 className="text-sm font-semibold text-gray-800">Conversations récentes</h2>
                </div>
                <div className="p-3">
                  {pastSessions.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Aucune conversation</p>
                  ) : (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {pastSessions.slice(0, 8).map((s) => (
                        <div
                          key={s._id}
                          className={`group rounded-xl px-3 py-2.5 border transition ${
                            sessionId === s._id ? "bg-pink-50 border-pink-200" : "bg-gray-50 border-transparent hover:bg-pink-50/60 hover:border-pink-100"
                          }`}
                        >
                          <div className="cursor-pointer mb-1" onClick={() => openSession(s._id)}>
                            <p className="text-xs font-medium text-gray-700 truncate">
                              {s.type === "analyseSymptome" ? "Analyse de symptômes" : "Discussion générale"}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(s.dateDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => openSession(s._id)}
                              className="flex-1 text-[10px] font-semibold bg-white border border-pink-200 text-pink-500 hover:bg-pink-50 rounded-lg py-1 transition"
                            >Ouvrir</button>
                            <button
                              onClick={() => shareSession(s._id)}
                              disabled={sharingId === s._id}
                              className="flex-1 text-[10px] font-semibold bg-white border border-blue-200 text-blue-400 hover:bg-blue-50 rounded-lg py-1 transition disabled:opacity-50 flex items-center justify-center gap-0.5"
                            >
                              {sharingId === s._id ? (
                                <svg className="w-2.5 h-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                              ) : "Partager"}
                            </button>
                            <button
                              onClick={() => deleteSession(s._id)}
                              className="flex-1 text-[10px] font-semibold bg-white border border-red-200 text-red-400 hover:bg-red-50 rounded-lg py-1 transition"
                            >Supprimer</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Start AI analysis button */}
              <button
                onClick={startChat}
                disabled={chatLoading}
                className="w-full py-3 rounded-2xl font-bold text-sm text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#ec4899,#db2777)" }}
              >
                {chatLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {chatLoading ? "Analyse en cours…" : "Démarrer l'Analyse IA"}
              </button>
              {symptoms.length > 0 && (
                <p className="text-[11px] text-gray-400 text-center -mt-2">
                  {symptoms.length} symptôme{symptoms.length > 1 ? "s" : ""} seront analysés
                </p>
              )}
            </aside>

            {/* ══ RIGHT MAIN PANEL ════════════════════════════════════════ */}
            <main
              className="flex-1 rounded-2xl shadow-sm border border-pink-100 overflow-hidden flex flex-col bg-white"
              style={{ minHeight: "calc(100vh - 140px)" }}
            >
              {!chatMode ? (
                /* ── Welcome / empty state ── */
                <div className="flex-1 flex flex-col items-center justify-center text-center px-10 py-12">
                  <div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-md"
                    style={{ background: "linear-gradient(135deg,#fce7f3,#fda4af)" }}
                  >
                    <img src={`${process.env.PUBLIC_URL}/images/ribonTN.png`} alt="" className="w-11 h-11 object-contain" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2 font-display">Votre espace de suivi</h2>
                  <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-8">
                    {symptoms.length === 0
                      ? "Commencez par déclarer un symptôme, puis démarrez une analyse IA personnalisée."
                      : `Vous avez déclaré ${symptoms.length} symptôme${symptoms.length > 1 ? "s" : ""}. Cliquez sur "Démarrer l'Analyse IA" pour obtenir un bilan personnalisé.`
                    }
                  </p>
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button
                      onClick={() => setModalOpen(true)}
                      className="w-full py-3 rounded-2xl font-semibold text-sm border-2 border-pink-200 text-pink-600 bg-pink-50 hover:bg-pink-100 transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Déclarer un Symptôme
                    </button>
                    {symptoms.length > 0 && (
                      <button
                        onClick={startChat}
                        disabled={chatLoading}
                        className="w-full py-3 rounded-2xl font-semibold text-sm text-white shadow hover:shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#f472b6,#ec4899)" }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Démarrer l'Analyse IA
                      </button>
                    )}
                  </div>
                  {chatError && <p className="text-xs text-red-500 mt-4">{chatError}</p>}
                </div>
              ) : (
                /* ── Chat view ── */
                <div className="flex flex-col h-full">
                  {/* Chat header */}
                  <div className="px-5 py-4 border-b border-pink-50 flex items-center gap-3">
                    <button
                      onClick={() => { setChatMode(false); setMessages([]); setSessionId(null); }}
                      className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-lg font-bold transition flex-shrink-0"
                    >‹</button>
                    <div className="w-9 h-9 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center flex-shrink-0">
                      <img src={`${process.env.PUBLIC_URL}/images/ribonTN.png`} alt="" className="w-5 h-5 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">Assistante Médicale IA</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <p className="text-[11px] text-gray-400">Spécialisée en oncologie</p>
                      </div>
                    </div>
                    {symptoms.length > 0 && (
                      <span className="text-[11px] bg-pink-50 text-pink-500 border border-pink-200 rounded-full px-2.5 py-1 font-medium flex-shrink-0">
                        {symptoms.length} symptôme{symptoms.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-5 py-5"
                    style={{ background: "linear-gradient(180deg,#fff9fb 0%,#fff4f7 100%)" }}>
                    {messages.map((m) =>
                      m.isAnalysis ? <AnalysisBubble key={m._id} contenu={m.contenu} />
                      : m.role === "patient" ? <UserBubble key={m._id} contenu={m.contenu} />
                      : <BotBubble key={m._id} contenu={m.contenu} />
                    )}
                    {typing && <TypingDots />}
                    {suggestions.length > 0 && !typing && (
                      <div className="flex flex-wrap gap-2 mt-2 animate-fade-in">
                        {suggestions.map((s, i) => (
                          <button key={i} onClick={() => sendMessage(s)}
                            className="text-xs bg-white text-pink-600 border border-pink-200 rounded-full px-3.5 py-1.5 hover:bg-pink-50 transition font-medium shadow-sm">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    {chatError && <p className="text-xs text-red-500 text-center py-2">{chatError}</p>}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input bar */}
                  <div className="px-4 py-3 border-t border-pink-50 bg-white flex items-end gap-2">
                    <textarea
                      rows={1} value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Posez votre question…"
                      disabled={!sessionId || typing}
                      className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition"
                      style={{ minHeight: "42px", maxHeight: "120px" }}
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || !sessionId || typing}
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#f472b6,#ec4899)" }}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
