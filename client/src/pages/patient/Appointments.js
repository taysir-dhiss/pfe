// Appointments — schedule and view patient appointments
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

const STATUS = {
  pending:   { label: "En attente", cls: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmé",   cls: "bg-green-100 text-green-700"  },
  cancelled: { label: "Annulé",     cls: "bg-gray-100 text-gray-500"    },
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: "", medecin: "", type: "Consultation" });
  const [msg, setMsg] = useState({ text: "", type: "" });

  const load = () => api.get("/appointments").then(({ data }) => setAppointments(data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    if (!form.date || !form.medecin) return setMsg({ text: "Date et médecin sont obligatoires.", type: "error" });
    try {
      await api.post("/appointments", form);
      setMsg({ text: "Rendez-vous planifié. Un e-mail de confirmation vous sera envoyé.", type: "success" });
      setForm({ date: "", medecin: "", type: "Consultation" });
      load();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Erreur.", type: "error" });
    }
  };

  const handleDelete = async id => {
    if (!window.confirm("Annuler ce rendez-vous ?")) return;
    await api.delete(`/appointments/${id}`);
    setAppointments(prev => prev.filter(a => a._id !== id));
  };

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <h1 className="page-title">📅 Mes Rendez-vous</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-brand-700 mb-4">Planifier un rendez-vous</h2>

          {msg.text && (
            <div className={`rounded-lg px-3 py-2 mb-4 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure *</label>
              <input type="datetime-local" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Médecin *</label>
              <input className="input" placeholder="Dr. Nom Prénom" value={form.medecin} onChange={e => setForm({ ...form, medecin: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de consultation</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option>Consultation</option>
                <option>Traitement</option>
                <option>Suivi</option>
                <option>Urgence</option>
              </select>
            </div>
            <button className="btn-primary w-full">Planifier</button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          {appointments.length === 0 ? (
            <div className="card text-center text-gray-500 py-12">
              <p className="text-4xl mb-3">📆</p>
              <p>Aucun rendez-vous planifié.</p>
            </div>
          ) : appointments.map(a => (
            <div key={a._id} className="card flex items-center justify-between py-4">
              <div>
                <p className="font-semibold text-gray-800">{a.type} <span className="font-normal text-gray-500">avec</span> {a.medecin}</p>
                <p className="text-sm text-gray-500 mt-0.5">{new Date(a.date).toLocaleString("fr-FR")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${(STATUS[a.status] || STATUS.pending).cls} px-3 py-1`}>
                  {(STATUS[a.status] || STATUS.pending).label}
                </span>
                {a.status === "pending" && (
                  <button onClick={() => handleDelete(a._id)} className="text-red-400 hover:text-red-600 text-xl">🗑️</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
