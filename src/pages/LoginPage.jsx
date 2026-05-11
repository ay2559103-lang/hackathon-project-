import { useState } from 'react';
import { Store, User, MapPin, ArrowLeft, Mail, Lock, ChevronRight } from 'lucide-react';

const LoginPage = () => {
  const [role, setRole] = useState(null); // 'seller', 'customer', 'delivery', or null

  const roles = [
    {
      id: 'customer',
      title: 'Customer',
      description: 'Shop from local sellers near you',
      icon: <User size={32} />,
      color: 'blue'
    },
    {
      id: 'seller',
      title: 'Seller',
      description: 'Grow your business online',
      icon: <Store size={32} />,
      color: 'purple'
    },
    {
      id: 'delivery',
      title: 'Delivery Partner',
      description: 'Deliver joy to customers',
      icon: <MapPin size={32} />,
      color: 'green'
    }
  ];

  const handleRoleSelect = (roleId) => {
    setRole(roleId);
  };

  const resetRole = () => {
    setRole(null);
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 sm:p-12" style={{ backgroundColor: '#0f172a' }}>
        {/* Logo Area */}
        <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20">
            <Store className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>LocalMarket</h1>
          <p className="text-slate-400 max-w-xs mx-auto">Your community, delivered to your doorstep.</p>
        </div>

        <div className="w-full max-w-4xl">
          <h2 className="text-2xl font-display font-semibold text-white mb-8 text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>Choose your role to continue</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleRoleSelect(item.id)}
                className="glass-card group p-8 flex flex-col items-center text-center transition-all duration-300 hover:scale-105 active:scale-95"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '24px'
                }}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${
                  item.id === 'customer' ? 'bg-blue-500/10 text-blue-400' :
                  item.id === 'seller' ? 'bg-purple-500/10 text-purple-400' :
                  'bg-green-500/10 text-green-400'
                }`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm mb-6">{item.description}</p>
                <div className="mt-auto flex items-center text-blue-400 font-medium group-hover:translate-x-1 transition-transform">
                  Select <ChevronRight size={16} className="ml-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 text-slate-500 text-sm">
          New to LocalMarket? <button className="text-blue-400 hover:underline font-medium">Learn more</button>
        </div>
      </div>
    );
  }

  const selectedRole = roles.find(r => r.id === role);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#0f172a' }}>
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Back Button */}
        <button 
          onClick={resetRole}
          className="flex items-center text-slate-400 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to roles
        </button>

        {/* Login Card */}
        <div className="glass-card p-8 sm:p-10" style={{ 
          backgroundColor: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px'
        }}>
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              role === 'customer' ? 'bg-blue-500/10 text-blue-400' :
              role === 'seller' ? 'bg-purple-500/10 text-purple-400' :
              'bg-green-500/10 text-green-400'
            }`}>
              {selectedRole.icon}
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Login</h2>
              <p className="text-slate-400 text-sm">Welcome back, {selectedRole.title}!</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Email or Phone Number</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="text" 
                  placeholder="name@example.com"
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-medium text-slate-400">Password</label>
                <button type="button" className="text-sm text-blue-400 hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-lg"
                />
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all active:scale-[0.98] mt-4">
              Log in as {selectedRole.title}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-slate-400">
              Don't have an account? <button className="text-blue-400 hover:underline font-semibold">Create Account</button>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-slate-500 text-sm mt-8">
          By continuing, you agree to our <button className="underline">Terms of Service</button> and <button className="underline">Privacy Policy</button>.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

