// Symptoms — declare and track patient symptoms
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

const TYPES = ["Douleur", "Fatigue", "Nausée", "Vomissement", "Essoufflement", "Insomnie", "Perte d'appétit", "Autre"];

const intensiteColor = n =>
  n >= 8 ? "bg-red-100 text-red-700"
  : n >= 5 ? "bg-yellow-100 text-yellow-700"
  : "bg-green-100 text-green-700";

export default function Symptoms() {
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: TYPES[0], intensite: 5 });
  const [msg, setMsg] = useState({ text: "", type: "" });

  const load = () => api.get("/symptoms").then(({ data }) => setSymptoms(data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    try {
      await api.post("/symptoms", form);
      setMsg({ text: "Symptôme ajouté avec succès.", type: "success" });
      setForm({ type: TYPES[0], intensite: 5 });
      load();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Erreur.", type: "error" });
    }
  };

  const handleDelete = async id => {
    if (!window.confirm("Supprimer ce symptôme ?")) return;
    await api.delete(`/symptoms/${id}`);
    setSymptoms(prev => prev.filter(s => s._id !== id));
  };

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <h1 className="page-title">🌡️ Mes Symptômes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-brand-700 mb-4">Déclarer un symptôme</h2>

          {msg.text && (
            <div className={`rounded-lg px-3 py-2 mb-4 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intensité : <span className="text-brand-600 font-bold">{form.intensite}/10</span>
              </label>
              <input type="range" min={1} max={10} value={form.intensite}
                className="w-full accent-brand-600"
                onChange={e => setForm({ ...form, intensite: +e.target.value })} />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Faible</span><span>Modérée</span><span>Sévère</span>
              </div>
            </div>
            <button className="btn-primary w-full">Ajouter</button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          {symptoms.length === 0 ? (
            <div className="card text-center text-gray-500 py-12">
              <p className="text-4xl mb-3">🩺</p>
              <p>Aucun symptôme enregistré.</p>
            </div>
          ) : symptoms.map(s => (
            <div key={s._id} className="card flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <span className={`badge ${intensiteColor(s.intensite)} text-sm font-bold px-3 py-1.5`}>
                  {s.intensite}/10
                </span>
                <div>
                  <p className="font-semibold text-gray-800">{s.type}</p>
                  <p className="text-xs text-gray-400">{new Date(s.dateDeclaration).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(s._id)}
                className="text-red-400 hover:text-red-600 transition text-xl" title="Supprimer">
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
