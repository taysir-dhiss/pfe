// Page Créer un administrateur — formulaire de création d'un nouveau compte admin
// Accessible uniquement aux administrateurs connectés
import { useState } from "react";
import api from "../../api/axios";

export default function CreateAdmin() {
  const [form, setForm] = useState({ nom: "", email: "", motDePasse: "" }); // État du formulaire
  const [msg, setMsg] = useState({ text: "", type: "" });   // Message de retour (succès / erreur)
  const [loading, setLoading] = useState(false);

  // Met à jour le champ modifié dans l'état du formulaire
  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    if (form.motDePasse.length < 6) return setMsg({ text: "Le mot de passe doit contenir au moins 6 caractères.", type: "error" });
    try {
      setLoading(true);
      // Appelle la route d'inscription admin (utilise le même endpoint que l'inscription normale)
      await api.post("/auth/register-admin", form);
      setMsg({ text: `Compte admin "${form.nom}" créé avec succès.`, type: "success" });
      setForm({ nom: "", email: "", motDePasse: "" }); // Réinitialise le formulaire
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Erreur lors de la création.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">🛡️ Créer un compte administrateur</h1>

      <div className="max-w-md">
        <div className="card">
          {msg.text && (
            <div className={`rounded-lg px-4 py-3 mb-5 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
              <input name="nom" className="input" placeholder="Dr. Nom Prénom"
                value={form.nom} onChange={onChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse e-mail *</label>
              <input name="email" type="email" className="input" placeholder="admin@cancercare.com"
                value={form.email} onChange={onChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe * <span className="text-gray-700 font-normal">(min. 6 caractères)</span>
              </label>
              <input name="motDePasse" type="password" className="input" placeholder="••••••••"
                value={form.motDePasse} onChange={onChange} required />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-700 mb-3">
                ⚠️ Ce compte aura un accès complet au panneau d'administration.
              </p>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Création en cours..." : "Créer le compte"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
