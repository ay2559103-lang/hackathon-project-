import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Phone, ArrowLeft, Eye, EyeOff, Loader2, Smartphone, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../utils/supabase/client';
import toast from 'react-hot-toast';

const AuthForm = ({ role, onBack }) => {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot-password', 'otp'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              role: role
            }
          }
        });
        if (error) throw error;
        toast.success('Check your email for confirmation link!');
        setMode('login');
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) throw error;
        toast.success('Successfully logged in!');
      } else if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email);
        if (error) throw error;
        toast.success('Password reset link sent to your email!');
        setMode('login');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({
          phone: formData.phone,
        });
        if (error) throw error;
        setOtpSent(true);
        toast.success('OTP sent to your phone!');
      } else {
        const { error } = await supabase.auth.verifyOtp({
          phone: formData.phone,
          token: otpCode,
          type: 'sms'
        });
        if (error) throw error;
        toast.success('Phone verified!');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md"
    >
      <button 
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-white mb-8 transition-colors group"
      >
        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to roles
      </button>

      <div className="glass-card p-8 sm:p-10 relative overflow-hidden" style={{ 
        backgroundColor: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px'
      }}>
        {/* Role Badge */}
        <div className="absolute top-0 right-0 px-4 py-2 bg-white/5 border-b border-l border-white/10 rounded-bl-xl text-xs font-semibold text-slate-400 capitalize">
          {role} portal
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold text-white mb-2">
            {mode === 'login' ? 'Welcome Back' : 
             mode === 'signup' ? 'Create Account' : 
             mode === 'forgot-password' ? 'Reset Password' : 'Login with OTP'}
          </h2>
          <p className="text-slate-400">
            {mode === 'login' ? 'Please enter your details to sign in.' : 
             mode === 'signup' ? 'Join LocalMarket and start your journey.' : 
             mode === 'forgot-password' ? 'We will send you a reset link.' : 'Enter your phone number to receive a code.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {mode !== 'otp' ? (
            <motion.form 
              key="email-form"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-5" 
              onSubmit={handleEmailAuth}
            >
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 ml-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input 
                      type="text" 
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Anurag Yadav"
                      className="auth-input pl-12"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="auth-input pl-12"
                  />
                </div>
              </div>

              {mode !== 'forgot-password' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-sm font-medium text-slate-400">Password</label>
                    {mode === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => setMode('forgot-password')}
                        className="text-sm text-blue-400 hover:underline"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="auth-input pl-12 pr-12"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 text-slate-400 text-sm cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-slate-800/50 checked:bg-blue-500 transition-all cursor-pointer" />
                  <span className="group-hover:text-slate-300 transition-colors">Remember me</span>
                </label>
              </div>

              <button 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : null}
                {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="otp-form"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-5" 
              onSubmit={handlePhoneAuth}
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input 
                    type="tel" 
                    name="phone"
                    required
                    disabled={otpSent}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="auth-input pl-12"
                  />
                </div>
              </div>

              {otpSent && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium text-slate-400 ml-1">OTP Code</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input 
                      type="text" 
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="6-digit code"
                      className="auth-input pl-12"
                      maxLength={6}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setOtpSent(false)}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Change phone number?
                  </button>
                </motion.div>
              )}

              <button 
                disabled={loading}
                className="w-full bg-slate-100 text-slate-900 font-bold py-4 rounded-xl shadow-lg hover:bg-white transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : null}
                {otpSent ? 'Verify OTP' : 'Send OTP'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 flex flex-col items-center gap-6">
          <div className="relative w-full text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <span className="relative px-4 text-xs font-medium text-slate-500 bg-[#1e293b] uppercase tracking-widest">or continue with</span>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button 
              type="button"
              onClick={() => {
                setMode(mode === 'otp' ? 'login' : 'otp');
                setOtpSent(false);
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors text-sm font-medium"
            >
              {mode === 'otp' ? <Mail size={18} /> : <Phone size={18} />}
              {mode === 'otp' ? 'Email' : 'Phone'}
            </button>
            <button 
              type="button"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors text-sm font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
              </svg>
              Google
            </button>
          </div>

          <div className="text-center">
            <p className="text-slate-400 text-sm">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setOtpSent(false);
                }}
                className="text-blue-400 hover:underline font-semibold ml-2"
              >
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-slate-500 text-xs mt-8">
        By continuing, you agree to our <button className="underline">Terms of Service</button> and <button className="underline">Privacy Policy</button>.
      </p>
    </motion.div>
  );
};

const UserIcon = ({ className, size }) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default AuthForm;
