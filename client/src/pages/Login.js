// Page de connexion — formulaire d'authentification commun pour admins et patientes
// Redirige vers /admin ou /dashboard selon le rôle retourné par l'API
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Login() {
  const { login } = useAuth();   // Fonction de connexion du contexte (stocke user + token)
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", motDePasse: "" }); // État du formulaire
  const [error, setError] = useState("");    // Message d'erreur à afficher
  const [loading, setLoading] = useState(false); // Indicateur de chargement pendant la requête

  // Met à jour dynamiquement le champ concerné dans l'état du formulaire
  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.motDePasse) return setError("Tous les champs sont obligatoires.");
    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", form);
      // Stocke les informations utilisateur et le token JWT dans le contexte et localStorage
      login({ id: data.id, nom: data.nom, role: data.role }, data.token);
      // Redirige vers le tableau de bord approprié selon le rôle
      navigate(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12 text-white hero-banner" style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/images/Rose.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 15%',
      }}>
        {/* Floating orbs */}
        <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-purple-900/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-400/10 blur-3xl" />

        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative z-10 w-full max-w-sm text-center">
          {/* SVG Ribbon Illustration */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Glow behind ribbon */}
              <div className="absolute inset-0 rounded-full bg-white/20 blur-2xl scale-150" />
              <svg viewBox="0 0 120 140" className="w-32 h-40 relative drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Upper left petal */}
                <path d="M60 22 C38 22 20 36 20 52 C20 68 36 74 60 63" fill="rgba(255,255,255,0.85)" />
                {/* Upper right petal */}
                <path d="M60 22 C82 22 100 36 100 52 C100 68 84 74 60 63" fill="rgba(255,255,255,0.70)" />
                {/* Center shine */}
                <ellipse cx="60" cy="52" rx="8" ry="12" fill="rgba(255,255,255,0.4)" />
                {/* Left tail */}
                <path d="M60 63 C44 73 36 92 42 108 C47 120 60 124 60 124" fill="rgba(255,255,255,0.75)" />
                {/* Right tail */}
                <path d="M60 63 C76 73 84 92 78 108 C73 120 60 124 60 124" fill="rgba(255,255,255,0.60)" />
                {/* Highlight dot */}
                <circle cx="44" cy="38" r="4" fill="rgba(255,255,255,0.5)" />
                <circle cx="76" cy="34" r="2.5" fill="rgba(255,255,255,0.4)" />
              </svg>
            </div>
          </div>

          <h1 className="font-display text-4xl font-bold mb-2 tracking-tight">CancerCare TN</h1>
          <p className="text-white/80 text-base leading-relaxed mb-2">
            Votre espace de soins personnalisé,
          </p>
          <p className="text-white/90 font-display text-xl italic mb-10">
            avec vous à chaque étape.
          </p>

          {/* Feature chips */}
          <div className="grid grid-cols-1 gap-3 text-left">
            {[
              { icon: "💊", title: "Rappels médicaux", desc: "Alarmes personnalisées pour vos traitements" },
              { icon: "📅", title: "Rendez-vous",      desc: "Suivez vos consultations et recevez des rappels" },
              { icon: "📚", title: "Ressources",        desc: "Articles et guides médicaux validés" },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-3 bg-white/12 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/15">
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-white/65 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 bg-brand-50">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-5xl mb-2">🎗️</div>
            <h1 className="font-display text-3xl font-bold text-brand-700">CancerCare</h1>
          </div>

          <div className="glass p-8">
            <h2 className="font-display text-2xl font-bold text-gray-800 mb-1">Bon retour 👋</h2>
            <p className="text-gray-700 text-sm mb-7">Connectez-vous à votre espace santé</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Adresse e-mail</label>
                <input name="email" type="email" className="input" placeholder="exemple@email.com"
                  value={form.email} onChange={onChange} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Mot de passe</label>
                <input name="motDePasse" type="password" className="input" placeholder="••••••••"
                  value={form.motDePasse} onChange={onChange} required />
              </div>
              <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Connexion…
                  </span>
                ) : "Se connecter"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-700 mt-6">
              Pas de compte ?{" "}
              <Link to="/register" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
