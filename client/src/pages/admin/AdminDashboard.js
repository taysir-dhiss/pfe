// AdminDashboard — stats overview and quick links for admin
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const cards = [
    { label: "Patientes",    value: stats?.patientCount ?? "—",     emoji: "👩‍⚕️", bg: "bg-pink-50",   text: "text-pink-600",   to: "/admin/patients" },
    { label: "Rendez-vous", value: stats?.appointmentCount ?? "—",  emoji: "📅",  bg: "bg-green-50",  text: "text-green-600",  to: "/admin/appointments" },
    { label: "Symptômes",   value: stats?.symptomCount ?? "—",      emoji: "🌡️", bg: "bg-red-50",    text: "text-red-600",    to: "#" },
    { label: "Admins",      value: stats?.adminCount ?? "—",        emoji: "🛡️", bg: "bg-purple-50", text: "text-purple-600", to: "#" },
  ];

  const shortcuts = [
    { to: "/admin/patients",      emoji: "👥", label: "Gérer les patientes" },
    { to: "/admin/appointments",  emoji: "📅", label: "Gérer les rendez-vous" },
    { to: "/admin/content",       emoji: "📚", label: "Contenu médical" },
    { to: "/admin/notifications", emoji: "🔔", label: "Envoyer une notification" },
    { to: "/admin/create-admin",  emoji: "🛡️", label: "Créer un admin" },
  ];

  return (
    <div className="page">
      <div className="mb-6">
        <h1 className="page-title mb-1">🎗️ Tableau de bord</h1>
        <p className="text-gray-500">Bienvenue, <span className="font-medium text-brand-600">{user?.nom}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, emoji, bg, text, to }) => (
          <Link key={label} to={to} className={`card ${bg} flex flex-col items-center py-6 hover:shadow-md transition`}>
            <span className="text-4xl mb-2">{emoji}</span>
            <span className={`text-3xl font-bold ${text}`}>{value}</span>
            <span className="text-sm text-gray-500 mt-1">{label}</span>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-semibold text-gray-700 mb-3">Accès rapides</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {shortcuts.map(({ to, emoji, label }) => (
          <Link key={to} to={to}
            className="card flex items-center gap-3 hover:shadow-md hover:border-brand-300 transition cursor-pointer">
            <span className="text-2xl">{emoji}</span>
            <span className="font-medium text-gray-700 text-sm">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
