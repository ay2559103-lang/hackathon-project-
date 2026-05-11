import React from 'react';
import { motion } from 'framer-motion';
import { Store, User, MapPin, ChevronRight } from 'lucide-react';

const RoleSelector = ({ onSelect }) => {
  const roles = [
    {
      id: 'customer',
      title: 'Customer',
      description: 'Shop from local sellers near you',
      icon: <User size={32} />,
      color: 'from-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/20'
    },
    {
      id: 'seller',
      title: 'Seller',
      description: 'Grow your business online',
      icon: <Store size={32} />,
      color: 'from-purple-600 to-pink-500',
      shadow: 'shadow-purple-500/20'
    },
    {
      id: 'delivery',
      title: 'Delivery Partner',
      description: 'Deliver joy to customers',
      icon: <MapPin size={32} />,
      color: 'from-emerald-500 to-teal-400',
      shadow: 'shadow-emerald-500/20'
    }
  ];

  return (
    <div className="w-full max-w-5xl px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
          Choose your role to continue
        </h2>
        <p className="text-slate-400 max-w-lg mx-auto">
          Select the account type that best fits your needs to access your personalized dashboard.
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {roles.map((role, index) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(role.id)}
            className="group relative overflow-hidden glass-card p-8 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2"
            style={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px'
            }}
          >
            {/* Background Glow */}
            <div className={`absolute -inset-1 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`} />
            
            <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-6 shadow-xl ${role.shadow} group-hover:scale-110 transition-transform duration-300`}>
              <div className="text-white">
                {role.icon}
              </div>
            </div>
            
            <h3 className="relative text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
              {role.title}
            </h3>
            
            <p className="relative text-slate-400 text-sm mb-8 leading-relaxed">
              {role.description}
            </p>
            
            <div className="relative mt-auto flex items-center text-white/70 font-medium group-hover:text-white transition-colors">
              Continue as {role.title}
              <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default RoleSelector;
