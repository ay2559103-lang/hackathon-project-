import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, ShoppingBag, Package, 
  Truck, FileText, Settings, LogOut, 
  Bell, Menu, X, ShieldAlert, BarChart, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const adminNavItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Analytics Overview' },
  { path: '/admin/users', icon: Users, label: 'User Management' },
  { path: '/admin/products', icon: ShoppingBag, label: 'Product Management' },
  { path: '/admin/orders', icon: Package, label: 'Order & Refunds' },
  { path: '/admin/delivery', icon: Truck, label: 'Delivery Network' },
  { path: '/admin/reports', icon: FileText, label: 'Export Reports' },
  { path: '/admin/settings', icon: Settings, label: 'Platform Settings' },
];

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar glass ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <ShieldAlert size={24} className="color-primary" />
            {sidebarOpen && <span>Admin Control</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="admin-nav">
          {adminNavItems.map(item => (
            <NavLink 
              key={item.path} 
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          {sidebarOpen ? (
            <div className="admin-profile">
              <div className="admin-avatar">{profile?.full_name?.charAt(0) || 'A'}</div>
              <div className="admin-info">
                <span className="admin-name">{profile?.full_name || 'Super Admin'}</span>
                <span className="admin-role">System Administrator</span>
              </div>
            </div>
          ) : (
            <div className="admin-avatar">{profile?.full_name?.charAt(0) || 'A'}</div>
          )}
          <button className="admin-logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-topbar glass">

          <div className="admin-topbar-actions">
            <button className="admin-icon-btn">
              <Bell size={20} />
              <span className="admin-badge">3</span>
            </button>
            <div className="admin-date">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
