import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Store, Mail, Phone, Lock, Eye, EyeOff,
  AlertCircle, ArrowRight, Shield, Smartphone,
  CheckCircle, MapPin, Navigation, Clock, Star,
  IndianRupee, Package, Zap, TrendingUp, ShoppingBag,
  RefreshCw, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OTPAuth from '../components/auth/OTPAuth';
import { seedSellerProducts } from '../services/seedingService';
import { toast } from 'react-hot-toast';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signIn, signUp, setMockUser } = useAuth();

  // UI State
  const [activeRole, setActiveRole] = useState('customer');
  const [loginMethod, setLoginMethod] = useState('phone');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [shouldSeed, setShouldSeed] = useState(false);

  // Redirect if already logged in based on role
  useEffect(() => {
    if (user && profile) {
      const from = location.state?.from?.pathname;
      const role = profile?.role || activeRole;

      if (from) {
        navigate(from, { replace: true });
      } else if (role === 'seller') {
        navigate('/dashboard', { replace: true });
      } else if (role === 'delivery') {
        navigate('/delivery', { replace: true });
      } else if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/feed', { replace: true });
      }
    }
  }, [user, profile, navigate, activeRole, location.state]);

  const validateForm = () => {
    setError('');
    if (isRegistering && !fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      let result;

      if (isRegistering) {
        result = await signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: activeRole,
            },
          },
        });
        if (result.error) throw result.error;
        if (result.data?.user?.identities?.length === 0) {
          setError('Account exists. Please log in.');
        } else {
          setSuccessMsg('Check your email for the confirmation link!');
          setTimeout(() => setSuccessMsg(''), 5000);
        }
      } else {
        result = await signIn({ email, password });
        if (result.error) throw result.error;
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSuccess = async (otpUser, session) => {
    if (otpUser?.id === '00000000-0000-0000-0000-000000000000') {
      const spoofedUser = {
        ...otpUser,
        user_metadata: { ...otpUser.user_metadata, role: activeRole }
      };
      
      if (activeRole === 'seller' && shouldSeed) {
        setIsLoading(true);
        toast.loading('Seeding sample products...');
        await seedSellerProducts(spoofedUser);
        toast.dismiss();
        toast.success('Sample products added!');
      }
      
      setMockUser(spoofedUser);
    }
  };

  const handleSocialLogin = async (provider) => {
    setError('Social login requires Supabase OAuth configuration.');
  };

  // ─── Format helpers ─────────────────────────────────────────────
  const formatDistance = (km) => `${Number(km).toFixed(1)} km`;
  const formatDuration = (min) => `${min} min`;
  const formatTimeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  // ─── OTP Mode ──────────────────────────────────────────────────
  if (loginMethod === 'phone') {
    return (
      <div className="auth-page">
        <div className="auth-bg-glow"></div>
        <div className="auth-bg-glow secondary"></div>
        <div className="auth-bg-glow tertiary"></div>

        <div className="auth-otp-wrapper">
          {/* Role Selection Header */}
          <div className="auth-otp-header">
            <div className="auth-logo">
              <Store size={28} />
            </div>
            <h1 className="auth-otp-title">LocalMarket</h1>
            <p className="auth-otp-tagline">Your neighborhood, connected</p>
          </div>

          {/* Role Tabs */}
          <div className="auth-roles auth-roles-otp">
            <div
              className="auth-role-indicator"
              style={{
                width: '33.33%',
                left: activeRole === 'customer' ? '0%' : activeRole === 'seller' ? '33.33%' : '66.66%',
              }}
            />
            <button
              type="button"
              className={`auth-role-btn ${activeRole === 'customer' ? 'active' : ''}`}
              onClick={() => setActiveRole('customer')}
            >
              Customer
            </button>
            <button
              type="button"
              className={`auth-role-btn ${activeRole === 'seller' ? 'active' : ''}`}
              onClick={() => setActiveRole('seller')}
            >
              Seller
            </button>
            <button
              type="button"
              className={`auth-role-btn ${activeRole === 'delivery' ? 'active' : ''}`}
              onClick={() => setActiveRole('delivery')}
            >
              Delivery
            </button>
          </div>

          {/* Conditional Content */}
          <OTPAuth
            role={activeRole}
            onSuccess={handleOTPSuccess}
            onSwitchMethod={() => {
              setLoginMethod('email');
              setError('');
            }}
          />

          {activeRole === 'seller' && (
            <div className="auth-seed-option glass animate-fade-in">
              <label className="auth-checkbox">
                <input 
                  type="checkbox" 
                  checked={shouldSeed} 
                  onChange={(e) => setShouldSeed(e.target.checked)} 
                />
                <div className="seed-label-box">
                  <span className="seed-title">Quick Setup Mode</span>
                  <span className="seed-desc">Pre-fill my dashboard with 4 sample products (images included)</span>
                </div>
              </label>
            </div>
          )}

          {/* Footer links */}
          <div className="auth-otp-footer-links">
            <span>Need help?</span>
            <a href="#" onClick={(e) => e.preventDefault()}>Contact Support</a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Email/Password Mode ───────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-bg-glow"></div>
      <div className="auth-bg-glow secondary"></div>

      <div className="auth-container">
        <div className="auth-card">

          <div className="auth-header">
            <div className="auth-logo">
              <Store size={32} />
            </div>
            <h1 className="auth-title">
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="auth-subtitle">
              {isRegistering
                ? 'Join our local commerce community today.'
                : 'Enter your details to access your account.'}
            </p>
          </div>

          {/* Role Selection Tabs */}
          <div className="auth-roles">
            <div
              className="auth-role-indicator"
              style={{
                width: '33.33%',
                left: activeRole === 'customer' ? '0%' : activeRole === 'seller' ? '33.33%' : '66.66%',
              }}
            />
            <button
              type="button"
              className={`auth-role-btn ${activeRole === 'customer' ? 'active' : ''}`}
              onClick={() => setActiveRole('customer')}
            >
              Customer
            </button>
            <button
              type="button"
              className={`auth-role-btn ${activeRole === 'seller' ? 'active' : ''}`}
              onClick={() => setActiveRole('seller')}
            >
              Seller
            </button>
            <button
              type="button"
              className={`auth-role-btn ${activeRole === 'delivery' ? 'active' : ''}`}
              onClick={() => setActiveRole('delivery')}
            >
              Delivery
            </button>
          </div>


              {/* Login Type Toggle */}
              <div className="auth-type-toggle">
                <button
                  type="button"
                  className={`auth-type-btn ${loginMethod === 'email' ? 'active' : ''}`}
                  onClick={() => { setLoginMethod('email'); setError(''); }}
                >
                  <Mail size={14} />
                  <span>Email</span>
                </button>
                <button
                  type="button"
                  className={`auth-type-btn ${loginMethod === 'phone' ? 'active' : ''}`}
                  onClick={() => { setLoginMethod('phone'); setError(''); }}
                >
                  <Phone size={14} />
                  <span>Phone OTP</span>
                </button>
              </div>

              <form onSubmit={handleEmailSubmit} className="auth-form" noValidate>

                {/* Full Name for Registration */}
                {isRegistering && (
                  <div className="auth-input-group">
                    <label className="auth-label">Full Name</label>
                    <div className="auth-input-wrapper">
                      <Store size={18} className="auth-input-icon" />
                      <input
                        type="text"
                        className="auth-input"
                        placeholder={activeRole === 'seller' ? 'Business Name' : 'John Doe'}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div className="auth-input-group">
                  <label className="auth-label">Email Address</label>
                  <div className="auth-input-wrapper">
                    <Mail size={18} className="auth-input-icon" />
                    <input
                      type="email"
                      className={`auth-input ${error.includes('email') ? 'error' : ''}`}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      id="login-email-input"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="auth-input-group">
                  <label className="auth-label">Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`auth-input ${error.includes('Password') ? 'error' : ''}`}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      id="login-password-input"
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Success Message */}
                {successMsg && (
                  <div className="auth-success-msg">
                    <CheckCircle size={16} />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="auth-error-msg">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Options Row */}
                {!isRegistering && (
                  <div className="auth-options">
                    <label className="auth-checkbox">
                      <input type="checkbox" disabled={isLoading} />
                      <span>Remember me</span>
                    </label>
                    <a href="#" className="auth-forgot-link" onClick={(e) => { e.preventDefault(); setError('Password reset flow coming soon.'); }}>
                      Forgot Password?
                    </a>
                  </div>
                )}

                {/* Submit Button */}
                <button type="submit" className="auth-submit-btn" disabled={isLoading} id="login-submit-btn">
                  {isLoading ? (
                    <div className="auth-btn-spinner" />
                  ) : (
                    <>
                      {isRegistering ? 'Create Account' : 'Sign In'}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {/* Social Logins */}
              <div className="auth-divider">Or continue with</div>
              <div className="auth-social-grid">
                <button type="button" className="auth-social-btn" onClick={() => handleSocialLogin('google')} disabled={isLoading}>
                  Google
                </button>
                <button type="button" className="auth-social-btn" onClick={() => handleSocialLogin('github')} disabled={isLoading}>
                  GitHub
                </button>
              </div>

              {/* Toggle Login/Register */}
              <div className="auth-footer">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }}>
                  {isRegistering ? 'Sign In' : 'Sign Up'}
                </button>
              </div>

        </div>
      </div>
    </div>
  );
}
