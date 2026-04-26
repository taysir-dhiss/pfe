import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

const TYPES = ["Consultation", "Traitement", "Suivi", "Urgence"];
const blankForm = { date: "", medecin: "", type: "Consultation" };

const toLocal = d => {
  if (!d) return "";
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
};

const isPast = a => new Date(a.date) < new Date();

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState(blankForm);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg]         = useState({ text: "", type: "" });

  const load = () =>
    api.get("/appointments")
      .then(({ data }) => setAppointments(data))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    try {
      if (editing) {
        const { data } = await api.put(`/appointments/${editing}`, form);
        setAppointments(prev => prev.map(a => a._id === editing ? data : a));
        setEditing(null);
        setMsg({ text: "Rendez-vous mis à jour.", type: "success" });
      } else {
        await api.post("/appointments", form);
        setMsg({ text: "Rendez-vous planifié. Vous recevrez un rappel 4h avant.", type: "success" });
        load();
      }
      setForm(blankForm);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Erreur.", type: "error" });
    }
  };

  const startEdit = a => {
    setEditing(a._id);
    setForm({ date: toLocal(a.date), medecin: a.medecin || "", type: a.type || "Consultation" });
    setMsg({ text: "", type: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditing(null); setForm(blankForm); setMsg({ text: "", type: "" }); };

  const handleDelete = async id => {
    if (!window.confirm("Supprimer ce rendez-vous ?")) return;
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(prev => prev.filter(a => a._id !== id));
    } catch { /* silent */ }
  };

  if (loading) return <Spinner />;

  const upcoming = appointments.filter(a => !isPast(a));
  const past     = appointments.filter(a =>  isPast(a));

  return (
    <div className="page">
      <h1 className="page-title">📅 Mes Rendez-vous</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Form ──────────────────────────────────────────────────────── */}
        <div className="card animate-slide-up">
          <div className="section-header">
            <h2 className="text-lg font-semibold text-gray-800">
              {editing ? "Modifier" : "Planifier"}
            </h2>
          </div>

          {msg.text && (
            <div className={`rounded-xl px-4 py-3 mb-4 text-sm border animate-fade-in ${msg.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date et heure *</label>
              <input type="datetime-local" className="input" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Médecin *</label>
              <input className="input" placeholder="Dr. Nom Prénom" value={form.medecin}
                onChange={e => setForm({ ...form, medecin: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1">
                {editing ? "Enregistrer" : "Planifier"}
              </button>
              {editing && (
                <button type="button" className="btn-secondary flex-1" onClick={cancelEdit}>Annuler</button>
              )}
            </div>
          </form>

          {/* Reminder info */}
          <div className="mt-5 p-3 bg-brand-50 rounded-xl border border-brand-100 flex items-start gap-2">
            <span className="text-base flex-shrink-0 mt-0.5">⏰</span>
            <p className="text-xs text-brand-600 leading-relaxed">
              Un rappel automatique vous sera envoyé <strong>4 heures</strong> avant chaque rendez-vous.
            </p>
          </div>
        </div>

        {/* ── List ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upcoming */}
          <div>
            <div className="section-header mb-4">
              <h3 className="font-semibold text-gray-700">
                À venir
                {upcoming.length > 0 && (
                  <span className="ml-2 bg-brand-100 text-brand-600 text-xs font-semibold px-2 py-0.5 rounded-full">{upcoming.length}</span>
                )}
              </h3>
            </div>
            {upcoming.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-4xl mb-3">📆</p>
                <p className="text-gray-400 text-sm">Aucun rendez-vous à venir.</p>
              </div>
            ) : (
              <div className="space-y-3 stagger">
                {upcoming.map(a => (
                  <div key={a._id} className="card animate-slide-up">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex flex-col items-center justify-center">
                          <span className="text-xs font-bold text-brand-600 leading-none">{new Date(a.date).toLocaleDateString("fr-FR", { day: "2-digit" })}</span>
                          <span className="text-[10px] text-brand-400 uppercase">{new Date(a.date).toLocaleDateString("fr-FR", { month: "short" })}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">
                            {a.type} <span className="font-normal text-gray-400">·</span> {a.medecin}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {new Date(a.date).toLocaleString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <span className={`inline-flex items-center gap-1 mt-1 text-xs font-medium ${a.reminderSent ? "text-green-500" : "text-brand-400"}`}>
                            {a.reminderSent ? "✓ Rappel envoyé" : "⏰ Rappel dans 4h"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => startEdit(a)}
                          className="p-2 rounded-xl hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-all duration-200" title="Modifier">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(a._id)}
                          className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all duration-200" title="Supprimer">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <div className="section-header mb-4">
                <h3 className="font-semibold text-gray-400">Passés</h3>
              </div>
              <div className="space-y-2">
                {past.slice(0, 5).map(a => (
                  <div key={a._id} className="card opacity-50 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-400">{new Date(a.date).toLocaleDateString("fr-FR", { day: "2-digit" })}</span>
                        <span className="text-[10px] text-gray-300 uppercase">{new Date(a.date).toLocaleDateString("fr-FR", { month: "short" })}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">{a.type} · {a.medecin}</p>
                        <p className="text-xs text-gray-400">{new Date(a.date).toLocaleString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
