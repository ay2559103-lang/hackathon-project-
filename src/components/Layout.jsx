import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, ShoppingBag, MessageCircle, BarChart3, User,
  Search, Bell, Plus, Menu, X, MapPin, Sparkles,
  Store, Settings, Heart, ChevronRight
} from 'lucide-react';
import './Layout.css';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/feed', icon: MapPin, label: 'Local Feed' },
  { path: '/products', icon: ShoppingBag, label: 'Products' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { path: '/ai-assistant', icon: Sparkles, label: 'AI Assistant' },
];

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const isHomePage = location.pathname === '/';

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
            <div className="header-actions">
              <button className="header-icon-btn" aria-label="Search">
                <Search size={20} />
              </button>
              <button className="header-icon-btn" aria-label="Notifications">
                <Bell size={20} />
                <span className="notification-dot"></span>
              </button>
              <NavLink to="/add-product" className="btn btn-primary btn-sm btn-sell">
                <Plus size={18} />
                <span>Sell Now</span>
              </NavLink>
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

      {/* Mobile Navigation Menu */}
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
          <div className="mobile-menu-footer">
            <NavLink
              to="/add-product"
              className="btn btn-primary btn-full"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Plus size={20} />
              Start Selling
            </NavLink>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className={`main-content ${isHomePage ? 'main-content-home' : ''}`}>
        {children}
      </main>

      {/* Premium Footer */}
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
                <NavLink to="/feed">Local Feed</NavLink>
                <NavLink to="/products">Browse Products</NavLink>
                <NavLink to="/ai-assistant">AI Assistant</NavLink>
              </nav>
            </div>
            
            <div className="footer-nav-group">
              <h4>For Sellers</h4>
              <nav>
                <NavLink to="/dashboard">Seller Dashboard</NavLink>
                <NavLink to="/add-product">Sell Product</NavLink>
                <NavLink to="/profile">My Profile</NavLink>
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
    </div>
  );
}
