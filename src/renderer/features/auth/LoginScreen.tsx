import { useState } from "react";

interface LoginScreenProps {
  onLogin(email: string, password: string): Promise<void>;
  error: string | null;
  loading: boolean;
}

export const LoginScreen = ({ onLogin, error, loading }: LoginScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && email && password) {
      void onLogin(email, password);
    }
  };

  return (
    <section className="login-screen">
      <div className="oyna-backdrop" aria-hidden="true" />
      <div className="login-screen__card">
        <div className="login-screen__brand">
          <p className="oyna-brand__kicker">OYNA</p>
          <h1>Game Station</h1>
          <p className="login-screen__subtitle">Sign in to your account</p>
        </div>

        <form className="login-screen__form" onSubmit={handleSubmit} noValidate>
          <div className="login-screen__field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="login-screen__field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="login-screen__error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-button login-screen__submit"
            disabled={loading || !email || !password}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </section>
  );
};
