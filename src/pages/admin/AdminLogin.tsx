import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UtensilsCrossed, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminLogin() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(form.email, form.password);
        if (error) throw new Error(error);
        navigate('/admin');
      } else {
        if (!form.fullName.trim()) {
          setError('Veuillez saisir votre nom complet.');
          setLoading(false);
          return;
        }
        const { error } = await signUp(form.email, form.password, form.fullName);
        if (error) throw new Error(error);
        navigate('/admin');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Le Baoulé Gourmand</h1>
          <p className="text-secondary-500 text-sm mt-1">Espace administrateur</p>
        </div>

        <div className="bg-secondary-900 rounded-2xl p-6 border border-secondary-800">
          <div className="flex gap-2 mb-6 p-1 bg-secondary-800 rounded-lg">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'login' ? 'bg-primary-600 text-white' : 'text-secondary-400'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'signup' ? 'bg-primary-600 text-white' : 'text-secondary-400'
              }`}
            >
              Créer un compte
            </button>
          </div>

          {error && (
            <div className="bg-error-500/10 border border-error-500/30 text-error-400 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-1">Nom complet</label>
                <input
                  required
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-secondary-800 border border-secondary-700 text-white placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Jean Kaboré"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-secondary-300 mb-1">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-secondary-800 border border-secondary-700 text-white placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="admin@restaurant.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-300 mb-1">Mot de passe</label>
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-secondary-800 border border-secondary-700 text-white placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {mode === 'login' ? 'Se connecter' : 'Créer le compte'}
            </button>
          </form>

          {mode === 'signup' && (
            <p className="text-xs text-secondary-500 mt-4 text-center">
              Le premier compte créé devient automatiquement super administrateur.
            </p>
          )}
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-sm text-secondary-500 hover:text-primary-400 transition-colors">
            ← Retour au site
          </Link>
        </div>
      </div>
    </div>
  );
}
