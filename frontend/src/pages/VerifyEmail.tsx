import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import "./VerifyEmail.css";

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please request a new verification email.');
      return;
    }

    verifyEmailToken(token);
  }, [token]);

  const verifyEmailToken = async (token: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-email?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully! You can now log in.');
      } else {
        if (data.message?.includes('expired')) {
          setStatus('expired');
          setMessage(data.message || 'Verification link has expired.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Invalid verification link.');
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage('Unable to verify email. Please try again later.');
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setMessage('Please enter your email address.');
      return;
    }

    setResending(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Verification email sent! Please check your inbox.');
        setStatus('loading');
      } else {
        setMessage(data.message || 'Failed to resend verification email.');
      }
    } catch (error) {
      setMessage('Unable to resend email. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-email-page">
      <div className="verify-email-card">
        <div className="verify-email-header">
          <h1 className="verify-email-title">Email Verification</h1>
          <div className="kenbon-logo">Kenbon Restaurant</div>
        </div>

        <div className="verify-email-content">
          {status === 'loading' && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="success-state">
              <div className="success-icon">✓</div>
              <h2>Email Verified!</h2>
              <p>{message}</p>
              <button 
                className="login-button"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="error-state">
              <div className="error-icon">✗</div>
              <h2>Verification Failed</h2>
              <p>{message}</p>
              <div className="resend-section">
                <p>Need a new verification email?</p>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="email-input"
                />
                <button
                  className="resend-button"
                  onClick={handleResendEmail}
                  disabled={resending}
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>
            </div>
          )}

          {status === 'expired' && (
            <div className="expired-state">
              <div className="expired-icon">⏰</div>
              <h2>Link Expired</h2>
              <p>{message}</p>
              <div className="resend-section">
                <p>Request a new verification email:</p>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="email-input"
                />
                <button
                  className="resend-button"
                  onClick={handleResendEmail}
                  disabled={resending}
                >
                  {resending ? 'Sending...' : 'Request New Email'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="verify-email-footer">
          <Link to="/login" className="back-to-login">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
