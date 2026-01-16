import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/AuthModal.css';

interface AuthModalProps {
  onClose: () => void;
}

type AuthView = 'welcome' | 'login' | 'signup' | 'corporate-signup';

// SVG Icons (Filled)
const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 8h-1V6c0-2.76-2.24-5-5-5S6 3.24 6 6v2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 3c1.66 0 3 1.34 3 3v2H9V6c0-1.66 1.34-3 3-3zm4 11h-3v3h-2v-3H8v-2h3V9h2v3h3v2z"/>
  </svg>
);

const BuildingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
);

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { signIn, signUp, continueAsGuest } = useAuth();
  const [view, setView] = useState<AuthView>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGuest = () => {
    continueAsGuest();
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message || 'Failed to sign in');
        setLoading(false);
      } else {
        onClose();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const userType = view === 'corporate-signup' ? 'corporate' : 'regular';
      const { error } = await signUp(email, password, userType, companyLogo || undefined);
      
      if (error) {
        console.error('Signup error details:', error);
        // Show user-friendly error messages
        let errorMessage = 'Failed to sign up';
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        setError(errorMessage);
        setLoading(false);
      } else {
        onClose();
      }
    } catch (err: any) {
      console.error('Signup exception:', err);
      setError(err?.message || 'An unexpected error occurred. Please check the console for details.');
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo must be less than 2MB');
        return;
      }
      setCompanyLogo(file);
      setError('');
    }
  };

  const renderWelcomeView = () => (
    <div className="auth-welcome">
      <div className="auth-logo">
        <img src="/untitled-transparent.png" alt="ReforestNYC" />
      </div>
      <h2>Welcome to ReforestNYC</h2>
      <p className="auth-subtitle">Join our community to share reviews and green initiatives</p>
      
      <div className="auth-options">
        <button className="auth-option-btn secondary" onClick={() => setView('signup')}>
          <div className="option-icon">
            <UserIcon />
          </div>
          <div className="option-content">
            <div className="option-title">Sign Up</div>
            <div className="option-description">Create a free account</div>
          </div>
        </button>

        <button className="auth-option-btn secondary" onClick={() => setView('login')}>
          <div className="option-icon">
            <KeyIcon />
          </div>
          <div className="option-content">
            <div className="option-title">Log In</div>
            <div className="option-description">Already have an account?</div>
          </div>
        </button>

        <button className="auth-option-btn primary" onClick={() => setView('corporate-signup')}>
          <div className="option-icon">
            <BuildingIcon />
          </div>
          <div className="option-content">
            <div className="option-title">Corporate Ambassador</div>
            <div className="option-description">Represent your company's green initiatives</div>
          </div>
        </button>

        <button className="auth-option-btn guest" onClick={handleGuest}>
          <div className="option-icon">
            <EyeIcon />
          </div>
          <div className="option-content">
            <div className="option-title">Continue as Guest</div>
            <div className="option-description">Browse without an account (view only)</div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderLoginView = () => (
    <div className="auth-form-container">
      <button type="button" className="back-button" onClick={() => setView('welcome')}>
        ← Back
      </button>
      <h2>Log In</h2>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );

  const renderSignupView = () => (
    <div className="auth-form-container">
      <button type="button" className="back-button" onClick={() => setView('welcome')}>
        ← Back
      </button>
      <h2>Create Account</h2>
      <form onSubmit={handleSignup}>
        <div className="form-group">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            minLength={6}
          />
        </div>
        <div className="form-group">
          <label htmlFor="signup-confirm">Confirm Password</label>
          <input
            id="signup-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );

  const renderCorporateSignupView = () => (
    <div className="auth-form-container">
      <button type="button" className="back-button" onClick={() => setView('welcome')}>
        ← Back
      </button>
      <h2>Corporate Ambassador</h2>
      <p className="corporate-info">
        Corporate ambassadors showcase their company's environmental initiatives and represent their organization.
      </p>
      <form onSubmit={handleSignup}>
        <div className="form-group">
          <label htmlFor="corp-email">Company Email</label>
          <input
            id="corp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@company.com"
          />
          <small className="form-hint">Must use company email (no Gmail, Yahoo, etc.)</small>
        </div>
        <div className="form-group">
          <label htmlFor="corp-logo">Company Logo</label>
          <input
            id="corp-logo"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            required
          />
          <small className="form-hint">Max 2MB. PNG, JPG, or SVG recommended.</small>
          {companyLogo && (
            <div className="logo-preview">
              <img src={URL.createObjectURL(companyLogo)} alt="Logo preview" />
            </div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="corp-password">Password</label>
          <input
            id="corp-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            minLength={6}
          />
        </div>
        <div className="form-group">
          <label htmlFor="corp-confirm">Confirm Password</label>
          <input
            id="corp-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Corporate Account'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
        
        {view === 'welcome' && renderWelcomeView()}
        {view === 'login' && renderLoginView()}
        {view === 'signup' && renderSignupView()}
        {view === 'corporate-signup' && renderCorporateSignupView()}
      </div>
    </div>
  );
};

export default AuthModal;
