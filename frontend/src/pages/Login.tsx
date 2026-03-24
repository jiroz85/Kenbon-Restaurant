import { useState, useEffect, useRef } from "react";
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
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationMessageEndTime, setVerificationMessageEndTime] = useState<
    number | null
  >(null);

  const navigate = useNavigate();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? "/dashboard";

  // Effect to handle 5-minute verification message timer
  useEffect(() => {
    if (verificationMessageEndTime) {
      const checkTime = () => {
        const now = Date.now();
        if (now >= verificationMessageEndTime) {
          setShowVerificationMessage(false);
          setVerificationMessageEndTime(null);
        }
      };

      const interval = setInterval(checkTime, 1000);
      checkTime(); // Check immediately

      return () => clearInterval(interval);
    }
  }, [verificationMessageEndTime]);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log("State changed:", {
      usernameOrEmail,
      hasPassword: !!password,
      error,
      submitting,
    });
  }, [usernameOrEmail, password, error, submitting]);

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
    console.log("Form submitted - preventing page refresh");
    console.log("Form submitted - BEFORE:", {
      usernameOrEmail,
      hasPassword: !!password,
    });
    setError(null);
    setSubmitting(true);

    try {
      await login(usernameOrEmail.trim(), password);
    } catch (err: unknown) {
      console.log("Login error occurred - preserving form values");

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

      if (
        backendMsg
          ?.toLowerCase()
          .includes("verify your email before logging in")
      ) {
        setError(backendMsg || "Please verify your email before logging in.");
        // Show verification message for 5 minutes
        setShowVerificationMessage(true);
        setVerificationMessageEndTime(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      } else if (
        status === 401 ||
        backendMsg?.toLowerCase().includes("credential")
      )
        setError(backendMsg || "Invalid username, email or password.");
      else if (!ax?.response)
        setError(
          "Cannot reach server. Is the backend running? Check the URL in .env (VITE_API_URL).",
        );
      else if (status && status >= 500)
        setError(backendMsg || "Server error. Try again later.");
      else setError(backendMsg || "Login failed. Please try again.");

      // Explicitly preserve form values after error
      console.log("Error handled - form values preserved:", {
        usernameOrEmail,
        hasPassword: !!password,
      });
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
              onFocus={(e) => e.target.select()}
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
              onFocus={(e) => e.target.select()}
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          {showVerificationMessage && (
            <div className="verification-notice">
              <p>
                📧 Please check your email and verify your account to continue.
              </p>
              <p className="verification-timer">
                This message will disappear in 5 minutes.
              </p>
              <div className="verification-actions">
                <Link
                  to="/verify-email-required"
                  state={{ email: usernameOrEmail }}
                  className="resend-link"
                >
                  Resend verification email
                </Link>
                <button
                  onClick={() => setShowVerificationMessage(false)}
                  className="dismiss-button"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          <button type="submit" className="login-submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
          <p className="login-footer">
            Don&apos;t have an account? <Link to="/register">Register</Link>
          </p>
        </form>
        <div className="login-back-home">
          <Link to="/" className="back-home-btn">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
