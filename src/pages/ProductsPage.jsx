import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShoppingBag, Plus, Filter, Edit3, Trash2,
  Eye, Heart, Star, MoreVertical, Grid, List,
  Sparkles, TrendingUp, Package, Clock, ExternalLink
} from 'lucide-react';
import { products } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import './ProductsPage.css';

export default function ProductsPage() {
  const [viewMode, setViewMode] = useState('grid');
  const { profile } = useAuth();
  const isSeller = profile?.role === 'seller';

  return (
    <div className="products-page">
      <div className="container">
        <div className="products-header">
          <div>
            <h1 className="products-title">Inventory <span className="gradient-text">Management</span></h1>
            <p className="products-subtitle">{isSeller ? 'Control your listings and track performance.' : 'Browse our high-quality inventory.'}</p>
          </div>
          {isSeller && (
            <NavLink to="/add-product" className="btn btn-primary">
              <Plus size={18} /> New Product
            </NavLink>
          )}
        </div>

        {/* Premium Stats Row */}
        <div className="products-stats stagger">
          <div className="p-stat-card glass-card">
            <div className="p-stat-icon-box color-primary">
              <Package size={22} />
            </div>
            <div className="p-stat-details">
              <span className="p-stat-value">{products.length}</span>
              <span className="p-stat-label">Active Listings</span>
            </div>
          </div>
          <div className="p-stat-card glass-card">
            <div className="p-stat-icon-box color-secondary">
              <Sparkles size={22} />
            </div>
            <div className="p-stat-details">
              <span className="p-stat-value">{products.filter(p => p.aiGenerated).length}</span>
              <span className="p-stat-label">AI Enhanced</span>
            </div>
          </div>
          <div className="p-stat-card glass-card">
            <div className="p-stat-icon-box color-accent">
              <TrendingUp size={22} />
            </div>
            <div className="p-stat-details">
              <span className="p-stat-value">{products.reduce((sum, p) => sum + p.views, 0).toLocaleString()}</span>
              <span className="p-stat-label">Total Impressions</span>
            </div>
          </div>
        </div>

        {/* Management Toolbar */}
        <div className="products-toolbar glass">
          <div className="toolbar-info">
            <span className="products-count">{products.length} Items found</span>
          </div>
          <div className="toolbar-actions">
            <div className="view-selector">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={18} />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Products Display */}
        <div className={viewMode === 'grid' ? 'manage-grid stagger' : 'manage-list'}>
          {products.map((product) => (
            viewMode === 'grid' ? (
              <div key={product.id} className="manage-card glass-card animate-fade-in-up">
                <div className="card-media">
                  <img src={product.image} alt={product.title} className="manage-img" />
                  {product.aiGenerated && (
                    <div className="badge-ai-sm">
                      <Sparkles size={10} /> AI Enhanced
                    </div>
                  )}
                  {isSeller && (
                    <div className="media-overlay">
                      <button className="btn-icon-blur"><Edit3 size={16} /></button>
                      <button className="btn-icon-blur danger"><Trash2 size={16} /></button>
                    </div>
                  )}
                </div>
                <div className="card-info-premium">
                  <div className="card-info-header">
                    <h3 className="product-name">{product.title}</h3>
                    <div className="status-indicator">
                      <div className="pulse-dot"></div>
                      Live
                    </div>
                  </div>
                  <div className="product-meta-row">
                    <span className="product-price-tag">₹{product.price}</span>
                    <span className="product-cat-tag">{product.category}</span>
                  </div>
                  <div className="product-analytics-grid">
                    <div className="p-analytic-item">
                      <Eye size={14} /> <span>{product.views}</span>
                      <small>Views</small>
                    </div>
                    <div className="p-analytic-item">
                      <Heart size={14} /> <span>{product.likes}</span>
                      <small>Likes</small>
                    </div>
                    <div className="p-analytic-item">
                      <Star size={14} className="color-warning" fill="currentColor" /> <span>{product.rating}</span>
                      <small>Rating</small>
                    </div>
                  </div>
                  <div className="card-footer-actions">
                    <NavLink to={`/product/${product.id}`} className="btn btn-outline btn-sm btn-full">
                      <ExternalLink size={14} /> View Details
                    </NavLink>
                  </div>
                </div>
              </div>
            ) : (
              <div key={product.id} className="manage-list-item glass-card animate-fade-in-up">
                <NavLink to={`/product/${product.id}`} className="list-product-box">
                  <div className="list-thumb-container">
                    <img src={product.image} alt={product.title} className="list-thumb-img" />
                  </div>
                  <div className="list-info-content">
                    <h3 className="list-product-name">{product.title}</h3>
                    <div className="list-product-meta">
                      <span className="list-cat">{product.category}</span>
                      <span className="list-dot"></span>
                      <span className="list-date">Added 2 days ago</span>
                    </div>
                  </div>
                </NavLink>
                <div className="list-price-box">
                  <span className="list-price-label">Price</span>
                  <span className="list-price-value">₹{product.price}</span>
                </div>
                <div className="list-analytics-box">
                  <div className="list-stat"><Eye size={16} /> {product.views}</div>
                  <div className="list-stat"><Heart size={16} /> {product.likes}</div>
                </div>
                <div className="list-actions-box">
                  <NavLink to={`/product/${product.id}`} className="btn-icon-md glass" title="View Details">
                    <Eye size={18} />
                  </NavLink>
                  {isSeller && (
                    <>
                      <button className="btn-icon-md glass"><Edit3 size={18} /></button>
                      <button className="btn-icon-md glass danger"><Trash2 size={18} /></button>
                    </>
                  )}
                </div>
              </div>
            )
          ))}
        </div>

        {products.length === 0 && (
          <div className="empty-inventory glass">
            <ShoppingBag size={64} className="color-text-muted" />
            <h3>Your inventory is empty</h3>
            <p>Start listing your products and reach customers in your neighborhood.</p>
            <NavLink to="/add-product" className="btn btn-primary mt-xl">
              <Plus size={18} /> Add Your First Product
            </NavLink>
          </div>
        )}
      </div>
    </div>
  );
}
