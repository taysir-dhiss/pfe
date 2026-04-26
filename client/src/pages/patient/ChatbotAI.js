// ChatbotAI — symptom-aware AI chat page
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";


function parseMessage(contenu) {
  const idx = contenu.indexOf("⚕️");
  if (idx === -1) return { body: contenu, disclaimer: null };
  return {
    body: contenu.slice(0, idx).trimEnd(),
    disclaimer: contenu.slice(idx).trim(),
  };
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
        <img
          src={`${process.env.PUBLIC_URL}/images/ribonTN.png`}
          alt=""
          className="w-5 h-5 object-contain"
        />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-5">
          <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

function BotBubble({ contenu, animate }) {
  const { body, disclaimer } = parseMessage(contenu);
  return (
    <div className={`flex items-end gap-2 mb-4 ${animate ? "animate-fade-in" : ""}`}>
      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
        <img
          src={`${process.env.PUBLIC_URL}/images/ribonTN.png`}
          alt=""
          className="w-5 h-5 object-contain"
        />
      </div>
      <div className="max-w-[78%] space-y-1">
        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{body}</p>
        </div>
        {disclaimer && (
          <p className="text-[11px] text-gray-400 italic px-1 leading-snug">{disclaimer}</p>
        )}
      </div>
    </div>
  );
}

function UserBubble({ contenu, animate }) {
  return (
    <div className={`flex justify-end mb-4 ${animate ? "animate-fade-in" : ""}`}>
      <div className="max-w-[78%] bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl rounded-br-sm px-4 py-3 shadow-sm">
        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{contenu}</p>
      </div>
    </div>
  );
}

export default function ChatbotAI() {
  const location = useLocation();
  const navigate = useNavigate();
  const symptoms = location.state?.symptoms || [];

  const [sessionId, setSessionId]     = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [typing, setTyping]           = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError]             = useState("");

  const bottomRef = useRef(null);

  // Initialize session on mount
  useEffect(() => {
    api
      .post("/chat/initialize", { symptoms })
      .then(({ data }) => {
        setSessionId(data.session._id);
        setSuggestions(data.suggestions);
        setMessages([{ _id: "welcome", contenu: data.welcome, role: "assistant_ia", isNew: false }]);
      })
      .catch(() => setError("Impossible de démarrer la session. Veuillez réessayer."))
      .finally(() => setInitLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll on new message or typing indicator
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || !sessionId) return;
    setInput("");
    setSuggestions([]); // hide chips after first send

    const tempId = `u-${Date.now()}`;
    setMessages((prev) => [...prev, { _id: tempId, contenu: content, role: "patient", isNew: true }]);
    setTyping(true);
    setError("");

    try {
      console.log("Incoming message:", content);
      const { data } = await api.post(`/chat/sessions/${sessionId}/messages`, { contenu: content });
      console.log("Classification:", data.metadata);
      console.log("AI result:", data.response?.contenu);
      console.log("Final response:", data.response?.contenu);
      setMessages((prev) => [
        ...prev,
        { ...data.response, metadata: data.metadata, isNew: true },
      ]);

      // Safety escalation — redirect to appointments if critical
      if (data.requiresEscalation) {
        setTimeout(() => navigate("/appointments"), 3500);
      }
    } catch (err) {
      console.error("sendMessage error:", err?.response?.data || err?.message || err);
      setError("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (initLoading) return <Spinner />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: "calc(100vh - 80px)" }}>

      {/* Header */}
      <div className="card mb-4 py-4 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition text-gray-500"
          title="Retour"
        >
          ‹
        </button>
        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
          <img
            src={`${process.env.PUBLIC_URL}/images/ribonTN.png`}
            alt=""
            className="w-6 h-6 object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm">Assistant médical IA</p>
          <p className="text-[11px] text-green-500 font-medium">En ligne</p>
        </div>
        {symptoms.length > 0 && (
          <span className="text-[11px] bg-brand-50 text-brand-600 border border-brand-200 rounded-full px-2 py-0.5 font-medium">
            {symptoms.length} symptôme{symptoms.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-0">
        {messages.map((m) =>
          m.role === "patient" ? (
            <UserBubble key={m._id} contenu={m.contenu} animate={m.isNew} />
          ) : (
            <BotBubble key={m._id} contenu={m.contenu} animate={m.isNew} />
          )
        )}

        {typing && <TypingIndicator />}

        {/* Suggestion chips — shown after welcome, before first user message */}
        {suggestions.length > 0 && !typing && (
          <div className="flex flex-wrap gap-2 mb-4 animate-fade-in">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="text-xs bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-3 py-1.5 hover:bg-brand-100 transition font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4 animate-fade-in">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="card mt-4 py-3 px-3 flex items-end gap-2 flex-shrink-0">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez votre question…"
          className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent transition leading-relaxed max-h-32"
          style={{ minHeight: "40px" }}
          disabled={!sessionId || typing}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || !sessionId || typing}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition shadow-sm"
          title="Envoyer"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
