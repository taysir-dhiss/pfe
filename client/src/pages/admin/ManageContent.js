import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";
import { DocumentTextIcon, FilmIcon, InboxEmptyIcon, ExternalLinkIcon, TrashIcon } from "../../components/Icons";

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
    if (!form.contenu && !form.url) return setMsg({ text: "Un contenu ou un lien est obligatoire.", type: "error" });
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
      <h1 className="page-title">BibMed</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition flex items-center justify-center gap-1.5 ${form.type === t ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"}`}>
                    {t === "article"
                      ? <><DocumentTextIcon className="w-4 h-4" /> Article</>
                      : <><FilmIcon className="w-4 h-4" /> Vidéo</>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input className="input" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input resize-none" rows={3}
                placeholder="Brève description du contenu..."
                value={form.contenu} onChange={e => setForm({ ...form, contenu: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lien {form.type === "video" ? "(YouTube, etc.) *" : "(Google, article externe)"}
              </label>
              <input type="url" className="input" placeholder="https://..."
                value={form.url} onChange={e => setForm({ ...form, url: e.target.value }) } />
            </div>

            <button className="btn-primary w-full">Publier</button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-3">
          {content.length === 0 ? (
            <div className="card text-center text-gray-700 py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <InboxEmptyIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p>Aucun contenu publié.</p>
            </div>
          ) : content.map(c => (
            <div key={c._id} className="card flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100">
                  {c.type === "video"
                    ? <FilmIcon className="w-5 h-5 text-red-500" />
                    : <DocumentTextIcon className="w-5 h-5 text-blue-500" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`badge text-xs ${c.type === "video" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                      {c.type === "video" ? "Vidéo" : "Article"}
                    </span>
                    <span className="text-xs text-gray-700">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <p className="font-semibold text-gray-800 truncate">{c.titre}</p>
                  {c.contenu && <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">{c.contenu}</p>}
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline mt-1 truncate max-w-full">
                      <ExternalLinkIcon className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{c.url}</span>
                    </a>
                  )}
                </div>
              </div>
              <button onClick={() => handleDelete(c._id)}
                className="text-gray-400 hover:text-red-500 transition flex-shrink-0 p-1">
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
