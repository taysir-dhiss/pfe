// ManageNotifications — admin sends notifications to specific patients
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

export default function ManageNotifications() {
  const [patients, setPatients] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ patientId: "", message: "" });
  const [msg, setMsg] = useState({ text: "", type: "" });

  const load = async () => {
    const [pRes, nRes] = await Promise.all([api.get("/admin/patients"), api.get("/admin/notifications")]);
    setPatients(pRes.data);
    setNotifs(nRes.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    if (!form.patientId || !form.message) return setMsg({ text: "Patiente et message sont obligatoires.", type: "error" });
    try {
      await api.post("/admin/notifications", form);
      setMsg({ text: "Notification envoyée.", type: "success" });
      setForm({ patientId: "", message: "" });
      load();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Erreur.", type: "error" });
    }
  };

  const handleDelete = async id => {
    if (!window.confirm("Supprimer cette notification ?")) return;
    await api.delete(`/admin/notifications/${id}`);
    setNotifs(prev => prev.filter(n => n._id !== id));
  };

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <h1 className="page-title">🔔 Gestion des notifications</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-brand-700 mb-4">Envoyer une notification</h2>

          {msg.text && (
            <div className={`rounded-lg px-3 py-2 mb-4 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patiente *</label>
              <select className="input" value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} required>
                <option value="">Sélectionner une patiente...</option>
                {patients.map(p => <option key={p._id} value={p._id}>{p.nom} — {p.email}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea className="input resize-none" rows={4}
                placeholder="Votre message..."
                value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
            </div>
            <button className="btn-primary w-full">Envoyer</button>
          </form>
        </div>

        {/* Notifications list */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-sm text-gray-500 font-medium">{notifs.length} notification(s) envoyée(s)</p>

          {notifs.length === 0 ? (
            <div className="card text-center text-gray-400 py-12">
              <p className="text-4xl mb-3">📭</p>
              <p>Aucune notification envoyée.</p>
            </div>
          ) : notifs.map(n => (
            <div key={n._id} className="card flex items-start justify-between gap-4 py-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800 text-sm">{n.patientId?.nom || "—"}</span>
                  <span className="text-gray-400 text-xs">{n.patientId?.email}</span>
                  <span className={`badge text-xs ${n.statut === "lu" ? "bg-gray-100 text-gray-500" : "bg-brand-100 text-brand-600"}`}>
                    {n.statut === "lu" ? "Lu" : "Non lu"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.dateEnvoi).toLocaleString("fr-FR")}</p>
              </div>
              <button onClick={() => handleDelete(n._id)} className="text-red-400 hover:text-red-600 text-xl flex-shrink-0">🗑️</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
