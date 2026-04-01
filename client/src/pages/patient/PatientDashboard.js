// PatientDashboard — profile overview with quick-access cards
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

const STADES = ["Stade I", "Stade II", "Stade III", "Stade IV"];

export default function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    api.get("/patients/profile")
      .then(({ data }) => { setProfile(data); setForm(data); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async e => {
    e.preventDefault();
    try {
      const { data } = await api.put("/patients/profile", form);
      setProfile(data);
      setEditMode(false);
      setMsg({ text: "Profil mis à jour.", type: "success" });
    } catch {
      setMsg({ text: "Erreur lors de la mise à jour.", type: "error" });
    }
  };

  const cards = [
    { to: "/symptoms",        emoji: "🌡️", label: "Mes Symptômes",    bg: "bg-red-50",    border: "border-red-200",    text: "text-red-600"    },
    { to: "/appointments",    emoji: "📅", label: "Rendez-vous",       bg: "bg-green-50",  border: "border-green-200",  text: "text-green-600"  },
    { to: "/recommendations", emoji: "📋", label: "Recommandations",   bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-600" },
    { to: "/chat",            emoji: "🤖", label: "Chatbot IA",         bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600" },
    { to: "/notifications",   emoji: "🔔", label: "Notifications",     bg: "bg-brand-50",  border: "border-brand-200",  text: "text-brand-600"  },
  ];

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <h1 className="page-title">🎗️ Mon Espace Patient</h1>

      {msg.text && (
        <div className={`rounded-lg px-4 py-3 mb-5 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="card lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-brand-200 flex items-center justify-center text-2xl font-bold text-brand-700">
              {profile?.nom?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{profile?.nom}</p>
              <p className="text-sm text-gray-500">{profile?.email}</p>
            </div>
          </div>

          {!editMode ? (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Date naissance</span><span className="font-medium">{profile?.dateNaissance ? new Date(profile.dateNaissance).toLocaleDateString("fr-FR") : "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Stade</span><span className="font-medium text-brand-600">{profile?.stadeCancer || "—"}</span></div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-gray-500 mb-1">Antécédents</p>
                  <p className="font-medium">{profile?.historiqueMedical || "—"}</p>
                </div>
              </div>
              <button className="btn-secondary w-full mt-4 text-sm" onClick={() => setEditMode(true)}>
                ✏️ Modifier le profil
              </button>
            </>
          ) : (
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
                <input className="input text-sm" value={form.nom || ""} onChange={e => setForm({ ...form, nom: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stade du cancer</label>
                <select className="input text-sm" value={form.stadeCancer || ""} onChange={e => setForm({ ...form, stadeCancer: e.target.value })}>
                  <option value="">Non renseigné</option>
                  {STADES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Antécédents</label>
                <textarea className="input text-sm resize-none" rows={3} value={form.historiqueMedical || ""} onChange={e => setForm({ ...form, historiqueMedical: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary text-sm px-4 py-2">Enregistrer</button>
                <button type="button" className="btn-secondary text-sm px-4 py-2" onClick={() => setEditMode(false)}>Annuler</button>
              </div>
            </form>
          )}
        </div>

        {/* Quick links */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {cards.map(({ to, emoji, label, bg, border, text }) => (
            <Link key={to} to={to}
              className={`${bg} ${border} border rounded-2xl p-5 flex flex-col items-center gap-2 hover:shadow-md transition`}>
              <span className="text-3xl">{emoji}</span>
              <span className={`font-semibold text-sm text-center ${text}`}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
