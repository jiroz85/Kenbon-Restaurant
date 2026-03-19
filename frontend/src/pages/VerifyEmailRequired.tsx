import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import "./VerifyEmailRequired.css";

interface LocationState {
  email: string;
  message: string;
}

export function VerifyEmailRequired() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [email, setEmail] = useState(state?.email || '');
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState(state?.message || 'Registration successful! Please check your email to verify your account.');

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
    <div className="verify-required-page">
      <div className="verify-required-card">
        <div className="verify-required-header">
          <div className="email-icon">📧</div>
          <h1 className="verify-required-title">Check Your Email</h1>
          <div className="kenbon-logo">Kenbon Restaurant</div>
        </div>

        <div className="verify-required-content">
          <div className="success-message">
            <p>{message}</p>
          </div>

          <div className="instructions">
            <h3>What's next?</h3>
            <ul>
              <li>Check your email inbox for a verification message</li>
              <li>Click the verification link in the email</li>
              <li>Return here to log in to your account</li>
            </ul>
          </div>

          <div className="resend-section">
            <p>Didn't receive the email?</p>
            <p className="resend-subtitle">Check your spam folder or request a new verification email:</p>
            
            <div className="email-input-group">
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
                disabled={resending || !email}
              >
                {resending ? 'Sending...' : 'Resend Email'}
              </button>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="login-button"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
            <button 
              className="back-button"
              onClick={() => navigate('/register')}
            >
              Back to Register
            </button>
          </div>
        </div>

        <div className="verify-required-footer">
          <Link to="/login" className="back-to-login">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
