// Recommendations — AI-generated recommendations, trigger analysis
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

const PRIORITY = {
  faible:  { label: "Faible",  cls: "bg-green-100 text-green-700",  bar: "bg-green-400"  },
  modere:  { label: "Modéré",  cls: "bg-blue-100 text-blue-700",    bar: "bg-blue-400"   },
  eleve:   { label: "Élevé",   cls: "bg-yellow-100 text-yellow-700", bar: "bg-yellow-400" },
  urgent:  { label: "URGENT",  cls: "bg-red-100 text-red-700",      bar: "bg-red-500"    },
};

export default function Recommendations() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const load = () => api.get("/recommendations").then(({ data }) => setRecs(data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleAnalyse = async () => {
    setAnalyzing(true);
    setMsg({ text: "", type: "" });
    try {
      const { data } = await api.post("/chat/analyser-symptomes");
      setMsg({ text: `${data.recommandations.length} recommandation(s) générée(s) par l'IA.`, type: "success" });
      load();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Erreur lors de l'analyse IA.", type: "error" });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="page-title mb-0">📋 Recommandations</h1>
        <button onClick={handleAnalyse} disabled={analyzing}
          className="btn-primary flex items-center gap-2">
          🤖 {analyzing ? "Analyse en cours..." : "Analyser mes symptômes (IA)"}
        </button>
      </div>

      {msg.text && (
        <div className={`rounded-lg px-4 py-3 mb-5 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {recs.length === 0 ? (
        <div className="card text-center text-gray-500 py-16">
          <p className="text-5xl mb-3">🧠</p>
          <p className="font-medium">Aucune recommandation disponible.</p>
          <p className="text-sm mt-1">Déclarez des symptômes puis cliquez sur "Analyser".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recs.map(r => {
            const p = PRIORITY[r.niveauPriorite] || PRIORITY.modere;
            return (
              <div key={r._id} className="card relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${p.bar}`} />
                <div className="pl-3">
                  <span className={`badge ${p.cls} mb-2`}>{p.label}</span>
                  <p className="text-gray-700 text-sm leading-relaxed">{r.contenu}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(r.dateGeneration).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
