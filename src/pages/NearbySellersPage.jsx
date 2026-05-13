import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Navigation, ChevronDown, MapPin, Clock,
  ShoppingBag, ShoppingCart, Star, Store, Shield, Heart,
  Package, Sparkles, Search
} from 'lucide-react';
import { products as allProducts, sellers } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { toast } from 'react-hot-toast';
import './NearbySellersPage.css';
import { useAuth } from '../context/AuthContext';

export default function NearbySellersPage() {
  const { profile } = useAuth();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [nearbyProducts, setNearbyProducts] = useState([]);
  const [likedProducts, setLikedProducts] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.title = "Nearby Sellers | LocalMarket";

    const timer = setTimeout(() => {
      // Sort products by distance (nearest first)
      const sorted = [...allProducts]
        .filter(p => p.inStock)
        .sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99));
      setNearbyProducts(sorted);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
        },
        () => {
          setLocation({ lat: 28.6139, lng: 77.209 });
        }
      );
    }
  };

  const toggleLike = (productId) => {
    setLikedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });
  };

  const filteredNearbyProducts = nearbyProducts.filter(p => !searchTerm || p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="nearby-page">
      {/* Header with Location */}
      <div className="nearby-header glass">
        <div className="container">
          <div className="search-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="location-picker">
              <button className="location-btn" onClick={handleUseLocation}>
                <Navigation size={18} />
                <span>{location ? 'Noida, Sector 62' : 'Detect My Location'}</span>
                <ChevronDown size={14} />
              </button>
            </div>
            <div className="expandable-search-container">
              <Search size={16} className="expandable-search-icon" />
              <input
                type="text"
                className="expandable-search-input"
                placeholder="Search nearby products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="container nearby-main">
        {/* Top Sellers Nearby */}
        <section className="nearby-sellers-strip">
          <h2 className="nearby-section-title">
            <Store size={20} />
            Top Sellers Nearby
          </h2>
          <div className="nearby-sellers-scroll">
            {sellers.map(seller => (
              <NavLink to="/profile" key={seller.id} className="nearby-seller-chip glass">
                <div className="seller-chip-avatar" style={{ background: seller.color }}>
                  {seller.initials}
                  {seller.verified && (
                    <div className="verified-dot"><Shield size={7} fill="white" /></div>
                  )}
                </div>
                <div className="seller-chip-info">
                  <span className="seller-chip-name">{seller.name}</span>
                  <span className="seller-chip-meta">
                    <MapPin size={10} /> {seller.distance} • {seller.rating}★
                  </span>
                </div>
              </NavLink>
            ))}
          </div>
        </section>

        {/* Products Grid */}
        <section className="nearby-products-section">
          <div className="nearby-products-header">
            <h2 className="nearby-section-title">
              <Package size={20} />
              Products Near You
            </h2>
            <span className="nearby-count">
              {filteredNearbyProducts.length} items available
            </span>
          </div>

          <div className="nearby-products-grid">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="nearby-product-card skeleton glass">
                  <div className="skeleton-img" />
                  <div className="skeleton-body">
                    <div className="skeleton-line" />
                    <div className="skeleton-line short" />
                    <div className="skeleton-line shorter" />
                  </div>
                </div>
              ))
            ) : filteredNearbyProducts.length > 0 ? (
              filteredNearbyProducts.map(product => (
                <div key={product.id} className="nearby-product-card glass-card animate-fade-in-up">
                  <div className="npc-image-wrapper">
                    <NavLink to={`/product/${product.id}`}>
                      <img src={product.image} alt={product.title} className="npc-img" loading="lazy" />
                    </NavLink>
                    {product.aiGenerated && (
                      <div className="npc-badge-ai">
                        <Sparkles size={10} /> AI
                      </div>
                    )}
                    <button
                      className={`npc-like-btn ${likedProducts.has(product.id) ? 'liked' : ''}`}
                      onClick={() => toggleLike(product.id)}
                      aria-label={`Like ${product.title}`}
                    >
                      <Heart size={16} fill={likedProducts.has(product.id) ? 'currentColor' : 'none'} />
                    </button>
                    <div className="npc-distance-tag">
                      <MapPin size={10} /> {product.distance}
                    </div>
                    {product.deliveryDays === 0 && (
                      <div className="npc-delivery-tag">⚡ Same Day</div>
                    )}
                  </div>

                  <div className="npc-content">
                    <div className="npc-price-row">
                      <span className="npc-price">₹{product.price.toLocaleString()}</span>
                      {product.originalPrice > product.price && (
                        <span className="npc-original-price">₹{product.originalPrice.toLocaleString()}</span>
                      )}
                      <div className="npc-rating">
                        <Star size={12} fill="#FBBF24" stroke="#FBBF24" />
                        <span>{product.rating}</span>
                      </div>
                    </div>
                    <NavLink to={`/product/${product.id}`} className="npc-title-link">
                      <h3 className="npc-title">{product.title}</h3>
                    </NavLink>
                    <p className="npc-desc">{product.description.substring(0, 70)}...</p>

                    <div className="npc-seller-row">
                      <div className="npc-seller-avatar" style={{ background: product.sellerColor || 'var(--color-primary)' }}>
                        {product.sellerInitials}
                      </div>
                      <div className="npc-seller-info">
                        <span className="npc-seller-name">{product.sellerName}</span>
                        <span className="npc-seller-loc"><Clock size={10} /> Active recently</span>
                      </div>
                    </div>

                    <div className="npc-actions">
                      <button
                        className="btn btn-primary btn-sm btn-full"
                        onClick={() => addToCart(product.id)}
                      >
                        <ShoppingCart size={16} /> Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state glass">
                <div className="empty-icon">
                  <ShoppingBag size={48} />
                </div>
                <h2>No products nearby</h2>
                <p>We couldn't find any sellers in your area. Try expanding your search radius.</p>
              </div>
            )}
          </div>
        </section>
      </main>


    </div>
  );
}
