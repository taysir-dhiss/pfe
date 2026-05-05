import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

const BellIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

export default function Navbar() {
  const { user, logout }                    = useAuth();
  const { unread }                          = useNotifications();
  const navigate                            = useNavigate();
  const location                            = useLocation();
  const [menuOpen, setMenuOpen]             = useState(false);
  const [ringing, setRinging]               = useState(false);
  const prevUnread                          = useRef(0);
  const isAdmin                             = user?.role === "admin";

  // Ring bell + animate badge when new notifications arrive
  useEffect(() => {
    if (unread > prevUnread.current) {
      setRinging(true);
      const t = setTimeout(() => setRinging(false), 700);
      return () => clearTimeout(t);
    }
    prevUnread.current = unread;
  }, [unread]);

  // Close mobile menu on navigation
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate("/login"); };
  const isActive = to => location.pathname === to;

  const patientLinks = [
    { to: "/dashboard",       label: "Accueil" },
    { to: "/chatbot",          label: "CalmCare" },
    { to: "/appointments",    label: "Rendez-vous" },
    { to: "/content",         label: "Contenu médical" },
    { to: "/recommendations", label: "Recommandations" },
    { to: "/community",       label: "Communauté" },
  ];
  const adminLinks = [
    { to: "/admin",              label: "Dashboard" },
    { to: "/admin/patients",     label: "Patients" },
    { to: "/admin/content",      label: "Contenu" },
    { to: "/admin/rag",          label: "Base RAG" },
    { to: "/admin/create-admin", label: "Créer Admin" },
  ];
  const links = isAdmin ? adminLinks : patientLinks;

  return (
    <nav className="sticky top-0 z-40 w-full">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to={isAdmin ? "/admin" : "/dashboard"}
              className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-200 flex-shrink-0">
                <img src={`${process.env.PUBLIC_URL}/images/ribonTN.png`} alt="CancerCare" className="w-full h-full object-cover" />
              </div>
              <span className="font-display font-bold text-lg text-brand-700 tracking-tight">
                CancerCare
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-0.5">
              {links.map(l => (
                <Link key={l.to} to={l.to}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(l.to)
                      ? "bg-brand-100 text-brand-700 font-semibold"
                      : "text-gray-600 hover:text-brand-600 hover:bg-brand-50"
                  }`}>
                  {l.label}
                </Link>
              ))}

              {/* Bell — patient only, navigates to /notifications */}
              {!isAdmin && (
                <Link to="/notifications"
                  className={`relative p-2 ml-1 rounded-xl transition-all duration-200 ${
                    isActive("/notifications")
                      ? "bg-brand-100 text-brand-600"
                      : "text-gray-700 hover:text-brand-600 hover:bg-brand-50"
                  } ${ringing ? "animate-bell-ring" : ""}`}>
                  <BellIcon />
                  {unread > 0 && (
                    <span
                      key={unread}
                      className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center leading-none px-0.5 animate-badge-pop shadow-sm">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              )}

              {/* Divider */}
              <div className="w-px h-5 bg-gray-200 mx-2" />

              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </div>

            {/* Mobile right */}
            <div className="md:hidden flex items-center gap-1">
              {!isAdmin && (
                <Link to="/notifications"
                  className={`relative p-2 rounded-xl transition ${ringing ? "animate-bell-ring" : ""} ${isActive("/notifications") ? "bg-brand-100 text-brand-600" : "text-gray-600 hover:bg-brand-50"}`}>
                  <BellIcon />
                  {unread > 0 && (
                    <span key={unread} className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5 animate-badge-pop">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              )}
              <button className="p-2 text-gray-600 rounded-xl hover:bg-brand-50 transition" onClick={() => setMenuOpen(o => !o)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 animate-slide-down shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${isActive(l.to) ? "bg-brand-100 text-brand-700 font-semibold" : "text-gray-600 hover:bg-brand-50 hover:text-brand-600"}`}>
                {l.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 mt-1 pt-2">
              <button onClick={handleLogout}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 text-left transition">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
