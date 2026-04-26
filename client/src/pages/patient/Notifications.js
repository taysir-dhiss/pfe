// Notifications page
// Tab 1 — active alerts (in-memory, click to dismiss)
// Tab 2 — custom alarms (DB-persisted, managed via CRUD)
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";
import { useNotifications } from "../../context/NotificationContext";

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const blankForm = { label: "", repeatType: "daily", days: [], time: "08:00", date: "" };

const toLocal = d => {
  if (!d) return "";
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
};

const fmtDate = iso =>
  new Date(iso).toLocaleString("fr-FR", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });

export default function Notifications() {
  const [tab, setTab] = useState("alerts");
  const { notifications, unread, dismiss, dismissAll } = useNotifications();

  const [alarms, setAlarms]     = useState([]);
  const [loadingA, setLoadingA] = useState(true);
  const [form, setForm]         = useState(blankForm);
  const [editing, setEditing]   = useState(null);
  const [msg, setMsg]           = useState({ text: "", type: "" });

  const loadAlarms = () =>
    api.get("/reminders")
      .then(({ data }) => setAlarms(data))
      .catch(() => {})
      .finally(() => setLoadingA(false));

  useEffect(() => { loadAlarms(); }, []);

  const toggleDay = d =>
    setForm(p => ({ ...p, days: p.days.includes(d) ? p.days.filter(x => x !== d) : [...p.days, d] }));

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    try {
      const payload = {
        label:      form.label,
        repeatType: form.repeatType,
        days:       form.repeatType === "weekly" ? form.days : [],
        time:       form.repeatType !== "once"   ? form.time : undefined,
        date:       form.repeatType === "once"   ? form.date : undefined,
      };
      if (editing) {
        const { data } = await api.put(`/reminders/${editing}`, payload);
        setAlarms(p => p.map(r => r._id === editing ? data : r));
        setEditing(null);
      } else {
        const { data } = await api.post("/reminders", payload);
        setAlarms(p => [data, ...p]);
      }
      setForm(blankForm);
      setMsg({ text: editing ? "Alarme mise à jour." : "Alarme créée.", type: "ok" });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Erreur.", type: "err" });
    }
  };

  const startEdit = r => {
    setEditing(r._id);
    setForm({ label: r.label, repeatType: r.repeatType, days: r.days || [], time: r.time || "08:00", date: toLocal(r.date) });
    setMsg({ text: "", type: "" });
  };

  const cancelEdit = () => { setEditing(null); setForm(blankForm); };

  const toggleAlarm = async id => {
    try {
      const { data } = await api.patch(`/reminders/${id}/toggle`);
      setAlarms(p => p.map(r => r._id === id ? data : r));
    } catch { /* silent */ }
  };

  const delAlarm = async id => {
    if (!window.confirm("Supprimer cette alarme ?")) return;
    try {
      await api.delete(`/reminders/${id}`);
      setAlarms(p => p.filter(r => r._id !== id));
    } catch { /* silent */ }
  };

  const repeatLabel = r => {
    if (r.repeatType === "once")   return `Une fois — ${r.date ? new Date(r.date).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}`;
    if (r.repeatType === "daily")  return `Chaque jour à ${r.time}`;
    if (r.repeatType === "weekly") return `${(r.days || []).map(d => DAY_NAMES[d]).join(", ")} à ${r.time}`;
    return "";
  };

  return (
    <div className="page">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800 leading-none">Notifications</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {unread > 0 ? `${unread} alerte${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}` : "Tout est à jour"}
            </p>
          </div>
        </div>
        {tab === "alerts" && notifications.length > 0 && (
          <button onClick={dismissAll}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 font-medium transition-colors px-3 py-1.5 rounded-xl hover:bg-red-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Tout effacer
          </button>
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6 w-fit">
        {[
          { id: "alerts", label: "Alertes", icon: "🔔", badge: unread },
          { id: "alarms", label: "Mes alarmes", icon: "⏰", badge: 0 },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === t.id
                ? "bg-white text-brand-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            <span>{t.icon}</span>
            {t.label}
            {t.badge > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-badge-pop">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Alerts ───────────────────────────────────────────────── */}
      {tab === "alerts" && (
        <div className="animate-fade-in">
          {notifications.length === 0 ? (
            <div className="card text-center py-20">
              <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="font-semibold text-gray-600 mb-1">Aucune alerte active</p>
              <p className="text-sm text-gray-400">Vous recevrez ici les rappels de rendez-vous et d'alarmes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 mb-1 pl-1">
                Cliquer sur une alerte la marque comme lue et la supprime.
              </p>
              {notifications.map((n, i) => (
                <button
                  key={n.id}
                  onClick={() => dismiss(n.id)}
                  className="w-full text-left animate-fade-in group"
                  style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-start gap-4 hover:border-brand-200 hover:shadow-card transition-all duration-200">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm ${
                      n.type === "alarm"
                        ? "bg-purple-50 text-purple-500"
                        : "bg-brand-50 text-brand-500"
                    }`}>
                      {n.type === "alarm" ? "💊" : "📅"}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          n.type === "alarm" ? "bg-purple-50 text-purple-600" : "bg-brand-50 text-brand-600"
                        }`}>
                          {n.type === "alarm" ? "Alarme" : "Rendez-vous"}
                        </span>
                        <span className="text-xs text-gray-400">{fmtDate(n.triggerTime)}</span>
                      </div>
                    </div>
                    {/* Dismiss hint */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-400 group-hover:bg-gray-300 transition-colors" />
                      <span className="text-[10px] text-gray-300 group-hover:text-red-400 transition-colors font-medium">Marquer lu</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Alarm management ─────────────────────────────────────── */}
      {tab === "alarms" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">

          {/* Form */}
          <div className="card">
            <h2 className="font-display text-lg font-bold text-gray-800 mb-4">
              {editing ? "✏️ Modifier l'alarme" : "➕ Nouvelle alarme"}
            </h2>

            {msg.text && (
              <div className={`rounded-xl px-4 py-2.5 mb-4 text-sm border animate-fade-in ${
                msg.type === "ok" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
              }`}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Intitulé *</label>
                <input className="input" placeholder="Ex. Prendre médicament" value={form.label}
                  onChange={e => setForm({ ...form, label: e.target.value })} required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Répétition *</label>
                <select className="input" value={form.repeatType}
                  onChange={e => setForm({ ...form, repeatType: e.target.value, days: [] })}>
                  <option value="once">Une fois (date précise)</option>
                  <option value="daily">Chaque jour</option>
                  <option value="weekly">Certains jours</option>
                </select>
              </div>

              {form.repeatType === "once" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date et heure *</label>
                  <input type="datetime-local" className="input" value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
              )}

              {form.repeatType !== "once" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Heure *</label>
                  <input type="time" className="input" value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })} required />
                </div>
              )}

              {form.repeatType === "weekly" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Jours *</label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_NAMES.map((name, i) => (
                      <button type="button" key={i} onClick={() => toggleDay(i)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                          form.days.includes(i)
                            ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                            : "bg-white text-gray-500 border-gray-200 hover:border-brand-300 hover:text-brand-600"
                        }`}>
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary flex-1 text-sm">
                  {editing ? "Enregistrer" : "Créer l'alarme"}
                </button>
                {editing && (
                  <button type="button" className="btn-secondary flex-1 text-sm" onClick={cancelEdit}>
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Alarm list */}
          <div className="lg:col-span-2 space-y-3">
            {loadingA ? <Spinner /> : alarms.length === 0 ? (
              <div className="card text-center py-16">
                <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">⏰</span>
                </div>
                <p className="font-semibold text-gray-600 mb-1">Aucune alarme configurée</p>
                <p className="text-sm text-gray-400">Créez votre première alarme médicale à gauche.</p>
              </div>
            ) : alarms.map(r => (
              <div key={r._id}
                className={`bg-white border rounded-2xl px-5 py-4 transition-all duration-200 ${
                  r.active ? "border-gray-100 hover:border-brand-200 hover:shadow-card" : "border-gray-100 opacity-55"
                }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg mt-0.5 ${
                      r.active ? "bg-brand-50" : "bg-gray-100"
                    }`}>
                      💊
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{r.label}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{repeatLabel(r)}</p>
                      <span className={`inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${r.active ? "bg-green-500" : "bg-gray-300"}`} />
                        {r.active ? "Actif" : "Désactivé"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleAlarm(r._id)}
                      title={r.active ? "Désactiver" : "Activer"}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                        r.active
                          ? "border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                          : "border-green-200 text-green-600 hover:bg-green-50"
                      }`}>
                      {r.active ? "⏸ OFF" : "▶ ON"}
                    </button>
                    <button onClick={() => startEdit(r)}
                      className="p-2 rounded-xl text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition border border-transparent hover:border-brand-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => delAlarm(r._id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition border border-transparent hover:border-red-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
