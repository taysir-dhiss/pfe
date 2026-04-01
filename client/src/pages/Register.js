// Register — patient self-registration
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const STADES = ["", "Stade I", "Stade II", "Stade III", "Stade IV"];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: "", email: "", motDePasse: "", dateNaissance: "", stadeCancer: "", historiqueMedical: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    if (!form.nom || !form.email || !form.motDePasse) return setError("Nom, e-mail et mot de passe sont obligatoires.");
    if (form.motDePasse.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères.");
    try {
      setLoading(true);
      await api.post("/auth/register-patient", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎗️</div>
          <h1 className="text-3xl font-bold text-brand-700">CancerCare</h1>
          <p className="text-gray-500 mt-1">Créez votre compte patient</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-brand-700 mb-6">Inscription</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
              <input name="nom" className="input" placeholder="Marie Dupont" value={form.nom} onChange={onChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
              <input name="email" type="email" className="input" placeholder="marie@exemple.com" value={form.email} onChange={onChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe * <span className="text-gray-400 font-normal">(min. 6 caractères)</span></label>
              <input name="motDePasse" type="password" className="input" placeholder="••••••••" value={form.motDePasse} onChange={onChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
              <input name="dateNaissance" type="date" className="input" value={form.dateNaissance} onChange={onChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stade du cancer</label>
              <select name="stadeCancer" className="input" value={form.stadeCancer} onChange={onChange}>
                {STADES.map(s => <option key={s} value={s}>{s || "Non renseigné"}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Antécédents médicaux</label>
              <textarea name="historiqueMedical" className="input resize-none" rows={3}
                placeholder="Traitements précédents, allergies..."
                value={form.historiqueMedical} onChange={onChange} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Inscription en cours..." : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Déjà inscrite ?{" "}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
