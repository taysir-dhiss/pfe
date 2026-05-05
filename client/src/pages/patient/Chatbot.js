// Page Chatbot — interface de chat IA avec gestion des sessions (version simplifiée)
// Utilisée comme version alternative à ChatbotAI.js (interface complète)
import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

// Libellés lisibles pour chaque type de session chatbot
const SESSION_LABELS = {
  general_support:  "Support général",
  analyseSymptome:  "Analyse de symptômes",
  poserQuest:       "Question médicale",
};

export default function Chatbot() {
  const [sessions, setSessions]   = useState([]);              // Historique des sessions ouvertes
  const [active, setActive]       = useState(null);            // Session active sélectionnée
  const [messages, setMessages]   = useState([]);              // Messages de la session active
  const [input, setInput]         = useState("");              // Contenu du champ de saisie
  const [loading, setLoading]     = useState(true);            // Chargement initial des sessions
  const [sending, setSending]     = useState(false);           // Envoi d'un message en cours
  const [sessionType, setSessionType] = useState("general_support"); // Type de la nouvelle session
  const bottomRef = useRef(null); // Référence pour le défilement automatique vers le dernier message

  const loadSessions = () =>
    api.get("/chat/sessions").then(({ data }) => setSessions(data)).finally(() => setLoading(false));

  useEffect(() => { loadSessions(); }, []);

  useEffect(() => {
    if (active) api.get(`/chat/sessions/${active._id}/messages`).then(({ data }) => setMessages(data));
  }, [active]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const createSession = async () => {
    const { data } = await api.post("/chat/sessions", { type: sessionType });
    setSessions(prev => [data, ...prev]);
    setActive(data);
    setMessages([]);
  };

  const closeSession = async () => {
    await api.put(`/chat/sessions/${active._id}/close`);
    setActive(null);
    setMessages([]);
    loadSessions();
  };

  const sendMessage = async e => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const userMsg = { contenu: input, role: "patient", dateEnvoi: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    try {
      console.log("Incoming message:", userMsg.contenu);
      const { data } = await api.post(`/chat/sessions/${active._id}/messages`, { contenu: userMsg.contenu });
      console.log("Classification:", data.metadata);
      console.log("AI result:", data.response?.contenu);
      console.log("Final response:", data.response?.contenu);
      setMessages(prev => [...prev, data.response]);
    } catch {
      setMessages(prev => [...prev, { contenu: "Désolé, une erreur s'est produite.", role: "assistant_ia", dateEnvoi: new Date() }]);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <h1 className="page-title">🤖 Chatbot Médical IA</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="card lg:col-span-1 p-4">
          <p className="text-sm font-semibold text-gray-600 mb-3">Nouvelle session</p>
          <select className="input text-sm mb-2" value={sessionType} onChange={e => setSessionType(e.target.value)}>
            {Object.entries(SESSION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={createSession} className="btn-primary w-full text-sm">+ Démarrer</button>

          <div className="mt-4 space-y-1">
            <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Sessions</p>
            {sessions.map(s => (
              <button key={s._id} onClick={() => setActive(s)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${active?._id === s._id ? "bg-brand-100 text-brand-700 font-semibold" : "hover:bg-gray-50 text-gray-600"}`}>
                <span className="block truncate">{SESSION_LABELS[s.type]}</span>
                <span className="text-xs text-gray-700">{new Date(s.dateDebut).toLocaleDateString("fr-FR")}</span>
                {s.datefin && <span className="ml-1 text-xs text-gray-700">(terminée)</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className="lg:col-span-3">
          {!active ? (
            <div className="card flex flex-col items-center justify-center py-24 text-gray-700">
              <p className="text-5xl mb-4">💬</p>
              <p>Sélectionnez ou créez une session pour démarrer.</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden flex flex-col" style={{ height: "520px" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-brand-100 bg-brand-50">
                <span className="font-semibold text-brand-700">{SESSION_LABELS[active.type]}</span>
                {!active.datefin && (
                  <button onClick={closeSession} className="btn-secondary btn-sm text-xs">Terminer</button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-gray-700 text-sm mt-8">Envoyez un message pour commencer.</p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "patient" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                      ${m.role === "patient"
                        ? "bg-brand-600 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                      {m.contenu}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              {!active.datefin && (
                <form onSubmit={sendMessage} className="flex gap-2 px-4 py-3 border-t border-brand-100">
                  <input className="input flex-1 text-sm" placeholder="Posez votre question..."
                    value={input} onChange={e => setInput(e.target.value)} disabled={sending} />
                  <button type="submit" disabled={sending || !input.trim()} className="btn-primary px-5">
                    {sending
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                      : "→"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
