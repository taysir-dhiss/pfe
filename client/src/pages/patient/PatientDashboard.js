// Tableau de bord patient — affiche le profil, les rendez-vous, les accès rapides et l'historique des conversations CalmCare
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

// Libellés lisibles pour chaque type de session chatbot
const SESSION_TYPE_LABELS = {
  analyseSymptome: "Analyse de symptômes",
  general_support: "Consultation CalmCare",
  poserQuest:      "Questions médicales",
};

// Retourne un titre lisible pour une session selon son type
function sessionTitle(s) { return SESSION_TYPE_LABELS[s.type] || "Conversation"; }

// Formate la date d'une session en texte relatif (Aujourd'hui / Hier / date)
function formatSessionDate(dateStr) {
  const d    = new Date(dateStr);
  const diff = Math.floor((Date.now() - d) / 86400000);
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diff === 0) return `Aujourd'hui, ${time}`;
  if (diff === 1) return `Hier, ${time}`;
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}, ${time}`;
}

// Options de stade disponibles pour l'édition du profil
const STADES = ["Stade I", "Stade II", "Stade III", "Stade IV"];

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile]       = useState(null);    // Données du profil patient
  const [appointments, setAppoints] = useState([]);      // Liste de tous les rendez-vous
  const [sessions, setSessions]     = useState([]);      // Historique des sessions chatbot
  const [loading, setLoading]       = useState(true);    // Indicateur de chargement initial
  const [editMode, setEditMode]     = useState(false);   // Mode édition du profil
  const [form, setForm]             = useState({});      // État du formulaire d'édition du profil
  const [msg, setMsg]               = useState({ text: "", type: "" }); // Message de succès ou d'erreur
  const [copiedId, setCopiedId]     = useState(null);    // ID de la session dont le lien vient d'être copié
  const [deletingId, setDeletingId] = useState(null);   // ID de la session en cours de suppression

  // Chargement simultané du profil, des rendez-vous et des sessions au montage du composant
  useEffect(() => {
    Promise.all([
      api.get("/patients/profile"),
      api.get("/appointments"),
      api.get("/chat/sessions?all=true"), // ?all=true pour inclure les sessions fermées
    ]).then(([pRes, aRes, sRes]) => {
      setProfile(pRes.data);
      setForm(pRes.data);               // Pré-remplit le formulaire avec les données actuelles
      setAppoints(aRes.data || []);
      setSessions(sRes.data || []);
    }).catch(() => {
      setMsg({ text: "Impossible de charger vos données. Vérifiez votre connexion et réessayez.", type: "error" });
    }).finally(() => setLoading(false));
  }, []);

  // Supprime une session chatbot et la retire de la liste locale
  const handleDeleteSession = async (e, sid) => {
    e.stopPropagation(); // Empêche la navigation vers la session lors du clic sur "Supprimer"
    setDeletingId(sid);
    try {
      await api.delete(`/chat/sessions/${sid}`);
      setSessions(prev => prev.filter(s => s._id !== sid));
    } catch { setMsg({ text: "Impossible de supprimer la conversation.", type: "error" }); }
    finally { setDeletingId(null); }
  };

  // Génère un lien de partage public et le copie dans le presse-papiers
  const handleShareSession = async (e, sid) => {
    e.stopPropagation();
    try {
      const { data } = await api.post(`/chat/sessions/${sid}/share`);
      const url = `${window.location.origin}/share/${data.shareToken}`;
      await navigator.clipboard.writeText(url);
      setCopiedId(sid);
      setTimeout(() => setCopiedId(null), 2000); // Réinitialise l'état "Copié!" après 2 secondes
    } catch { setMsg({ text: "Impossible de générer le lien.", type: "error" }); }
  };

  // Sauvegarde les modifications du profil (nom, stade du cancer, antécédents)
  const handleSave = async e => {
    e.preventDefault();
    try {
      const { data } = await api.put("/patients/profile", form);
      setProfile(data); setEditMode(false);
      setMsg({ text: "Profil mis à jour.", type: "success" });
    } catch {
      setMsg({ text: "Erreur lors de la mise à jour.", type: "error" });
    }
  };

  // Filtre les rendez-vous futurs et trouve le prochain
  const upcoming = appointments.filter(a => new Date(a.date) > new Date());
  const nextAppt = [...upcoming].sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const quickLinks = [
    { to: "/chatbot",         icon: "🩺", label: "CalmCare",        sub: "Suivi quotidien",            color: "from-pink-50 to-rose-50",     border: "border-pink-200",   text: "text-pink-600"   },
    { to: "/appointments",    icon: "📅", label: "Rendez-vous",      sub: `${upcoming.length} à venir`, color: "from-teal-50 to-emerald-50",  border: "border-teal-200",   text: "text-teal-600"   },
    { to: "/content",         icon: "📖", label: "Contenu médical",  sub: "12 articles",                color: "from-blue-50 to-indigo-50",   border: "border-blue-200",   text: "text-blue-600"   },
    { to: "/recommendations", icon: "📋", label: "Recommandations",  sub: "Personnalisées",             color: "from-amber-50 to-yellow-50",  border: "border-amber-200",  text: "text-amber-600"  },
  ];

  if (loading) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">

      {/* ── Hero Banner ───────────────────────────────────────────────────── */}
      <div className="hero-banner rounded-3xl mb-6 overflow-hidden" style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/images/Rose.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 20%',
      }}>
        <div className="relative z-10 flex flex-col md:flex-row items-center">

          {/* Left content */}
          <div className="flex-1 p-8 md:p-10 text-white">
            {/* Mini logo */}
            <div className="flex items-center gap-2 mb-4">
              <img src={`${process.env.PUBLIC_URL}/images/ribonTN.png`}
                alt="" className="w-8 h-8 object-contain drop-shadow" />
              <span className="text-white/70 text-xs font-bold uppercase tracking-widest">
                CancerCare TN
              </span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 leading-tight">
              Bienvenue,{" "}
              <span className="text-brand-200">{profile?.nom?.split(" ")[0]}</span>
            </h1>
            <p className="text-white/75 text-base leading-relaxed mb-8 max-w-md">
              Votre espace santé intelligent. Suivez vos symptômes, consultez
              vos rendez-vous et restez connecté avec votre équipe médicale.
            </p>

          </div>

          {/* Right — ribbon card */}
          <div className="flex-shrink-0 p-6 md:p-10 flex flex-col items-center">
            <div className="flex flex-col items-center">
              <img src={`${process.env.PUBLIC_URL}/images/ribonTN.png`}
                alt="Ruban cancer du sein"
                className="w-28 h-32 object-contain drop-shadow-lg" />
              <p className="text-white/80 text-xs text-center mt-3 font-medium leading-tight">
                Ensemble contre<br />le cancer
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 mb-8">

        <div className="card py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold text-gray-800">{upcoming.length}</p>
            <p className="text-xs text-gray-700 leading-tight">Rendez-vous<br />à venir</p>
          </div>
          {nextAppt && (
            <span className="flex-shrink-0 bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap">
              Prochain: {new Date(nextAppt.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>


      </div>

      {msg.text && (
        <div className={`rounded-2xl px-4 py-3 mb-5 text-sm border animate-fade-in ${msg.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Profile card ──────────────────────────────────────────────── */}
        <div className="card lg:col-span-1 animate-float" style={{ animationDelay: "0.1s" }}>
          <div className="section-header">
            <h2 className="text-lg font-semibold text-gray-800">Mon profil</h2>
          </div>

          {!editMode ? (
            <>
              <div className="space-y-3">
                {[
                  { label: "Nom complet",     value: profile?.nom },
                  { label: "Email",           value: profile?.email },
                  { label: "Date naissance",  value: profile?.dateNaissance ? new Date(profile.dateNaissance).toLocaleDateString("fr-FR") : null },
                  { label: "Stade du cancer", value: profile?.stadeCancer, highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-700 font-medium uppercase tracking-wide">{label}</span>
                    <span className={`text-sm font-semibold ${highlight ? "text-brand-600" : "text-gray-700"}`}>
                      {value || "—"}
                    </span>
                  </div>
                ))}
                {profile?.historiqueMedical && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-700 font-medium uppercase tracking-wide mb-1">Antécédents</p>
                    <p className="text-sm text-gray-700 bg-brand-50 rounded-xl p-3">{profile.historiqueMedical}</p>
                  </div>
                )}
              </div>
              <button className="btn-secondary w-full mt-5 text-sm" onClick={() => setEditMode(true)}>
                ✏️ Modifier le profil
              </button>
            </>
          ) : (
            <form onSubmit={handleSave} className="space-y-3 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" className="input text-sm" value={form.nom || ""}
                  onChange={e => setForm({ ...form, nom: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Stade du cancer</label>
                <select className="input text-sm" value={form.stadeCancer || ""}
                  onChange={e => setForm({ ...form, stadeCancer: e.target.value })}>
                  <option value="">Non renseigné</option>
                  {STADES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Antécédents médicaux</label>
                <textarea className="input text-sm resize-none" rows={3}
                  value={form.historiqueMedical || ""}
                  onChange={e => setForm({ ...form, historiqueMedical: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary flex-1 text-sm">Enregistrer</button>
                <button type="button" className="btn-secondary flex-1 text-sm" onClick={() => setEditMode(false)}>Annuler</button>
              </div>
            </form>
          )}
        </div>

        {/* ── Quick links ───────────────────────────────────────────────── */}
        <div className="lg:col-span-2 lg:col-start-auto">
          <div className="section-header mb-5">
            <h2 className="text-lg font-semibold text-gray-800">Accès rapide</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {quickLinks.map(({ to, icon, label, sub, color, border, text }, i) => (
              <Link key={label} to={to}
                style={{ animationDelay: `${i * 0.25}s` }}
                className={`animate-float bg-gradient-to-br ${color} border ${border} rounded-2xl py-7 px-4 flex flex-col items-center text-center gap-3 shadow-card hover:shadow-card-hover transition-shadow duration-300 group`}>
                <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-200">
                  {icon}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${text}`}>{label}</p>
                  <p className="text-xs text-gray-700 mt-0.5">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Conversations récentes ────────────────────────────────────────── */}
      <div className="card mt-6">
        <div className="section-header mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">Conversations récentes</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide text-white"
              style={{ background: "linear-gradient(135deg,#f472b6,#db2777)" }}>
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 016 6c0 3.314-2.686 6-6 6S4 11.314 4 8a6 6 0 016-6zm0 13c-3.866 0-7 1.343-7 3v1h14v-1c0-1.657-3.134-3-7-3z"/>
              </svg>
              CalmCare
            </span>
          </div>
          <Link to="/chatbot" className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition">
            Voir tout →
          </Link>
        </div>

        {sessions.length === 0 ? (
          <p className="text-sm text-gray-700 text-center py-6">Aucune conversation pour le moment.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {sessions.slice(0, 5).map(s => {
              const isDeleting = deletingId === s._id;
              const isCopied   = copiedId === s._id;
              return (
                <div key={s._id}
                  className="group flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50/40 transition-all duration-150 cursor-pointer"
                  onClick={() => navigate("/chatbot", { state: { sessionId: s._id } })}>

                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#fce7f3,#f9a8d4)" }}>
                    <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                  </div>

                  {/* Title + date */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{sessionTitle(s)}</p>
                    <p className="text-xs text-gray-700 mt-0.5">{formatSessionDate(s.dateDebut)}</p>
                  </div>

                  {/* Action buttons — appear on hover */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); navigate("/chatbot", { state: { sessionId: s._id } }); }}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:border-pink-300 hover:text-pink-600 transition">
                      Ouvrir
                    </button>
                    <button
                      onClick={e => handleShareSession(e, s._id)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                        isCopied
                          ? "border-green-300 text-green-600 bg-green-50"
                          : "border-gray-200 text-gray-600 hover:bg-white hover:border-blue-300 hover:text-blue-600"
                      }`}>
                      {isCopied ? "Copié !" : "Partager"}
                    </button>
                    <button
                      onClick={e => handleDeleteSession(e, s._id)}
                      disabled={isDeleting}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition disabled:opacity-40">
                      {isDeleting ? "…" : "Supprimer"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => navigate("/chatbot")}
          className="w-full py-3 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition"
          style={{ background: "linear-gradient(135deg,#f472b6 0%,#ec4899 50%,#db2777 100%)" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          Démarrer l'Analyse IA
        </button>
      </div>

    </div>
  );
}
