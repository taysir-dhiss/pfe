import { useEffect, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";
import { DocumentTextIcon, FilmIcon, InboxEmptyIcon, ExternalLinkIcon, PlayIcon } from "../../components/Icons";

export default function MedicalContent() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");

  useEffect(() => {
    const url = filter === "all" ? "/content" : `/content?type=${filter}`;
    setLoading(true);
    api.get(url).then(({ data }) => setContent(data)).finally(() => setLoading(false));
  }, [filter]);

  const filtered = content;

  return (
    <div className="page">
      <h1 className="page-title">BibMed</h1>

      <div className="flex gap-2 mb-6">
        {[
          { key: "all",     label: "Tout",      Icon: null },
          { key: "article", label: "Articles",  Icon: DocumentTextIcon },
          { key: "video",   label: "Vidéos",    Icon: FilmIcon },
        ].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition ${
              filter === key
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
            }`}>
            {Icon && <Icon className="w-4 h-4" />}
            {label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="card text-center text-gray-700 py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <InboxEmptyIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p>Aucun contenu disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(c => (
            <div key={c._id} className="card flex flex-col hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className={`badge text-xs font-semibold flex items-center gap-1 ${c.type === "video" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                  {c.type === "video" ? <FilmIcon className="w-3 h-3" /> : <DocumentTextIcon className="w-3 h-3" />}
                  {c.type === "video" ? "Vidéo" : "Article"}
                </span>
                <span className="text-xs text-gray-700">
                  {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>

              <h3 className="font-semibold text-gray-800 text-base mb-2 line-clamp-2">{c.titre}</h3>

              {c.contenu && (
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 flex-1 mb-4">
                  {c.contenu}
                </p>
              )}
              {!c.contenu && <div className="flex-1" />}

              {c.url ? (
                <a href={c.url} target="_blank" rel="noreferrer"
                  className="btn-primary text-center text-sm mt-auto flex items-center justify-center gap-1.5">
                  {c.type === "video"
                    ? <><PlayIcon className="w-4 h-4" /> Regarder</>
                    : <><ExternalLinkIcon className="w-4 h-4" /> Lire l'article</>}
                </a>
              ) : (
                <div className="mt-auto">
                  <span className="inline-block w-full text-center text-sm text-gray-700 py-2 bg-gray-50 rounded-lg border border-gray-200">
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
