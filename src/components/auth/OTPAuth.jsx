import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone, Shield, ArrowRight, ArrowLeft, CheckCircle,
  AlertCircle, RefreshCw, Lock, Smartphone, Fingerprint,
  Clock, XCircle, Loader2, ChevronDown
} from 'lucide-react';
import { otpService } from '../../services/otpAuthService';
import './OTPAuth.css';

// ─── Country Codes ──────────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'USA' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'UK' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
];

// ─── OTP Input Component ────────────────────────────────────────────
function OTPInput({ length = 6, value, onChange, disabled, hasError }) {
  const inputRefs = useRef([]);
  const digits = value.split('').concat(Array(length - value.length).fill(''));

  const focusInput = (index) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index].focus();
    }
  };

  const handleChange = (index, e) => {
    const val = e.target.value;
    if (val && !/^\d$/.test(val)) return; // Only allow single digits

    const newDigits = [...digits];
    newDigits[index] = val;
    const newValue = newDigits.join('').slice(0, length);
    onChange(newValue);

    // Auto-focus next
    if (val && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        focusInput(index - 1);
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    focusInput(Math.min(pasted.length, length - 1));
  };

  // Auto focus first empty input on mount
  useEffect(() => {
    const firstEmpty = digits.findIndex(d => !d);
    if (firstEmpty >= 0) focusInput(firstEmpty);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`otp-input-group ${hasError ? 'otp-error' : ''} ${disabled ? 'otp-disabled' : ''}`}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          className={`otp-digit ${digit ? 'otp-filled' : ''} ${hasError ? 'otp-digit-error' : ''}`}
          aria-label={`Digit ${i + 1}`}
          id={`otp-digit-${i}`}
        />
      ))}
    </div>
  );
}

