import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  MapPin, Search, Star, Heart, ShoppingCart,
  Share2, ShoppingBag, Shield, Sparkles, SlidersHorizontal,
  ChevronDown, Clock, Users, Plus, X, Filter, RotateCcw
} from 'lucide-react';
import { products as allProducts, categories, sellers } from '../data/mockData';
import useProductFilters from '../hooks/useProductFilters';
import ProductFilterSidebar from '../components/ProductFilterSidebar';
import { useCart } from '../context/CartContext';
import { toast } from 'react-hot-toast';
import '../components/ProductFilterSidebar.css';
import './FeedPage.css';

function SkeletonCard() {
  return (
    <div className="pf-skeleton-card">
      <div className="pf-skeleton-img" />
      <div className="pf-skeleton-body">
        <div className="pf-skeleton-line h-6 w-60" />
        <div className="pf-skeleton-line w-80" />
        <div className="pf-skeleton-line w-40" />
      </div>
    </div>
  );
}

function ActiveFilterTags({ filters, filterOptions, updateFilter, toggleArrayFilter, clearAllFilters }) {
  const tags = [];

  filters.categories.forEach(cat => {
    tags.push({ key: `cat-${cat}`, label: cat, onRemove: () => toggleArrayFilter('categories', cat) });
  });
  filters.brands.forEach(brand => {
    tags.push({ key: `brand-${brand}`, label: brand, onRemove: () => toggleArrayFilter('brands', brand) });
  });
  if (filters.priceRange[0] > 0 || filters.priceRange[1] < 15000) {
    tags.push({
      key: 'price',
      label: `₹${filters.priceRange[0]} - ₹${filters.priceRange[1]}`,
      onRemove: () => updateFilter('priceRange', [0, 15000])
    });
  }
  if (filters.minRating > 0) {
    tags.push({
      key: 'rating',
      label: `${filters.minRating}★ & up`,
      onRemove: () => updateFilter('minRating', 0)
    });
  }
  if (filters.availability !== 'all') {
    tags.push({
      key: 'avail',
      label: filters.availability === 'in_stock' ? 'In Stock' : 'Out of Stock',
      onRemove: () => updateFilter('availability', 'all')
    });
  }
  if (filters.deliveryTime !== 'all') {
    const labels = { same_day: 'Same Day', '1_2_days': '1-2 Days', '3_5_days': '3-5 Days' };
    tags.push({
      key: 'delivery',
      label: labels[filters.deliveryTime],
      onRemove: () => updateFilter('deliveryTime', 'all')
    });
  }
  if (filters.maxDistance < 10) {
    tags.push({
      key: 'distance',
      label: `Within ${filters.maxDistance} km`,
      onRemove: () => updateFilter('maxDistance', 10)
    });
  }

  if (tags.length === 0) return null;

  return (
    <div className="pf-active-tags">
      {tags.map(tag => (
        <span key={tag.key} className="pf-tag">
          {tag.label}
          <button className="pf-tag-remove" onClick={tag.onRemove}>
            <X size={10} />
          </button>
        </span>
      ))}
      {tags.length > 1 && (
        <button className="pf-tag pf-tag-clear" onClick={clearAllFilters} style={{
          background: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.2)',
          color: '#f87171',
          cursor: 'pointer'
        }}>
          <RotateCcw size={10} /> Clear All
        </button>
      )}
    </div>
  );
}

