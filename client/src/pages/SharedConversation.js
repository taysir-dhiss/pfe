// Page Conversation Partagée — vue publique (sans authentification) d'une session chatbot
// Accessible via un lien unique : /share/:token
// Affiche les messages de la conversation en lecture seule
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

// Sépare le corps du message du disclaimer IA (⚕️) pour un affichage stylistique distinct
function splitDisclaimer(text) {
  const idx = text.indexOf("⚕️");
  if (idx === -1) return { body: text.trim(), disclaimer: null };
  return { body: text.slice(0, idx).trimEnd(), disclaimer: text.slice(idx).trim() };
}

export default function SharedConversation() {
  const { token } = useParams(); // Token unique extrait de l'URL (/share/:token)
  const [data, setData]     = useState(null);    // Données de la session + messages
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(true);

  // Charge la conversation publique via le token sans nécessiter d'authentification
  useEffect(() => {
    fetch(`/api/chat/share/${token}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError("Ce lien est invalide ou a expiré."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#fff4f7" }}>
      <div className="flex gap-1.5">
        {[0, 150, 300].map((d) => (
          <span key={d} className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#fff4f7" }}>
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#fff4f7,#fff0f5)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-pink-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
          <img src="/images/ribonTN.png" alt="CalmCare" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 leading-none">CalmCare</p>
          <p className="text-[11px] text-pink-400 mt-0.5">Conversation partagée · Lecture seule</p>
        </div>
        <span className="text-[11px] bg-pink-50 text-pink-500 border border-pink-200 rounded-full px-2.5 py-1 font-medium flex-shrink-0">
          {data.session.type === "analyseSymptome" ? "Analyse de symptômes" : "Discussion"}
        </span>
      </div>

      {/* Messages */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        <p className="text-center text-[11px] text-gray-700 mb-4">
          {new Date(data.session.dateDebut).toLocaleDateString("fr-FR", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
        </p>

        {data.messages.map((m, i) => {
          if (m.role === "patient") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[78%] rounded-2xl rounded-br-sm px-4 py-3 shadow-sm text-sm text-white leading-relaxed"
                  style={{ background: "linear-gradient(135deg,#f472b6,#ec4899)" }}>
                  {m.contenu}
                </div>
              </div>
            );
          }
          const { body, disclaimer } = splitDisclaimer(m.contenu);
          return (
            <div key={i} className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                <img src="/images/ribonTN.png" alt="" className="w-4 h-4 object-contain" />
              </div>
              <div className="max-w-[78%] space-y-1">
                <div className="bg-white border border-pink-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{body}</p>
                </div>
                {disclaimer && (
                  <p className="text-[10px] text-gray-700 italic px-1 leading-snug">{disclaimer}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-[11px] text-gray-700">
        Partagé via CalmCare · Application de suivi oncologique
      </div>
    </div>
  );
}