// ─── Main OTP Auth Component ────────────────────────────────────────
export default function OTPAuth({ role = 'customer', onSuccess, onBack, onSwitchMethod }) {
  // States
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'success'
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Timer states
  const [cooldown, setCooldown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);
  const cooldownRef = useRef(null);
  const expiryRef = useRef(null);

  // Security state
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  // Refs
  const phoneInputRef = useRef(null);
  const countryDropdownRef = useRef(null);

  // ─── Cooldown Timer ──────────────────────────────────────────────
  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(cooldownRef.current);
  }, [cooldown]);

  // ─── OTP Expiry Timer ────────────────────────────────────────────
  useEffect(() => {
    if (otpExpiry > 0) {
      expiryRef.current = setInterval(() => {
        setOtpExpiry((prev) => {
          if (prev <= 1) {
            clearInterval(expiryRef.current);
            setError('OTP has expired. Please request a new one.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(expiryRef.current);
  }, [otpExpiry]);

  // ─── Block timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (blockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setBlockTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [blockTimeRemaining]);

  // ─── Close country dropdown on outside click ─────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Format time helper ──────────────────────────────────────────
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `0:${s.toString().padStart(2, '0')}`;
  };

  // ─── Send OTP ────────────────────────────────────────────────────
  const handleSendOTP = useCallback(async () => {
    if (isBlocked || isLoading) return;

    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    const fullPhone = countryCode.code + phone.replace(/^0+/, '');
    const result = await otpService.sendOTP(fullPhone, role);

    setIsLoading(false);

    if (result.success) {
      setStep('otp');
      setCooldown(result.cooldownSeconds || 60);
      setOtpExpiry(300); // 5 minutes
      setOtpValue('');
      setAttempts(0);
      setSuccessMessage(`OTP sent to ${otpService.formatPhoneDisplay(fullPhone)}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setError(result.error);
      if (result.isBlocked) {
        setIsBlocked(true);
        setBlockTimeRemaining(result.retryAfter || 1800);
      }
      if (result.cooldownRemaining) {
        setCooldown(result.cooldownRemaining);
      }
    }
  }, [phone, countryCode, role, isBlocked, isLoading]);

  // ─── Verify OTP ──────────────────────────────────────────────────
  const handleVerifyOTP = useCallback(async () => {
    if (isLoading || otpValue.length !== 6) return;

    setError('');
    setIsLoading(true);

    const fullPhone = countryCode.code + phone.replace(/^0+/, '');
    const result = await otpService.verifyOTP(fullPhone, otpValue);

    setIsLoading(false);

    if (result.success) {
      setStep('success');
      clearInterval(expiryRef.current);
      setTimeout(() => {
        onSuccess?.(result.user, result.session);
      }, 1500);
    } else {
      setAttempts((prev) => prev + 1);
      setOtpValue('');
      setError(result.error);

      if (result.isExpired) {
        setOtpExpiry(0);
      }

      if (attempts + 1 >= MAX_OTP_ATTEMPTS) {
        setIsBlocked(true);
        setBlockTimeRemaining(3600);
        setError('Too many failed attempts. Account locked for 1 hour.');
      }
    }
  }, [otpValue, phone, countryCode, isLoading, attempts, onSuccess]);

  // ─── Auto-submit when 6 digits entered ───────────────────────────
  useEffect(() => {
    if (otpValue.length === 6 && step === 'otp' && !isLoading) {
      const timer = setTimeout(() => handleVerifyOTP(), 300);
      return () => clearTimeout(timer);
    }
  }, [otpValue, step, isLoading, handleVerifyOTP]);

  // ─── Resend OTP ──────────────────────────────────────────────────
  const handleResend = async () => {
    if (cooldown > 0 || isBlocked) return;
    setOtpValue('');
    setError('');
    await handleSendOTP();
  };

  // ─── Phone input validation ──────────────────────────────────────
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^\d\s]/g, '');
    setPhone(val);
    setError('');
  };

  const isPhoneValid = phone.replace(/\s/g, '').length >= 10;

  // ─── Render Phone Step ───────────────────────────────────────────
  const renderPhoneStep = () => (
    <div className="otp-step otp-step-enter" key="phone">
      <div className="otp-step-header">
        <div className="otp-icon-container">
          <div className="otp-icon-ring">
            <Phone size={28} />
          </div>
          <div className="otp-icon-pulse" />
        </div>
        <h2 className="otp-title">Phone Verification</h2>
        <p className="otp-subtitle">
          Enter your phone number. We'll send a 6-digit verification code.
        </p>
      </div>

      <div className="otp-phone-field">
        <label className="otp-label">Phone Number</label>
        <div className="otp-phone-input-row">
          {/* Country Code Selector */}
          <div className="otp-country-selector" ref={countryDropdownRef}>
            <button
              type="button"
              className="otp-country-btn"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              disabled={isLoading}
            >
              <span className="otp-country-flag">{countryCode.flag}</span>
              <span className="otp-country-code">{countryCode.code}</span>
              <ChevronDown size={14} className={`otp-chevron ${showCountryDropdown ? 'otp-chevron-up' : ''}`} />
            </button>

            {showCountryDropdown && (
              <div className="otp-country-dropdown">
                {COUNTRY_CODES.map((cc) => (
                  <button
                    key={cc.code}
                    type="button"
                    className={`otp-country-option ${countryCode.code === cc.code ? 'active' : ''}`}
                    onClick={() => {
                      setCountryCode(cc);
                      setShowCountryDropdown(false);
                    }}
                  >
                    <span className="otp-country-flag">{cc.flag}</span>
                    <span className="otp-country-name">{cc.name}</span>
                    <span className="otp-country-code-label">{cc.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Phone Input */}
          <input
            ref={phoneInputRef}
            type="tel"
            inputMode="numeric"
            className={`otp-phone-input ${error ? 'otp-input-error' : ''}`}
            placeholder="98765 43210"
            value={phone}
            onChange={handlePhoneChange}
            onKeyDown={(e) => e.key === 'Enter' && isPhoneValid && handleSendOTP()}
            disabled={isLoading || isBlocked}
            autoFocus
            id="otp-phone-input"
          />
        </div>
      </div>

      {/* Security badge */}
      <div className="otp-security-badge">
        <Shield size={14} />
        <span>256-bit encrypted · SMS verification</span>
      </div>

      {/* Error */}
      {error && (
        <div className="otp-error-box otp-animate-shake">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Block warning */}
      {isBlocked && blockTimeRemaining > 0 && (
        <div className="otp-block-warning">
          <Lock size={16} />
          <span>Account temporarily locked. Try again in {formatTime(blockTimeRemaining)}</span>
        </div>
      )}

      {/* Send OTP Button */}
      <button
        type="button"
        className="otp-submit-btn"
        onClick={handleSendOTP}
        disabled={!isPhoneValid || isLoading || isBlocked}
        id="otp-send-btn"
      >
        {isLoading ? (
          <Loader2 size={20} className="otp-spinner" />
        ) : (
          <>
            <span>Send Verification Code</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>

      {/* Switch to email/password */}
      {onSwitchMethod && (
        <button type="button" className="otp-switch-method" onClick={onSwitchMethod}>
          Use email & password instead
        </button>
      )}
    </div>
  );

  // ─── Render OTP Step ─────────────────────────────────────────────
  const renderOTPStep = () => (
    <div className="otp-step otp-step-enter" key="otp">
      <div className="otp-step-header">
        <button
          type="button"
          className="otp-back-btn"
          onClick={() => {
            setStep('phone');
            setError('');
            setOtpValue('');
            clearInterval(expiryRef.current);
          }}
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div className="otp-icon-container">
          <div className="otp-icon-ring otp-icon-verify">
            <Fingerprint size={28} />
          </div>
        </div>
        <h2 className="otp-title">Enter Verification Code</h2>
        <p className="otp-subtitle">
          We sent a 6-digit code to{' '}
          <strong className="otp-phone-highlight">
            {otpService.formatPhoneDisplay(countryCode.code + phone.replace(/^0+/, ''))}
          </strong>
        </p>
      </div>

      {/* OTP Expiry Timer */}
      {otpExpiry > 0 && (
        <div className={`otp-expiry-bar ${otpExpiry <= 60 ? 'otp-expiry-urgent' : ''}`}>
          <Clock size={14} />
          <span>Code expires in {formatTime(otpExpiry)}</span>
          <div className="otp-expiry-progress">
            <div
              className="otp-expiry-fill"
              style={{ width: `${(otpExpiry / 300) * 100}%` }}
            />
          </div>
        </div>
      )}

      {otpExpiry === 0 && step === 'otp' && (
        <div className="otp-expired-banner">
          <XCircle size={16} />
          <span>Code expired. Please request a new one.</span>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="otp-success-box">
          <CheckCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* OTP Input */}
      <OTPInput
        length={6}
        value={otpValue}
        onChange={(val) => {
          setOtpValue(val);
          setError('');
        }}
        disabled={isLoading || isBlocked || otpExpiry === 0}
        hasError={!!error}
      />

      {/* Attempts indicator */}
      {attempts > 0 && (
        <div className="otp-attempts-bar">
          <div className="otp-attempts-dots">
            {Array.from({ length: MAX_OTP_ATTEMPTS }).map((_, i) => (
              <div
                key={i}
                className={`otp-attempt-dot ${i < attempts ? 'otp-dot-used' : ''}`}
              />
            ))}
          </div>
          <span className="otp-attempts-text">
            {MAX_OTP_ATTEMPTS - attempts} attempts remaining
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="otp-error-box otp-animate-shake">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Verify Button */}
      <button
        type="button"
        className="otp-submit-btn"
        onClick={handleVerifyOTP}
        disabled={otpValue.length !== 6 || isLoading || isBlocked || otpExpiry === 0}
        id="otp-verify-btn"
      >
        {isLoading ? (
          <Loader2 size={20} className="otp-spinner" />
        ) : (
          <>
            <Shield size={18} />
            <span>Verify Code</span>
          </>
        )}
      </button>

      {/* Resend section */}
      <div className="otp-resend-section">
        <span className="otp-resend-label">Didn't receive the code?</span>
        {cooldown > 0 ? (
          <span className="otp-resend-timer">
            <RefreshCw size={14} />
            Resend in {formatTime(cooldown)}
          </span>
        ) : (
          <button
            type="button"
            className="otp-resend-btn"
            onClick={handleResend}
            disabled={isLoading || isBlocked}
          >
            <RefreshCw size={14} />
            Resend Code
          </button>
        )}
      </div>
    </div>
  );

  // ─── Render Success Step ─────────────────────────────────────────
  const renderSuccessStep = () => (
    <div className="otp-step otp-step-enter" key="success">
      <div className="otp-success-container">
        <div className="otp-success-icon-wrapper">
          <div className="otp-success-ring" />
          <div className="otp-success-ring otp-ring-2" />
          <div className="otp-success-check">
            <CheckCircle size={48} />
          </div>
        </div>
        <h2 className="otp-success-title">Verified Successfully!</h2>
        <p className="otp-success-subtitle">
          Your phone number has been verified. Redirecting you now...
        </p>
        <div className="otp-success-loader">
          <div className="otp-success-bar" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="otp-auth-container" id="otp-auth-section">
      {/* Ambient glow effects */}
      <div className="otp-glow otp-glow-1" />
      <div className="otp-glow otp-glow-2" />

      <div className="otp-card">
        {/* Role indicator */}
        <div className="otp-role-badge">
          <Smartphone size={12} />
          <span>{role} Portal</span>
        </div>

        {step === 'phone' && renderPhoneStep()}
        {step === 'otp' && renderOTPStep()}
        {step === 'success' && renderSuccessStep()}

        {/* Footer */}
        <div className="otp-footer">
          <Lock size={12} />
          <span>Protected by enterprise-grade security</span>
        </div>
      </div>
    </div>
  );
}
