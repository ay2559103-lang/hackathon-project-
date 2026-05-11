import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  MapPin, Search, Filter, Star, Heart, MessageCircle,
  Eye, Share2, ShoppingBag, Shield, Sparkles, SlidersHorizontal, ChevronDown,
  ArrowUpRight, Clock, Users
} from 'lucide-react';
import { products, categories, sellers } from '../data/mockData';
import './FeedPage.css';

export default function FeedPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedProducts, setLikedProducts] = useState(new Set());
  const [sortBy, setSortBy] = useState('nearby');

  const toggleLike = (productId) => {
    setLikedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });
  };

  const filteredProducts = products.filter(p => {
    if (activeCategory !== 'All' && p.category !== activeCategory) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="feed-page">
      {/* Premium Header */}
      <div className="feed-header">
        <div className="container">
          <div className="feed-header-top">
            <div>
              <h1 className="feed-title">Local <span className="gradient-text">Discovery</span></h1>
              <p className="feed-subtitle">Handpicked treasures from your neighborhood.</p>
            </div>
            <div className="feed-location glass">
              <MapPin size={16} className="color-primary" />
              <span>Noida, Sector 62</span>
              <ChevronDown size={14} />
            </div>
          </div>

          <div className="feed-toolbar glass">
            <div className="feed-search">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search local products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="toolbar-divider"></div>
            <div className="feed-filter-actions">
              <div className="sort-box">
                <SlidersHorizontal size={16} />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="nearby">Nearest First</option>
                  <option value="popular">Popularity</option>
                  <option value="price-low">Price: Low to High</option>
                </select>
              </div>
            </div>
          </div>

          <div className="feed-categories-scroll">
            <button
              className={`cat-pill ${activeCategory === 'All' ? 'active' : ''}`}
              onClick={() => setActiveCategory('All')}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`cat-pill ${activeCategory === cat.name ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.name)}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        {/* Nearby Sellers Row */}
        <section className="nearby-sellers-section">
          <div className="section-header-sm">
            <h2 className="section-title-sm"><Users size={18} /> Top Sellers Nearby</h2>
          </div>
          <div className="sellers-row-scroll">
            {sellers.map(seller => (
              <NavLink to={`/profile`} key={seller.id} className="seller-row-card glass">
                <div className="seller-row-avatar" style={{ background: seller.color }}>
                  {seller.initials}
                  {seller.verified && <div className="verified-badge-sm"><Shield size={8} fill="white" /></div>}
                </div>
                <div className="seller-row-info">
                  <span className="seller-row-name">{seller.name}</span>
                  <span className="seller-row-meta">{seller.distance} • {seller.rating}★</span>
                </div>
              </NavLink>
            ))}
          </div>
        </section>

        {/* Product Grid */}
        <div className="feed-grid stagger">
          {filteredProducts.map((product) => (
            <div key={product.id} className="feed-card-premium glass-card animate-fade-in-up">
              <div className="card-image-wrapper">
                <img src={product.image} alt={product.title} className="card-img" />
                {product.aiGenerated && (
                  <div className="badge-ai">
                    <Sparkles size={10} /> AI Optimized
                  </div>
                )}
                <button
                  className={`like-btn ${likedProducts.has(product.id) ? 'liked' : ''}`}
                  onClick={() => toggleLike(product.id)}
                >
                  <Heart size={18} fill={likedProducts.has(product.id) ? 'currentColor' : 'none'} />
                </button>
                <div className="distance-tag">
                  <MapPin size={10} /> {product.distance}
                </div>
              </div>

              <div className="card-content">
                <div className="card-header">
                  <span className="card-price">₹{product.price}</span>
                  <div className="card-rating">
                    <Star size={12} fill="var(--color-warning)" stroke="var(--color-warning)" />
                    <span>{product.rating}</span>
                  </div>
                </div>
                <h3 className="card-title">{product.title}</h3>
                <p className="card-desc">{product.description.substring(0, 60)}...</p>
                
                <div className="card-seller">
                  <div className="seller-avatar" style={{ background: product.sellerColor || 'var(--color-primary)' }}>
                    {product.sellerInitials}
                  </div>
                  <div className="seller-info">
                    <span className="seller-name">{product.sellerName}</span>
                    <span className="seller-status"><Clock size={10} /> Active 2h ago</span>
                  </div>
                </div>

                <div className="card-actions">
                  <NavLink to="/chat" className="btn btn-primary btn-sm btn-full">
                    <MessageCircle size={16} /> Chat
                  </NavLink>
                  <button className="btn-icon-sm glass">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="empty-state glass">
            <ShoppingBag size={64} className="color-text-muted" />
            <h3>No results found</h3>
            <p>Try adjusting your filters or search keywords.</p>
            <button className="btn btn-outline" onClick={() => {setActiveCategory('All'); setSearchQuery('');}}>
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
