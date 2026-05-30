import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { CalendarIcon, BookOpenIcon, PillIcon } from "../components/Icons";

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
      login({ id: data.id, nom: data.nom, role: data.role }, data.token);
      navigate(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { Icon: PillIcon,     title: "Rappels médicaux", desc: "Alarmes personnalisées pour vos traitements" },
    { Icon: CalendarIcon, title: "Rendez-vous",      desc: "Suivez vos consultations et recevez des rappels" },
    { Icon: BookOpenIcon, title: "Ressources",        desc: "Articles et guides médicaux validés" },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12 text-white hero-banner" style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/images/Rose.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 15%',
      }}>
        <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-purple-900/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-400/10 blur-3xl" />

        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative z-10 w-full max-w-sm text-center">
          <h1 className="font-display text-4xl font-bold mb-2 tracking-tight">CancerCare</h1>
          <p className="text-white/80 text-base leading-relaxed mb-2">
            Votre espace de soins personnalisé,
          </p>
          <p className="text-white/90 font-display text-xl italic mb-10">
            avec vous à chaque étape.
          </p>

          <div className="grid grid-cols-1 gap-3 text-left">
            {features.map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 bg-white/12 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/15">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-white/65 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 bg-brand-50">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-2">
              <img src={`${process.env.PUBLIC_URL}/images/ribonTN.png`} alt="CancerCare" className="w-12 h-14 object-contain" />
            </div>
            <h1 className="font-display text-3xl font-bold text-brand-700">CancerCare</h1>
          </div>

          <div className="glass p-8">
            <h2 className="font-display text-2xl font-bold text-gray-800 mb-1">Bon retour</h2>
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
