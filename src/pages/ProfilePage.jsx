import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Star, MapPin, Shield, Calendar, Edit3, Camera,
  ShoppingBag, Users, Heart, MessageCircle, Share2,
  Settings, Award, Eye, CheckCircle
} from 'lucide-react';
import { sellers, products, reviews } from '../data/mockData';
import './ProfilePage.css';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('products');
  const seller = sellers[0]; // Current user profile
  const sellerProducts = products.filter(p => p.sellerId === seller.id);

  return (
    <div className="profile-page">
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
                <div className="avatar-large" style={{ background: seller.color }}>
                  {seller.initials}
                </div>
                {seller.verified && (
                  <div className="verified-badge">
                    <CheckCircle size={20} fill="var(--color-primary)" stroke="white" />
                  </div>
                )}
                <button className="change-avatar glass"><Camera size={14} /></button>
              </div>
              
              <div className="profile-name-section">
                <div className="name-row">
                  <h1 className="user-name">{seller.name}</h1>
                  <div className="profile-actions">
                    <button className="btn btn-outline btn-sm"><Edit3 size={14} /> Edit</button>
                    <button className="btn btn-ghost btn-sm btn-icon"><Share2 size={16} /></button>
                  </div>
                </div>
                <p className="user-tagline">{seller.tagline}</p>
                <div className="user-meta">
                  <span><MapPin size={14} /> {seller.location}</span>
                  <span><Calendar size={14} /> Joined {seller.joinDate}</span>
                </div>
              </div>
            </div>

            <div className="profile-stats-grid">
              <div className="p-stat glass">
                <span className="p-stat-val">{seller.products}</span>
                <span className="p-stat-lab">Products</span>
              </div>
              <div className="p-stat glass">
                <span className="p-stat-val">{seller.followers}</span>
                <span className="p-stat-lab">Followers</span>
              </div>
              <div className="p-stat glass">
                <span className="p-stat-val">{seller.rating}</span>
                <span className="p-stat-lab">Rating</span>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="profile-nav glass">
          <button 
            className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <ShoppingBag size={18} />
            <span>Showcase ({sellerProducts.length})</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <Star size={18} />
            <span>Client Reviews ({reviews.length})</span>
          </button>
        </nav>

        {/* Tab Content Area */}
        <div className="tab-content">
          {activeTab === 'products' && (
            <div className="products-showcase stagger">
              {sellerProducts.map(product => (
                <div key={product.id} className="showcase-card glass-card animate-fade-in-up">
                  <div className="showcase-media">
                    <div className="media-placeholder-lg">
                      {product.category === 'Fresh Produce' ? '🥬' : '📦'}
                    </div>
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

          {activeTab === 'reviews' && (
            <div className="reviews-section stagger">
              {reviews.map(review => (
                <div key={review.id} className="client-review glass-card animate-fade-in-up">
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
                        <Star 
                          key={i} 
                          size={14} 
                          fill={i < review.rating ? 'var(--color-warning)' : 'transparent'} 
                          stroke={i < review.rating ? 'var(--color-warning)' : 'var(--color-text-muted)'} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="review-text">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
