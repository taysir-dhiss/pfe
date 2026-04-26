// MedicalContent — patient view of medical articles and videos as cards
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

export default function MedicalContent() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const url = filter === "all" ? "/content" : `/content?type=${filter}`;
    setLoading(true);
    api.get(url).then(({ data }) => setContent(data)).finally(() => setLoading(false));
  }, [filter]);

  const filtered = content; // already filtered by backend query param

  return (
    <div className="page">
      <h1 className="page-title">📚 Contenu médical</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "all",     label: "Tout" },
          { key: "article", label: "📄 Articles" },
          { key: "video",   label: "🎬 Vidéos" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
              filter === key
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="card text-center text-gray-500 py-16">
          <p className="text-5xl mb-3">📭</p>
          <p>Aucun contenu disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(c => (
            <div key={c._id} className="card flex flex-col hover:shadow-md transition">
              {/* Type badge */}
              <div className="flex items-center justify-between mb-3">
                <span className={`badge text-xs font-semibold ${c.type === "video" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                  {c.type === "video" ? "🎬 Vidéo" : "📄 Article"}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-800 text-base mb-2 line-clamp-2">{c.titre}</h3>

              {/* Description */}
              {c.contenu && (
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1 mb-4">
                  {c.contenu}
                </p>
              )}
              {!c.contenu && <div className="flex-1" />}

              {/* Action button */}
              {c.url ? (
                <a href={c.url} target="_blank" rel="noreferrer"
                  className="btn-primary text-center text-sm mt-auto">
                  {c.type === "video" ? "▶ Regarder" : "🔗 Lire l'article"}
                </a>
              ) : (
                <div className="mt-auto">
                  <span className="inline-block w-full text-center text-sm text-gray-400 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    Aucun lien disponible
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
