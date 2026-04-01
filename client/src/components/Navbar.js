// Navbar — responsive top nav with role-based links, baby pink theme
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  const handleLogout = () => { logout(); navigate("/login"); };

  const patientLinks = [
    { to: "/dashboard",       label: "Accueil" },
    { to: "/symptoms",        label: "Symptômes" },
    { to: "/appointments",    label: "Rendez-vous" },
    { to: "/recommendations", label: "Recommandations" },
    { to: "/chat",            label: "Chatbot IA" },
    { to: "/notifications",   label: "Notifications" },
  ];
  const adminLinks = [
    { to: "/admin",                label: "Dashboard" },
    { to: "/admin/patients",       label: "Patients" },
    { to: "/admin/appointments",   label: "Rendez-vous" },
    { to: "/admin/content",        label: "Contenu" },
    { to: "/admin/notifications",  label: "Notifications" },
    { to: "/admin/create-admin",   label: "Créer Admin" },
  ];
  const links = isAdmin ? adminLinks : patientLinks;

  return (
    <nav className="bg-gradient-to-r from-brand-600 to-brand-700 shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2">
            <span className="text-2xl">🎗️</span>
            <span className="text-white font-bold text-lg tracking-wide">CancerCare</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className="text-pink-100 hover:text-white hover:bg-brand-500 px-3 py-2 rounded-lg text-sm font-medium transition">
                {l.label}
              </Link>
            ))}
            <button onClick={handleLogout}
              className="ml-3 bg-white text-brand-600 hover:bg-brand-50 font-semibold px-4 py-1.5 rounded-lg text-sm transition">
              Déconnexion
            </button>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-white" onClick={() => setOpen(o => !o)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 flex flex-col gap-1">
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className="text-pink-100 hover:text-white hover:bg-brand-500 px-3 py-2 rounded-lg text-sm font-medium">
                {l.label}
              </Link>
            ))}
            <button onClick={handleLogout}
              className="mt-2 bg-white text-brand-600 font-semibold px-4 py-1.5 rounded-lg text-sm text-left">
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
