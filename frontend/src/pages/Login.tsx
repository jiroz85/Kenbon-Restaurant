import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./Login.css";

export function Login() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const location = useLocation();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? "/dashboard";

  if (isLoading) {
    return (
      <div className="login-page">
        <p>Loading…</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(usernameOrEmail.trim(), password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const ax =
        err && typeof err === "object" && "response" in err
          ? (err as {
              response?: {
                status?: number;
                data?: { message?: string | string[] };
              };
            })
          : null;
      const status = ax?.response?.status;
      const data = ax?.response?.data;
      const msg = data?.message;
      const backendMsg = Array.isArray(msg)
        ? msg[0]
        : typeof msg === "string"
          ? msg
          : null;

      if (status === 401 || backendMsg?.toLowerCase().includes("credential"))
        setError(backendMsg || "Invalid username, email or password.");
      else if (!ax?.response)
        setError(
          "Cannot reach server. Is the backend running? Check the URL in .env (VITE_API_URL).",
        );
      else if (status && status >= 500)
        setError(backendMsg || "Server error. Try again later.");
      else setError(backendMsg || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Kenbon Restaurant</h1>
        <p className="login-subtitle">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            Username or email
            <input
              type="text"
              autoComplete="username"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="login-input"
              required
            />
          </label>
          <label className="login-label">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
          <p className="login-footer">
            Don&apos;t have an account? <Link to="/register">Register</Link>
          </p>
          <div className="login-back-home">
            <Link to="/" className="back-home-btn">
              ← Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
