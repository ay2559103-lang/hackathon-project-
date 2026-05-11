import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import RoleSelector from '../components/auth/RoleSelector';
import AuthForm from '../components/auth/AuthForm';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'seller') navigate('/dashboard');
      else if (profile.role === 'delivery') navigate('/delivery');
      else navigate('/feed');
    }
  }, [user, profile, navigate]);

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
  };

  const handleBack = () => {
    setSelectedRole(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Logo Area */}
      {!selectedRole && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center z-10"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20">
            <Store className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            LocalMarket
          </h1>
          <p className="text-slate-400">Your community, connected.</p>
        </motion.div>
      )}

      <div className="w-full flex flex-col items-center z-10">
        <AnimatePresence mode="wait">
          {!selectedRole ? (
            <motion.div
              key="role-selector"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full flex justify-center"
            >
              <RoleSelector onSelect={handleRoleSelect} />
            </motion.div>
          ) : (
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex justify-center"
            >
              <AuthForm role={selectedRole} onBack={handleBack} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile-first bottom text for Role Selection */}
      {!selectedRole && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-slate-500 text-sm"
        >
          New to LocalMarket? <button className="text-blue-400 hover:underline font-medium">Learn more about our platform</button>
        </motion.div>
      )}
    </div>
  );
};

export default LoginPage;
