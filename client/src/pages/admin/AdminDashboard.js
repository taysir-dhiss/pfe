// Tableau de bord administrateur — affiche les statistiques globales et les raccourcis vers les sections
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

export default function AdminDashboard() {
  const { user } = useAuth();             // Données de l'administrateur connecté
  const [stats, setStats] = useState(null); // Statistiques : nombre de patientes, admins, etc.
  const [loading, setLoading] = useState(true);

  // Charge les statistiques globales au montage du composant
  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const statCards = [
    { label: "Patientes",  value: stats?.patientCount ?? "—", icon: "👩‍⚕️", color: "from-pink-50 to-rose-50",    border: "border-pink-200",   text: "text-pink-600",   to: "/admin/patients" },
    { label: "Admins",     value: stats?.adminCount   ?? "—", icon: "🛡️", color: "from-purple-50 to-pink-50", border: "border-purple-200", text: "text-purple-600", to: "#" },
  ];

  const shortcuts = [
    { to: "/admin/patients",     icon: "👥", label: "Gérer les patientes",  sub: "Créer, modifier, supprimer",  color: "from-pink-50 to-rose-50",    border: "border-pink-200",   text: "text-pink-600"   },
    { to: "/admin/content",      icon: "📚", label: "Contenu médical",      sub: "Articles & liens Google",     color: "from-blue-50 to-indigo-50",  border: "border-blue-200",   text: "text-blue-600"   },
    { to: "/admin/rag",          icon: "📖", label: "Base RAG",             sub: "PDFs indexés pour le chatbot", color: "from-teal-50 to-emerald-50", border: "border-teal-200",   text: "text-teal-600"   },
    { to: "/admin/create-admin", icon: "🛡️", label: "Créer un admin",       sub: "Nouveau compte administrateur", color: "from-purple-50 to-pink-50", border: "border-purple-200", text: "text-purple-600" },
  ];

  return (
    <div className="page">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="hero-banner rounded-3xl mb-8 overflow-hidden" style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/images/Rose.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 20%',
      }}>
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 p-8">

          {/* Icon — identical to Patient dashboard mini-logo */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-white/30
                            hover:shadow-xl hover:scale-105 transition-all duration-200">
              <img
                src={`${process.env.PUBLIC_URL}/images/ribonTN.png`}
                alt="CancerCare"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="text-center sm:text-left flex-1">
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">
              Administration · CancerCare TN
            </p>
            <h1 className="font-display text-3xl font-bold text-white mb-1">
              Bonjour, {user?.nom?.split(" ")[0]} 👋
            </h1>
            <p className="text-white/65 text-sm">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Ribbon — identical to Patient dashboard floating image */}
          <div className="flex-shrink-0">
            <img
              src={`${process.env.PUBLIC_URL}/images/ribonTN.png`}
              alt=""
              className="w-16 h-20 object-contain drop-shadow-lg opacity-80"
            />
          </div>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="section-header mb-5">
        <h2 className="text-lg font-semibold text-gray-800">Vue d'ensemble</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-8 stagger">
        {statCards.map(({ label, value, icon, color, border, text, to }) => (
          <Link key={label} to={to}
            className={`bg-gradient-to-br ${color} border ${border} rounded-2xl p-6 flex flex-col items-center gap-3 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300`}>
            <div className="w-14 h-14 rounded-2xl bg-white/70 flex items-center justify-center text-3xl shadow-sm">
              {icon}
            </div>
            <div className="text-center">
              <p className={`text-3xl font-bold font-display ${text}`}>{value}</p>
              <p className="text-sm text-gray-700 font-medium mt-0.5">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Shortcuts ───────────────────────────────────────────────────── */}
      <div className="section-header mb-5">
        <h2 className="text-lg font-semibold text-gray-800">Accès rapides</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
        {shortcuts.map(({ to, icon, label, sub, color, border, text }) => (
          <Link key={to} to={to}
            className={`bg-gradient-to-br ${color} border ${border} rounded-2xl p-5 flex items-center gap-4 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group`}>
            <div className="w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center text-2xl shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
              {icon}
            </div>
            <div className="min-w-0">
              <p className={`font-semibold text-sm ${text} truncate`}>{label}</p>
              <p className="text-xs text-gray-700 mt-0.5 truncate">{sub}</p>
            </div>
            <svg className={`w-4 h-4 ml-auto flex-shrink-0 ${text} opacity-40 group-hover:opacity-80 group-hover:translate-x-1 transition-all duration-200`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
