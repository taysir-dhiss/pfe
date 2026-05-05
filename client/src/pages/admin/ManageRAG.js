// Page Gestion de la base RAG (admin) — upload, liste et suppression de documents PDF médicaux
// Les PDFs sont découpés en chunks, vectorisés via OpenAI et stockés en base MongoDB.
// Ces chunks sont ensuite utilisés pour enrichir les réponses du chatbot IA (Retrieval-Augmented Generation).
import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

// Modale de confirmation avant suppression d'un document indexé
function ConfirmModal({ fileName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 border border-red-100 mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3" />
          </svg>
        </div>

        <h3 className="text-base font-bold text-gray-800 text-center mb-1">Confirmer la suppression</h3>
        <p className="text-sm text-gray-700 text-center mb-1">
          Êtes-vous sûr de vouloir supprimer cet élément ?
        </p>
        <p className="text-xs text-gray-700 text-center truncate mb-6 px-2">« {fileName} »</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 bg-gray-50 hover:bg-gray-100 transition">
            Non, annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition">
            Oui, supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function DocRow({ doc, onDelete }) {
  const [deleting, setDeleting]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    setShowConfirm(false);
    try {
      await api.delete(`/rag/documents/${doc._id}`);
      onDelete(doc._id);
    } catch {
      alert("Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {showConfirm && (
        <ConfirmModal
          fileName={doc.sourceFile}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white transition">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{doc.sourceFile}</p>
            <p className="text-xs text-gray-700">
              {doc.chunkCount} chunks · {new Date(doc.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={deleting}
          className="flex-shrink-0 ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 border border-red-200 bg-white hover:bg-red-50 disabled:opacity-50 transition"
        >
          {deleting ? "..." : "Supprimer"}
        </button>
      </div>
    </>
  );
}

export default function ManageRAG() {
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile]       = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState("");
  const [msg, setMsg]         = useState({ text: "", type: "" });
  const fileRef               = useRef(null);

  const loadDocs = () =>
    api.get("/rag/documents")
      .then(({ data }) => setDocs(data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { loadDocs(); }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.type !== "application/pdf") {
      setMsg({ text: "Seuls les fichiers PDF sont acceptés.", type: "error" });
      return;
    }
    setFile(f || null);
    setMsg({ text: "", type: "" });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMsg({ text: "Sélectionnez un fichier PDF.", type: "error" });

    setUploading(true);
    setMsg({ text: "", type: "" });
    setProgress("Extraction du texte…");

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      setProgress("Génération des embeddings… (peut prendre 10–30 s selon la taille du PDF)");
      const { data } = await api.post("/rag/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      setMsg({
        text: `✅ "${data.sourceFile}" indexé — ${data.chunkCount} chunks · ${data.pages} page(s)`,
        type: "success",
      });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      loadDocs();
    } catch (err) {
      setMsg({
        text: err.response?.data?.message || "Erreur lors de l'indexation.",
        type: "error",
      });
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <h1 className="page-title">📖 Base de connaissances RAG</h1>
      <p className="text-sm text-gray-700 mb-6 -mt-2">
        Indexez des PDFs médicaux pour enrichir automatiquement les réponses du chatbot IA.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Upload form ─────────────────────────────────────────────────── */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-brand-700 mb-4">Indexer un PDF</h2>

          {msg.text && (
            <div className={`rounded-xl px-4 py-3 mb-4 text-sm border ${
              msg.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            {/* Drop zone */}
            <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer transition ${
              file ? "border-brand-400 bg-brand-50" : "border-gray-200 bg-gray-50 hover:border-brand-300 hover:bg-brand-50/40"
            }`}>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="text-center px-4">
                  <p className="text-sm font-semibold text-brand-600 truncate max-w-full">{file.name}</p>
                  <p className="text-xs text-gray-700 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm text-gray-700">Cliquez pour choisir un PDF</p>
                  <p className="text-xs text-gray-600 mt-0.5">Max 25 Mo</p>
                </div>
              )}
            </label>

            {uploading && progress && (
              <div className="flex items-center gap-2 text-xs text-brand-600 bg-brand-50 border border-brand-100 rounded-xl px-3 py-2.5">
                <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {progress}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Indexation en cours…" : "Indexer le document"}
            </button>
          </form>

          {/* Info box */}
          <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1.5">
            <p className="font-semibold">Comment ça fonctionne</p>
            <p>• Le texte est extrait du PDF et découpé en chunks de ~500 tokens.</p>
            <p>• Chaque chunk est converti en vecteur (embedding OpenAI).</p>
            <p>• Lors d'un message patiente, les chunks les plus similaires sont injectés dans le prompt du LLM.</p>
          </div>
        </div>

        {/* ── Documents list ───────────────────────────────────────────────── */}
        <div className="card lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-brand-700">Documents indexés</h2>
            <span className="text-xs font-bold bg-brand-100 text-brand-600 rounded-full px-2.5 py-1">
              {docs.length} document{docs.length !== 1 ? "s" : ""}
            </span>
          </div>

          {docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-sm text-gray-700">Aucun document indexé pour l'instant.</p>
              <p className="text-xs text-gray-600 mt-1">Importez votre premier PDF pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <DocRow
                  key={doc._id}
                  doc={doc}
                  onDelete={(id) => setDocs((prev) => prev.filter((d) => d._id !== id))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
