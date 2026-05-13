import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, MapPin, Shield, Calendar, Edit3, Camera,
  ShoppingBag, Users, Heart, MessageCircle, Share2,
  Settings, Award, Eye, CheckCircle, Package, LogOut,
  User as UserIcon, Mail, CreditCard, AlertTriangle, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sellers, products, reviews } from '../data/mockData';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Base Data
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userRole = profile?.role || 'customer';
  const userInitial = userName.charAt(0).toUpperCase();

  // If role is seller, use mock stats for demonstration
  const isSeller = userRole === 'seller';
  const mockSeller = sellers[0]; 
  const sellerProducts = isSeller ? products.filter(p => p.sellerId === mockSeller.id) : [];

  // State
  const [activeTab, setActiveTab] = useState(isSeller ? 'showcase' : 'orders');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <div className="profile-page animate-fade-in">
      <div className="container">
        {/* Premium Profile Header */}
        <header className="profile-hero glass">
          <div className="profile-cover">
            <div className="cover-overlay"></div>
            <button className="edit-cover glass"><Camera size={18} /></button>
          </div>
          
          <div className="profile-header-main">
            <div className="profile-identity">
              <div className="profile-avatar-box">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="avatar-large-img" />
                ) : (
                  <div className="avatar-large" style={{ background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)' }}>
                    {userInitial}
                  </div>
                )}
                {isSeller && (
                  <div className="verified-badge">
                    <CheckCircle size={20} fill="var(--color-primary)" stroke="white" />
                  </div>
                )}
                <button className="change-avatar glass"><Camera size={14} /></button>
              </div>
              
              <div className="profile-name-section">
                <div className="name-row">
                  <h1 className="user-name">{userName}</h1>
                  <span className="role-badge-inline">{userRole}</span>
                  <div className="profile-actions">
                    <button className="btn btn-outline btn-sm"><Edit3 size={14} /> Edit</button>
                    {isSeller && <button className="btn btn-ghost btn-sm btn-icon"><Share2 size={16} /></button>}
                  </div>
                </div>
                <p className="user-tagline">{profile?.tagline || (isSeller ? mockSeller.tagline : 'Happy shopping!')}</p>
                <div className="user-meta">
                  <span><MapPin size={14} /> {profile?.location || 'Sector 62, Noida'}</span>
                  <span><Calendar size={14} /> Joined {profile?.created_at ? new Date(profile.created_at).getFullYear() : '2023'}</span>
                </div>
              </div>
            </div>

            {isSeller && (
              <div className="profile-stats-grid">
                <div className="p-stat glass">
                  <span className="p-stat-val">{mockSeller.products}</span>
                  <span className="p-stat-lab">Products</span>
                </div>
                <div className="p-stat glass">
                  <span className="p-stat-val">{mockSeller.followers}</span>
                  <span className="p-stat-lab">Followers</span>
                </div>
                <div className="p-stat glass">
                  <span className="p-stat-val">{mockSeller.rating}</span>
                  <span className="p-stat-lab">Rating</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="profile-nav glass scroll-nav">
          {isSeller && (
            <>
              <button className={`nav-link ${activeTab === 'showcase' ? 'active' : ''}`} onClick={() => setActiveTab('showcase')}>
                <ShoppingBag size={18} /><span>Showcase</span>
              </button>
              <button className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
                <Star size={18} /><span>Reviews</span>
              </button>
            </>
          )}
          <button className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <Package size={18} /><span>Orders</span>
          </button>
          <button className={`nav-link ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => setActiveTab('addresses')}>
            <MapPin size={18} /><span>Addresses</span>
          </button>
          <button className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={18} /><span>Settings</span>
          </button>
          {userRole === 'admin' && (
            <button className="nav-link admin-link" onClick={() => navigate('/admin')}>
              <Shield size={18} /><span>Admin Panel</span>
            </button>
          )}
          <button className="nav-link danger-link ml-auto" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>

        {/* Tab Content Area */}
        <div className="tab-content profile-content-unified glass-card">
          
          {/* Showcase Tab (Seller Only) */}
          {activeTab === 'showcase' && isSeller && (
            <div className="products-showcase stagger animate-fade-in-up">
              {sellerProducts.map(product => (
                <div key={product.id} className="showcase-card glass-card">
                  <div className="showcase-media">
                    <img src={product.image} alt={product.title} className="showcase-img" />
                  </div>
                  <div className="showcase-details">
                    <h3 className="showcase-title">{product.title}</h3>
                    <div className="showcase-pricing">
                      <span className="price">₹{product.price}</span>
                      <span className="unit">/{product.unit}</span>
                    </div>
                    <div className="showcase-stats">
                      <span><Eye size={12} /> {product.views}</span>
                      <span><Heart size={12} /> {product.likes}</span>
                      <span><Star size={12} fill="var(--color-warning)" stroke="var(--color-warning)" /> {product.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reviews Tab (Seller Only) */}
          {activeTab === 'reviews' && isSeller && (
            <div className="reviews-section stagger animate-fade-in-up">
              {reviews.map(review => (
                <div key={review.id} className="client-review glass-card">
                  <div className="review-user-info">
                    <div className="review-avatar-sm glass">{review.initials}</div>
                    <div className="review-user-details">
                      <div className="review-name-row">
                        <span className="reviewer-name">{review.userName}</span>
                        {review.verified && <CheckCircle size={14} className="color-primary" />}
                      </div>
                      <span className="review-date">{review.date}</span>
                    </div>
                    <div className="review-rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? 'var(--color-warning)' : 'transparent'} stroke={i < review.rating ? 'var(--color-warning)' : 'var(--color-text-muted)'} />
                      ))}
                    </div>
                  </div>
                  <p className="review-text">{review.comment}</p>
                </div>
              ))}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="tab-pane animate-fade-in-up">
              <div className="pane-header">
                <h2>Order History</h2>
                <p>Track, return, or buy items again.</p>
              </div>
              <div className="empty-state">
                <Package size={48} className="empty-icon" />
                <h3>No orders yet</h3>
                <p>When you buy something, it will appear here.</p>
                <button className="btn btn-primary" onClick={() => navigate('/products')}>Start Shopping</button>
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="tab-pane animate-fade-in-up">
              <div className="pane-header">
                <h2>Saved Addresses</h2>
                <button className="btn btn-outline btn-sm"><MapPin size={14} /> Add New Address</button>
              </div>
              <div className="address-grid">
                <div className="address-card glass">
                  <div className="address-header">
                    <span className="address-label">Home</span>
                    <span className="default-badge">Default</span>
                  </div>
                  <p className="address-text">
                    123 React Street, Apt 4B<br/>
                    Sector 62, Noida<br/>
                    Uttar Pradesh, 201309
                  </p>
                  <div className="address-actions">
                    <button className="btn-link">Edit</button>
                    <button className="btn-link danger">Remove</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="tab-pane animate-fade-in-up">
              <div className="pane-header">
                <h2>Account Settings</h2>
                <p>Manage your personal details and security.</p>
              </div>
              <div className="settings-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-with-icon">
                    <UserIcon size={18} />
                    <input type="text" defaultValue={userName} className="premium-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={18} />
                    <input type="email" defaultValue={userEmail} disabled className="premium-input disabled" />
                  </div>
                </div>
                <div className="form-action-row">
                  <button className="btn btn-primary">Save Changes</button>
                </div>

                <div className="security-section">
                  <h3>Security</h3>
                  <button className="btn btn-outline security-btn">
                    <Shield size={18} /> Change Password <ChevronRight size={18} className="settings-ml-auto" />
                  </button>
                  <button className="btn btn-outline security-btn">
                    <CreditCard size={18} /> Payment Methods <ChevronRight size={18} className="settings-ml-auto" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-card glass-card">
            <div className="modal-icon warning">
              <AlertTriangle size={32} />
            </div>
            <h3>Ready to leave?</h3>
            <p>You are about to securely log out of your account. You will need to enter your credentials to access your profile again.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowLogoutModal(false)} disabled={isLoggingOut}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
