import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, ShoppingBag, MessageCircle, BarChart3, User,
  Bell, Plus, Menu, X, MapPin, Sparkles,
  Store, Settings, Heart, ChevronRight, Navigation, Package,
  ShieldAlert, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import './Layout.css';

const allNavItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/products', icon: ShoppingBag, label: 'Products', excludeRoles: ['delivery'] },
  { path: '/orders', icon: Package, label: 'My Orders' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },

  { path: '/delivery', icon: Navigation, label: 'Delivery Portal', role: 'delivery' },
  { path: '/nearby', icon: Store, label: 'Nearby', excludeRoles: ['delivery'] },
  { path: '/admin', icon: ShieldAlert, label: 'Admin', role: 'admin' },
];

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleProductSearchSubmit = (e) => {
    e.preventDefault();
    if (productSearch.trim()) {
      navigate(`/products?search=${encodeURIComponent(productSearch.trim())}`);
    }
  };

  const navItems = useMemo(() => {
    return allNavItems.filter(item => {
      // If item is role-specific
      if (item.role && profile?.role !== item.role) return false;
      
      // If item should be excluded for certain roles
      if (item.excludeRoles && profile?.role && item.excludeRoles.includes(profile.role)) return false;
      
      return true;
    });
  }, [profile]);

  const isHomePage = location.pathname === '/';
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="layout">
      {/* Premium Sticky Header */}
      {!isLoginPage && (
        <header className={`header glass ${scrolled ? 'header-scrolled' : ''} ${isHomePage ? 'header-home' : ''}`}>

        <div className="container header-inner">
          <div className="header-left">
            <NavLink to="/" className="header-logo">
              <div className="logo-icon">
                <Store size={22} />
              </div>
              <span className="logo-text">LocalSell</span>
            </NavLink>
            
            <nav className="header-nav-desktop">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `header-nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="header-right">
            <div className="header-actions" style={{ display: 'flex', alignItems: 'center' }}>
              {/* Expandable search bar for searching products near notification icon - Hidden on Delivery Dashboard */}
              {profile?.role !== 'delivery' && location.pathname !== '/delivery' && (
                <form onSubmit={handleProductSearchSubmit} className="expandable-search-container" style={{ marginRight: '0.5rem' }}>
                  <Search size={16} className="expandable-search-icon" onClick={() => { if(productSearch.trim()) navigate(`/products?search=${encodeURIComponent(productSearch.trim())}`); }} />
                  <input
                    type="text"
                    className="expandable-search-input"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </form>
              )}
              <NotificationDropdown />
              
              {profile ? (
                <>
                  {profile?.role === 'seller' && (
                    <NavLink to="/add-product" className="btn btn-primary btn-sm mr-3 hide-mobile">
                      <Plus size={16} /> Sell
                    </NavLink>
                  )}
                  <NavLink to="/profile" className="header-profile-link" title="My Profile">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="header-avatar" />
                    ) : (
                      <div className="header-profile-icon glass">
                        <User size={20} />
                      </div>
                    )}
                  </NavLink>
                </>
              ) : (
                <NavLink to="/login" className="btn btn-ghost btn-sm mr-2">
                  Login
                </NavLink>
              )}
            </div>

            
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>
      )}


      {/* Mobile Navigation Menu */}
      {!isLoginPage && (
      <div className={`mobile-menu glass ${mobileMenuOpen ? 'open' : ''}`}>

        <nav className="mobile-nav-inner">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="mobile-link-content">
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
              <ChevronRight size={18} />
            </NavLink>
          ))}
          {profile?.role === 'seller' && (
            <NavLink
              to="/add-product"
              className="mobile-nav-link sell-link-mobile"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="mobile-link-content">
                <Plus size={20} className="color-primary" />
                <span className="color-primary">Start Selling</span>
              </div>
              <ChevronRight size={18} />
            </NavLink>
          )}
          <div className="mobile-menu-footer">
            {profile ? (
              <NavLink
                to="/profile"
                className="mobile-nav-link profile-link-mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="mobile-link-content">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="avatar-sm-mobile" />
                  ) : (
                    <User size={20} />
                  )}
                  <span>My Profile</span>
                </div>
                <ChevronRight size={18} />
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                className="btn btn-outline btn-full mb-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login to Account
              </NavLink>
            )}
            

          </div>
        </nav>
      </div>
      )}

      {/* Main Content Area */}
      <main className={`main-content ${(isHomePage || isLoginPage) ? 'main-content-home' : ''}`}>

        {children}
      </main>

      {/* Premium Footer */}
      {!isLoginPage && (
      <footer className="main-footer">

        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <NavLink to="/" className="header-logo">
                <div className="logo-icon">
                  <Store size={22} />
                </div>
                <span className="logo-text">LocalSell</span>
              </NavLink>
              <p className="footer-tagline">
                The AI-powered hyperlocal marketplace for modern sellers and buyers.
              </p>
              <div className="social-links">
                <a href="#" className="social-icon"><Heart size={18} /></a>
                <a href="#" className="social-icon"><MessageCircle size={18} /></a>
                <a href="#" className="social-icon"><Settings size={18} /></a>
              </div>
            </div>
            
            <div className="footer-nav-group">
              <h4>Platform</h4>
              <nav>
                <NavLink to="/products">Browse Products</NavLink>
                <NavLink to="/ai-assistant">AI Assistant</NavLink>
              </nav>
            </div>
            

            
            <div className="footer-nav-group">
              <h4>Support</h4>
              <nav>
                <a href="#">Help Center</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
              </nav>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>© 2026 LocalSell. All rights reserved. Crafted for high-performance commerce.</p>
          </div>
        </div>
      </footer>
      )}
    </div>

  );
}
