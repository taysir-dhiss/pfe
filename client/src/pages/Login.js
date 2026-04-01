// Login — authentication for Admin and Patient
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", motDePasse: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.motDePasse) return setError("Tous les champs sont obligatoires.");
    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", form);
      const user = { id: data.id, nom: data.nom, role: data.role };
      login(user, data.token);
      navigate(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎗️</div>
          <h1 className="text-3xl font-bold text-brand-700">CancerCare</h1>
          <p className="text-gray-500 mt-1">Votre espace de soins personnalisé</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-brand-700 mb-6">Connexion</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse e-mail</label>
              <input name="email" type="email" className="input" placeholder="exemple@email.com"
                value={form.email} onChange={onChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input name="motDePasse" type="password" className="input" placeholder="••••••••"
                value={form.motDePasse} onChange={onChange} required />
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Pas de compte ?{" "}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
