import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './AuthModal.css';
import { checkEmail, register, login } from '../services/api';

const STEPS = {
  DECIDE:  'decide',
  VERIFY:  'verify',
  SETPASS: 'setpass',
  LOGIN:   'login',
};

const AuthModal = ({ prefillEmail = '', prefillName = '', onAuthSuccess, onClose }) => {
  const [step, setStep]         = useState(STEPS.DECIDE);
  const [email, setEmail]       = useState(prefillEmail);
  const [name, setName]         = useState(prefillName);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [role, setRole]         = useState('');
  const [company, setCompany]   = useState('');
  const [phone, setPhone]       = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // Step 1 — detect new vs returning user via API
  const handleDecide = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setLoading(true);
    try {
      const { exists } = await checkEmail(email);
      setLoading(false);
      setStep(exists ? STEPS.LOGIN : STEPS.VERIFY);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Could not reach server. Is it running?');
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    console.log('Google Auth Success:', credentialResponse);
    
    // Decode the JWT credential from Google to extract user info
    try {
      const token = credentialResponse.credential;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      
      onAuthSuccess({
        name: decoded.name || 'User',
        email: decoded.email || email || 'google@user.com',
        isGoogleUser: true
      });
    } catch (err) {
      console.error('Failed to decode Google credential:', err);
      setError('Failed to process Google authentication.');
    }
  };

  const handleGoogleError = () => {
    setError('Google authentication failed.');
  };

  // Step 2 — simulated email verification
  const handleVerify = (e) => {
    e.preventDefault();
    setStep(STEPS.SETPASS);
  };

  // Step 3 — set password & complete sign-up via API
  const handleSetPass = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    
    setLoading(true);
    try {
      const user = await register({ name: name || 'User', email, password, role, company, phone });
      setLoading(false);
      onAuthSuccess(user);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };



  // Login via API
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login({ email, password });
      setLoading(false);
      onAuthSuccess(user);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  // ── Step renderers ────────────────────────────────────────────────────────

  const renderDecide = () => (
    <div className="auth-form">
      <div className="auth-icon">✉️</div>
      <h2>Welcome to UnifySpace</h2>
      <p className="auth-sub">Enter your email to get started or log back in.</p>
      <form onSubmit={handleDecide} className="form-inner">
        <div className="field-group">
          <label>Email address</label>
          <input id="auth-email" type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com" required autoFocus />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="auth-btn primary" disabled={loading}>
          {loading ? 'Checking…' : 'Continue →'}
        </button>
      </form>
      
      <div className="auth-divider">
        <span>OR</span>
      </div>

      <div className="google-btn-wrapper">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="outline"
          shape="pill"
          text="continue_with"
          width="100%"
        />
      </div>
    </div>
  );

  const renderVerify = () => (
    <form onSubmit={handleVerify} className="auth-form">
      <div className="auth-icon">📬</div>
      <h2>Verify Your Email</h2>
      <p className="auth-sub">
        A verification link would be sent to <strong>{email}</strong>.<br />
        For this demo, click <em>Verify &amp; Continue</em>.
      </p>
      <div className="verify-badge">
        <span className="badge-dot" />{email}
      </div>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" className="auth-btn primary">Verify &amp; Continue ✓</button>
      <button type="button" className="auth-btn ghost" onClick={() => setStep(STEPS.DECIDE)}>← Back</button>
    </form>
  );

  const renderSetPass = () => (
    <form onSubmit={handleSetPass} className="auth-form">
      <div className="auth-icon">🔐</div>
      <h2>Set Your Password</h2>
      <p className="auth-sub">Choose a strong password for your account.</p>
      <div className="field-group">
        <label>Password</label>
        <input id="auth-password" type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Min. 6 characters" required autoFocus />
      </div>
      <div className="field-group">
        <label>Confirm password</label>
        <input id="auth-confirm" type="password" value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Re-enter password" required />
      </div>
      <div className="password-strength">
        {password.length === 0  && <span className="strength-empty">Enter a password</span>}
        {password.length > 0 && password.length < 6  && <span className="strength-weak">⚠ Weak</span>}
        {password.length >= 6 && password.length < 10 && <span className="strength-ok">✓ Good</span>}
        {password.length >= 10 && <span className="strength-strong">✦ Strong</span>}
      </div>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" className="auth-btn primary" disabled={loading}>
        {loading ? 'Creating account…' : 'Set Password & Create Account 🚀'}
      </button>
      <button type="button" className="auth-btn ghost" onClick={() => setStep(STEPS.VERIFY)}>← Back</button>
    </form>
  );


  const renderLogin = () => (
    <div className="auth-form">
      <div className="auth-icon">👋</div>
      <h2>Welcome Back!</h2>
      <p className="auth-sub">Logging in as <strong>{email}</strong></p>
      <form onSubmit={handleLogin} className="form-inner">
        <div className="field-group">
          <label>Password</label>
          <input id="login-password" type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Your password" required autoFocus />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="auth-btn primary" disabled={loading}>
          {loading ? 'Logging in…' : 'Log In →'}
        </button>
      </form>

      <div className="auth-divider">
        <span>OR</span>
      </div>

      <div className="google-btn-wrapper">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="outline"
          shape="pill"
          width="100%"
        />
      </div>

      <button type="button" className="auth-btn ghost"
        onClick={() => { setStep(STEPS.DECIDE); setPassword(''); setError(''); }}>
        ← Use a different email
      </button>
    </div>
  );

  return (
    <div className="auth-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        {step !== STEPS.LOGIN && step !== STEPS.DECIDE && (
          <div className="auth-progress">
            {[STEPS.DECIDE, STEPS.VERIFY, STEPS.SETPASS].map((s, i) => (
              <div key={s} className={`progress-dot ${
                s === step ? 'active' :
                [STEPS.DECIDE, STEPS.VERIFY, STEPS.SETPASS].indexOf(step) > i ? 'done' : ''
              }`} />
            ))}
          </div>
        )}
        <button className="auth-close" onClick={onClose} aria-label="Close">×</button>

        {step === STEPS.DECIDE  && renderDecide()}
        {step === STEPS.VERIFY  && renderVerify()}
        {step === STEPS.SETPASS && renderSetPass()}
        {step === STEPS.LOGIN   && renderLogin()}
      </div>
    </div>
  );
};

export default AuthModal;
