// ManageContent — admin CRUD for medical articles and videos
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

export default function ManageContent() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ titre: "", contenu: "", type: "article", url: "" });
  const [msg, setMsg] = useState({ text: "", type: "" });

  const load = () => api.get("/content").then(({ data }) => setContent(data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    if (!form.titre) return setMsg({ text: "Le titre est obligatoire.", type: "error" });
    if (form.type === "article" && !form.contenu) return setMsg({ text: "Le contenu est obligatoire pour un article.", type: "error" });
    if (form.type === "video" && !form.url) return setMsg({ text: "L'URL est obligatoire pour une vidéo.", type: "error" });
    try {
      await api.post("/content", form);
      setMsg({ text: "Contenu publié avec succès.", type: "success" });
      setForm({ titre: "", contenu: "", type: "article", url: "" });
      load();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Erreur.", type: "error" });
    }
  };

  const handleDelete = async id => {
    if (!window.confirm("Supprimer ce contenu ?")) return;
    await api.delete(`/content/${id}`);
    setContent(prev => prev.filter(c => c._id !== id));
  };

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <h1 className="page-title">📚 Contenu médical</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-brand-700 mb-4">Ajouter du contenu</h2>

          {msg.text && (
            <div className={`rounded-lg px-3 py-2 mb-4 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <div className="flex gap-2">
                {["article", "video"].map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${form.type === t ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"}`}>
                    {t === "article" ? "📄 Article" : "🎬 Vidéo"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input className="input" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} />
            </div>
            {form.type === "article" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenu *</label>
                <textarea className="input resize-none" rows={5} value={form.contenu} onChange={e => setForm({ ...form, contenu: e.target.value })} />
              </div>
            )}
            {form.type === "video" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de la vidéo *</label>
                <input type="url" className="input" placeholder="https://..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
              </div>
            )}
            <button className="btn-primary w-full">Publier</button>
          </form>
        </div>

        {/* Content grid */}
        <div className="lg:col-span-2 space-y-3">
          {content.length === 0 ? (
            <div className="card text-center text-gray-500 py-12">
              <p className="text-4xl mb-3">📭</p>
              <p>Aucun contenu publié.</p>
            </div>
          ) : content.map(c => (
            <div key={c._id} className="card flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{c.type === "video" ? "🎬" : "📄"}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge text-xs ${c.type === "video" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                      {c.type === "video" ? "Vidéo" : "Article"}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-800">{c.titre}</p>
                  {c.contenu && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{c.contenu}</p>}
                  {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline mt-1 block">Voir la vidéo →</a>}
                </div>
              </div>
              <button onClick={() => handleDelete(c._id)} className="text-red-400 hover:text-red-600 text-xl flex-shrink-0">🗑️</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