export default function FeedPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [likedProducts, setLikedProducts] = useState(new Set());
  const { addToCart } = useCart();

  const {
    filters,
    filteredProducts,
    filterOptions,
    isLoading,
    activeFilterCount,
    updateFilter,
    toggleArrayFilter,
    clearAllFilters,
    totalCount,
    setPage,
  } = useProductFilters(allProducts);

  const toggleLike = (productId) => {
    setLikedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });
  };

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
                placeholder="Search products, brands, categories..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="search-input"
                id="feed-search-input"
              />
              {filters.search && (
                <button className="search-clear" onClick={() => updateFilter('search', '')}>
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="toolbar-divider" />
            <div className="feed-filter-actions">
              <button
                className="pf-mobile-toggle"
                onClick={() => setSidebarOpen(true)}
                id="filter-toggle-btn"
              >
                <Filter size={16} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="pf-mobile-badge">{activeFilterCount}</span>
                )}
              </button>
              <div className="pf-sort-select">
                <SlidersHorizontal size={14} />
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                  id="sort-select"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest First</option>
                  <option value="distance">Nearest First</option>
                </select>
              </div>
            </div>
          </div>

          <div className="feed-categories-scroll">
            <button
              className={`cat-pill ${filters.categories.length === 0 ? 'active' : ''}`}
              onClick={() => updateFilter('categories', [])}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`cat-pill ${filters.categories.includes(cat.name) ? 'active' : ''}`}
                onClick={() => {
                  if (filters.categories.includes(cat.name)) {
                    updateFilter('categories', filters.categories.filter(c => c !== cat.name));
                  } else {
                    updateFilter('categories', [...filters.categories, cat.name]);
                  }
                }}
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

        {/* Main Layout: Sidebar + Content */}
        <div className="pf-page-layout">
          <ProductFilterSidebar
            filters={filters}
            filterOptions={filterOptions}
            activeFilterCount={activeFilterCount}
            updateFilter={updateFilter}
            toggleArrayFilter={toggleArrayFilter}
            clearAllFilters={clearAllFilters}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            products={allProducts}
          />

          <div className="pf-main-content">
            {/* Active Filter Tags */}
            <ActiveFilterTags
              filters={filters}
              filterOptions={filterOptions}
              updateFilter={updateFilter}
              toggleArrayFilter={toggleArrayFilter}
              clearAllFilters={clearAllFilters}
            />

            {/* Results Bar */}
            <div className="pf-results-bar">
              <span className="pf-results-count">
                Showing <strong>{filteredProducts.length}</strong> of <strong>{totalCount || filteredProducts.length}</strong> products
              </span>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="pf-skeleton-grid">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredProducts.length > 0 ? (
              /* Product Grid */
              <div className="feed-grid stagger">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="feed-card-premium glass-card animate-fade-in-up">
                    <div className="card-image-wrapper">
                      <NavLink to={`/product/${product.id}`}>
                        <img src={product.image} alt={product.title} className="card-img" loading="lazy" />
                      </NavLink>
                      {product.aiGenerated && (
                        <div className="badge-ai">
                          <Sparkles size={10} /> AI Optimized
                        </div>
                      )}
                      {!product.inStock && (
                        <div className="badge-oos">Out of Stock</div>
                      )}
                      <button
                        className={`like-btn ${likedProducts.has(product.id) ? 'liked' : ''}`}
                        onClick={() => toggleLike(product.id)}
                        aria-label={`Like ${product.title}`}
                      >
                        <Heart size={18} fill={likedProducts.has(product.id) ? 'currentColor' : 'none'} />
                      </button>
                      <div className="distance-tag">
                        <MapPin size={10} /> {product.distance}
                      </div>
                    </div>

                    <div className="card-content">
                      <div className="card-header">
                        <span className="card-price">₹{product.price.toLocaleString()}</span>
                        <div className="card-rating-stars">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              fill={i < Math.floor(product.rating) ? "#FBBF24" : "none"} 
                              stroke={i < Math.floor(product.rating) ? "#FBBF24" : "#94a3b8"} 
                            />
                          ))}
                          <span className="rating-value">{product.rating}</span>
                        </div>
                      </div>
                      <NavLink to={`/product/${product.id}`} className="card-title-link">
                        <h3 className="card-title">{product.title}</h3>
                      </NavLink>
                      <p className="card-desc">{product.description.substring(0, 60)}...</p>

                      <div className="card-meta-tags">
                        {product.brand && <span className="card-brand-tag">{product.brand}</span>}
                        {product.deliveryDays === 0 && <span className="card-delivery-tag">⚡ Same Day</span>}
                        {product.deliveryDays > 0 && product.deliveryDays <= 2 && (
                          <span className="card-delivery-tag">🚚 {product.deliveryDays}d delivery</span>
                        )}
                      </div>

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
                        <button 
                          className="btn btn-primary btn-sm btn-full"
                          onClick={() => addToCart(product.id)}
                        >
                          <ShoppingCart size={16} /> Add to Cart
                        </button>
                        <button className="btn-icon-sm glass" aria-label="Share">
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="pf-empty-state">
                <div className="pf-empty-icon">
                  <ShoppingBag size={40} />
                </div>
                <h3>No products found</h3>
                <p>Try adjusting your filters or search keywords to find what you're looking for.</p>
                <button className="btn btn-primary" onClick={() => { clearAllFilters(); }}>
                  <RotateCcw size={16} /> Reset All Filters
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalCount > 20 && (
              <div className="pf-pagination">
                <button 
                  className="btn btn-outline btn-sm" 
                  disabled={filters.page <= 1}
                  onClick={() => {
                    setPage(filters.page - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Previous
                </button>
                <span className="pf-page-indicator">Page {filters.page} of {Math.ceil(totalCount / 20)}</span>
                <button 
                  className="btn btn-outline btn-sm"
                  disabled={filters.page >= Math.ceil(totalCount / 20)}
                  onClick={() => {
                    setPage(filters.page + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        <NavLink to="/add-product" className="fab-create pulse-glow" aria-label="Add Product">
          <Plus size={24} />
        </NavLink>
      </div>

    </div>
  );
}
