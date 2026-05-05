// Page Rappels — la patiente gère ses alarmes personnalisées (médicaments, soins, etc.)
// Supporte trois types : ponctuel ("once"), quotidien ("daily"), hebdomadaire ("weekly")
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

// Noms abrégés des jours pour la sélection des jours de rappel hebdomadaire
const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// Convertit une date UTC en format datetime-local pour l'input HTML
const toDatetimeLocal = d => {
  if (!d) return "";
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
};

// Valeurs initiales du formulaire de création d'alarme
const blankForm = { label: "", repeatType: "daily", days: [], time: "08:00", date: "" };

export default function Reminders() {
  const [reminders, setReminders] = useState([]);          // Liste des rappels de la patiente
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blankForm);             // État du formulaire de création/modification
  const [msg, setMsg] = useState({ text: "", type: "" });  // Message de retour (succès / erreur)
  const [editing, setEditing] = useState(null);            // ID du rappel en cours de modification

  // Charge les rappels depuis l'API
  const load = () =>
    api.get("/reminders").then(({ data }) => setReminders(data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // Ajoute ou retire un jour de la liste des jours sélectionnés (rappel hebdomadaire)
  const toggleDay = d => {
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(d) ? prev.days.filter(x => x !== d) : [...prev.days, d]
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    try {
      const payload = {
        label: form.label,
        repeatType: form.repeatType,
        days: form.repeatType === "weekly" ? form.days : [],
        time: form.repeatType !== "once" ? form.time : undefined,
        date: form.repeatType === "once" ? form.date : undefined
      };
      if (editing) {
        const { data } = await api.put(`/reminders/${editing}`, payload);
        setReminders(prev => prev.map(r => r._id === editing ? data : r));
        setEditing(null);
      } else {
        const { data } = await api.post("/reminders", payload);
        setReminders(prev => [data, ...prev]);
      }
      setForm(blankForm);
      setMsg({ text: editing ? "Rappel mis à jour." : "Rappel créé.", type: "success" });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Erreur.", type: "error" });
    }
  };

  const startEdit = r => {
    setEditing(r._id);
    setForm({
      label: r.label,
      repeatType: r.repeatType,
      days: r.days || [],
      time: r.time || "08:00",
      date: toDatetimeLocal(r.date)
    });
    setMsg({ text: "", type: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditing(null); setForm(blankForm); setMsg({ text: "", type: "" }); };

  const toggle = async id => {
    const { data } = await api.patch(`/reminders/${id}/toggle`);
    setReminders(prev => prev.map(r => r._id === id ? data : r));
  };

  const del = async id => {
    if (!window.confirm("Supprimer ce rappel ?")) return;
    await api.delete(`/reminders/${id}`);
    setReminders(prev => prev.filter(r => r._id !== id));
  };

  const repeatLabel = r => {
    if (r.repeatType === "once") return `Une fois — ${r.date ? new Date(r.date).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}`;
    if (r.repeatType === "daily") return `Chaque jour à ${r.time}`;
    if (r.repeatType === "weekly") return `${(r.days || []).map(d => DAY_NAMES[d]).join(", ")} à ${r.time}`;
    return "";
  };

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <h1 className="page-title">⏰ Mes Rappels</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <div className="card">
          <h2 className="text-lg font-semibold text-brand-700 mb-4">
            {editing ? "Modifier le rappel" : "Créer un rappel"}
          </h2>

          {msg.text && (
            <div className={`rounded-lg px-3 py-2 mb-4 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intitulé *</label>
              <input className="input" placeholder="Ex. Prendre médicament" value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Répétition *</label>
              <select className="input" value={form.repeatType}
                onChange={e => setForm({ ...form, repeatType: e.target.value, days: [] })}>
                <option value="once">Une fois (date précise)</option>
                <option value="daily">Chaque jour</option>
                <option value="weekly">Certains jours de la semaine</option>
              </select>
            </div>

            {form.repeatType === "once" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure *</label>
                <input type="datetime-local" className="input" value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
            )}

            {(form.repeatType === "daily" || form.repeatType === "weekly") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
                <input type="time" className="input" value={form.time}
                  onChange={e => setForm({ ...form, time: e.target.value })} required />
              </div>
            )}

            {form.repeatType === "weekly" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jours *</label>
                <div className="flex flex-wrap gap-2">
                  {DAY_NAMES.map((name, i) => (
                    <button type="button" key={i}
                      onClick={() => toggleDay(i)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition ${form.days.includes(i) ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"}`}>
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1">
                {editing ? "Enregistrer" : "Créer"}
              </button>
              {editing && (
                <button type="button" className="btn-secondary flex-1" onClick={cancelEdit}>
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── List ─────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          {reminders.length === 0 ? (
            <div className="card text-center text-gray-700 py-12">
              <p className="text-4xl mb-3">⏰</p>
              <p>Aucun rappel configuré.</p>
            </div>
          ) : reminders.map(r => (
            <div key={r._id} className={`card py-4 ${!r.active ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{r.label}</p>
                  <p className="text-sm text-gray-700 mt-0.5">{repeatLabel(r)}</p>
                  <span className={`inline-block mt-2 badge text-xs ${r.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-700"}`}>
                    {r.active ? "Actif" : "Désactivé"}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggle(r._id)}
                    className="btn-secondary btn-sm text-xs"
                    title={r.active ? "Désactiver" : "Activer"}>
                    {r.active ? "⏸" : "▶"}
                  </button>
                  <button onClick={() => startEdit(r)}
                    className="btn-secondary btn-sm text-xs" title="Modifier">
                    ✏️
                  </button>
                  <button onClick={() => del(r._id)}
                    className="text-red-400 hover:text-red-600 text-xl transition" title="Supprimer">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
