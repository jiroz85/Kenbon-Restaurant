import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./Register.css";

export function Register() {
  const { isAuthenticated, isLoading, register: doRegister } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="register-page">
        <p>Loading…</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await doRegister(email.trim(), username.trim(), password);
      navigate("/dashboard", { replace: true });
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
      const data = ax?.response?.data;
      const msg = data?.message;
      const backendMsg = Array.isArray(msg)
        ? msg[0]
        : typeof msg === "string"
          ? msg
          : null;

      if (ax?.response?.status === 409)
        setError(
          backendMsg ||
            "An account with this email or username already exists.",
        );
      else if (!ax?.response)
        setError("Cannot reach server. Is the backend running?");
      else setError(backendMsg || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h1 className="register-title">Create account</h1>
        <p className="register-subtitle">Kenbon Restaurant</p>

        <form onSubmit={handleSubmit} className="register-form">
          <label className="register-label">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="register-input"
              required
            />
          </label>
          <label className="register-label">
            Username
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="register-input"
              required
            />
          </label>
          <label className="register-label">
            Password (min 6 characters)
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="register-input"
              required
              minLength={6}
            />
          </label>
          <label className="register-label">
            Confirm password
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="register-input"
              required
            />
          </label>
          {error && <p className="register-error">{error}</p>}
          <button
            type="submit"
            className="register-submit"
            disabled={submitting}
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="register-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
