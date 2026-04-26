import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

const STADES = ["Stade I", "Stade II", "Stade III", "Stade IV"];

export default function PatientDashboard() {
  const [profile, setProfile]       = useState(null);
  const [appointments, setAppoints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editMode, setEditMode]     = useState(false);
  const [form, setForm]             = useState({});
  const [msg, setMsg]               = useState({ text: "", type: "" });

  useEffect(() => {
    Promise.all([
      api.get("/patients/profile"),
      api.get("/appointments"),
    ]).then(([pRes, aRes]) => {
      setProfile(pRes.data);
      setForm(pRes.data);
      setAppoints(aRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

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

  const upcoming = appointments.filter(a => new Date(a.date) > new Date());
  const nextAppt = [...upcoming].sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const quickLinks = [
    { to: "/symptoms",        icon: "🩺", label: "Mes Symptômes",   sub: "Suivi quotidien",            color: "from-pink-50 to-rose-50",     border: "border-pink-200",   text: "text-pink-600"   },
    { to: "/appointments",    icon: "📅", label: "Rendez-vous",      sub: `${upcoming.length} à venir`, color: "from-teal-50 to-emerald-50",  border: "border-teal-200",   text: "text-teal-600"   },
    { to: "/content",         icon: "📖", label: "Contenu médical",  sub: "12 articles",                color: "from-blue-50 to-indigo-50",   border: "border-blue-200",   text: "text-blue-600"   },
    { to: "/recommendations", icon: "📋", label: "Recommandations",  sub: "Personnalisées",             color: "from-amber-50 to-yellow-50",  border: "border-amber-200",  text: "text-amber-600"  },
    { to: "/notifications",   icon: "🔔", label: "Notifications",    sub: "5 nouvelles",                color: "from-orange-50 to-rose-50",   border: "border-orange-200", text: "text-orange-600" },
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
      <div className="grid grid-cols-1 sm:grid-cols-1 max-w-sm gap-4 mb-8">

        <div className="card py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold text-gray-800">{upcoming.length}</p>
            <p className="text-xs text-gray-500 leading-tight">Rendez-vous<br />à venir</p>
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
        <div className="card lg:col-span-1 animate-slide-up">
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
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
                    <span className={`text-sm font-semibold ${highlight ? "text-brand-600" : "text-gray-700"}`}>
                      {value || "—"}
                    </span>
                  </div>
                ))}
                {profile?.historiqueMedical && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Antécédents</p>
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
                <input type="text" className="input text-sm" value={form.nom || ""}
                  onChange={e => setForm({ ...form, nom: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Stade du cancer</label>
                <select className="input text-sm" value={form.stadeCancer || ""}
                  onChange={e => setForm({ ...form, stadeCancer: e.target.value })}>
                  <option value="">Non renseigné</option>
                  {STADES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Antécédents médicaux</label>
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
          <div className="grid grid-cols-5 gap-3 stagger">
            {quickLinks.map(({ to, icon, label, sub, color, border, text }) => (
              <Link key={label} to={to}
                className={`bg-gradient-to-br ${color} border ${border} rounded-2xl py-5 px-3 flex flex-col items-center text-center gap-3 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group`}>
                <div className="w-11 h-11 rounded-xl bg-white/80 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform duration-200">
                  {icon}
                </div>
                <div>
                  <p className={`font-semibold text-xs ${text}`}>{label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
