import { useState, useEffect } from 'react';
import { 
  Search, MapPin, Navigation, Filter, Map as MapIcon, 
  List, Star, Clock, ShoppingBag, ChevronDown, 
  TrendingDown, Zap, Heart, MessageSquare, ExternalLink,
  ChevronRight, ArrowRight, Store, Package, Info
} from 'lucide-react';
import './NearbySellersPage.css';

// Mock Data for Nearby Sellers
const MOCK_SELLERS = [
  {
    id: 1,
    name: 'Green Apple Mart',
    distance: 1.2,
    rating: 4.8,
    reviews: 128,
    deliveryEta: '15-20 min',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
    product: {
      name: 'Organic Avocado (Pack of 2)',
      price: 199,
      originalPrice: 249,
      discount: '20% OFF',
      image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=400',
      inStock: true
    },
    badge: 'Best Deal',
    lat: 12.9716,
    lng: 77.5946
  },
  {
    id: 2,
    name: 'Daily Fresh Groceries',
    distance: 0.8,
    rating: 4.5,
    reviews: 85,
    deliveryEta: '10-15 min',
    image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=400',
    product: {
      name: 'Organic Avocado (Pack of 2)',
      price: 210,
      originalPrice: 249,
      discount: '15% OFF',
      image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=400',
      inStock: true
    },
    badge: 'Nearest',
    lat: 12.9720,
    lng: 77.5940
  },
  {
    id: 3,
    name: 'Super Save Supermarket',
    distance: 2.5,
    rating: 4.2,
    reviews: 210,
    deliveryEta: '25-30 min',
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=400',
    product: {
      name: 'Organic Avocado (Pack of 2)',
      price: 185,
      originalPrice: 249,
      discount: '25% OFF',
      image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=400',
      inStock: true
    },
    lat: 12.9730,
    lng: 77.5960
  },
  {
    id: 4,
    name: 'Local Organics',
    distance: 3.1,
    rating: 4.9,
    reviews: 56,
    deliveryEta: '30-40 min',
    image: 'https://images.unsplash.com/photo-1488459718231-338a830638a4?auto=format&fit=crop&q=80&w=400',
    product: {
      name: 'Organic Avocado (Pack of 2)',
      price: 225,
      originalPrice: 249,
      discount: '10% OFF',
      image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=400',
      inStock: true
    },
    lat: 12.9740,
    lng: 77.5980
  }
];

export default function NearbySellersPage() {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [location, setLocation] = useState(null);
  const [radius, setRadius] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [sellers, setSellers] = useState([]);
  const [sortBy, setSortBy] = useState('price'); // 'price', 'distance', 'delivery', 'rating'
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    document.title = "Nearby Sellers & Price Comparison | LocalSell";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Find and compare prices from local sellers near you. Get the best deals with real-time distance and delivery tracking.");
    }
  }, []);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      // Add dynamic badges based on data
      const processedSellers = MOCK_SELLERS.map(s => ({ ...s, badge: null }));
      
      // Find lowest price
      const minPrice = Math.min(...processedSellers.map(s => s.product.price));
      const bestDealIndex = processedSellers.findIndex(s => s.product.price === minPrice);
      if (bestDealIndex !== -1) processedSellers[bestDealIndex].badge = 'Best Deal';

      // Find nearest
      const minDistance = Math.min(...processedSellers.map(s => s.distance));
      const nearestIndex = processedSellers.findIndex(s => s.distance === minDistance);
      if (nearestIndex !== -1 && nearestIndex !== bestDealIndex) {
        processedSellers[nearestIndex].badge = 'Nearest';
      }

      setSellers(processedSellers);
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // API Integration Example
  const fetchNearbySellers = async (lat, lng, rad) => {
    setLoading(true);
    try {
      // const response = await fetch(`/api/sellers/nearby?lat=${lat}&lng=${lng}&radius=${rad}&query=${searchQuery}`);
      // const data = await response.json();
      // setSellers(data);
    } catch (error) {
      console.error("Failed to fetch sellers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          // fetchNearbySellers(latitude, longitude, radius);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to mock location
          setLocation({ lat: 12.9716, lng: 77.5946 });
        }
      );
    }
  };

  const sortedSellers = [...sellers].sort((a, b) => {
    if (sortBy === 'price') return a.product.price - b.product.price;
    if (sortBy === 'distance') return a.distance - b.distance;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'delivery') {
      const getMinEta = (eta) => parseInt(eta.split('-')[0]);
      return getMinEta(a.deliveryEta) - getMinEta(b.deliveryEta);
    }
    return 0;
  });

  const SkeletonCard = () => (
    <div className="seller-card skeleton">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-price"></div>
        <div className="skeleton-button"></div>
      </div>
    </div>
  );

  return (
    <div className="nearby-page">
      <div className="nearby-header glass">
        <div className="container">
          <div className="search-section">
            <div className="location-picker">
              <button className="location-btn" onClick={handleUseLocation}>
                <Navigation size={18} />
                <span>{location ? `Nearby Bangalore` : 'Detect My Location'}</span>
                <ChevronDown size={14} />
              </button>
            </div>
            
            <div className="search-bar-wrapper">
              <div className="search-input-group">
                <Search className="search-icon" size={20} />
                <input 
                  type="text" 
                  placeholder="Search products (e.g. Avocado, Milk, Eggs...)" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="btn btn-primary search-submit">Search</button>
            </div>

            <div className="view-toggle">
              <button 
                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
                <span>List</span>
              </button>
              <button 
                className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
              >
                <MapIcon size={18} />
                <span>Map</span>
              </button>
            </div>
          </div>

          <div className="filter-chips">
            <div className="radius-selector">
              <span>Radius:</span>
              {[2, 5, 10, 20].map(r => (
                <button 
                  key={r} 
                  className={`chip ${radius === r ? 'active' : ''}`}
                  onClick={() => setRadius(r)}
                >
                  {r}km
                </button>
              ))}
            </div>
            <div className="divider"></div>
            <div className="sort-selector">
              <span>Sort by:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="price">Lowest Price</option>
                <option value="distance">Nearest Seller</option>
                <option value="delivery">Fastest Delivery</option>
                <option value="rating">Highest Rating</option>
              </select>
            </div>
            <button className="filter-more" onClick={() => setShowFilters(true)}>
              <Filter size={16} />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      <main className="container nearby-main">
        {viewMode === 'list' ? (
          <div className="content-layout">
            <aside className={`filter-sidebar glass ${showFilters ? 'open' : ''}`}>
              <div className="sidebar-header">
                <h3>Filters</h3>
                <button className="close-filters" onClick={() => setShowFilters(false)}>
                  <ChevronDown size={20} />
                </button>
              </div>
              
              <div className="filter-group">
                <h4>Price Range</h4>
                <div className="price-range-inputs">
                  <input type="number" placeholder="Min" />
                  <span>-</span>
                  <input type="number" placeholder="Max" />
                </div>
              </div>

              <div className="filter-group">
                <h4>Availability</h4>
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>In Stock Only</span>
                </label>
              </div>

              <div className="filter-group">
                <h4>Rating</h4>
                {[4, 3, 2].map(star => (
                  <label key={star} className="checkbox-label">
                    <input type="checkbox" />
                    <span>{star}+ Stars</span>
                  </label>
                ))}
              </div>

              <button className="btn btn-primary btn-full apply-filters">Apply Filters</button>
            </aside>

            <div className="sellers-grid-container">
              {loading ? (
                <div className="sellers-grid">
                  {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : sellers.length > 0 ? (
                <>
                  <div className="grid-header">
                    <h2>Found {sellers.length} sellers nearby</h2>
                    <p>Comparing prices for "Organic Avocado"</p>
                  </div>
                  
                  <div className="sellers-grid">
                    {sortedSellers.map(seller => (
                      <div key={seller.id} className="seller-card glass">
                        {seller.badge && (
                          <div className={`seller-badge ${seller.badge.toLowerCase().replace(' ', '-')}`}>
                            {seller.badge === 'Best Deal' ? <TrendingDown size={14} /> : <Zap size={14} />}
                            {seller.badge}
                          </div>
                        )}
                        <div className="seller-image-wrapper">
                          <img src={seller.image} alt={seller.name} className="seller-image" />
                          <div className="distance-overlay">
                            <MapPin size={12} />
                            {seller.distance} km
                          </div>
                          <button className="wishlist-btn">
                            <Heart size={18} />
                          </button>
                        </div>
                        
                        <div className="seller-info">
                          <div className="seller-meta">
                            <h3 className="seller-name">{seller.name}</h3>
                            <div className="seller-rating">
                              <Star size={14} className="star-icon" fill="currentColor" />
                              <span>{seller.rating}</span>
                              <span className="reviews">({seller.reviews})</span>
                            </div>
                          </div>

                          <div className="product-info-mini">
                            <div className="product-image-mini">
                              <img src={seller.product.image} alt={seller.product.name} />
                            </div>
                            <div className="product-details-mini">
                              <span className="product-name-mini">{seller.product.name}</span>
                              <div className="product-status">
                                {seller.product.inStock ? (
                                  <span className="status-in-stock">In Stock</span>
                                ) : (
                                  <span className="status-out-stock">Out of Stock</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="price-comparison">
                            <div className="price-box">
                              <span className="current-price">₹{seller.product.price}</span>
                              <span className="original-price">₹{seller.product.originalPrice}</span>
                              <span className="discount-tag">{seller.product.discount}</span>
                            </div>
                            <div className="delivery-eta">
                              <Clock size={14} />
                              <span>{seller.deliveryEta}</span>
                            </div>
                          </div>

                          <div className="seller-actions">
                            <button className="btn btn-secondary btn-sm contact-btn">
                              <MessageSquare size={16} />
                              <span>Chat</span>
                            </button>
                            <button className="btn btn-primary btn-sm cart-btn">
                              <ShoppingBag size={16} />
                              <span>Add to Cart</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="seller-footer">
                          <button className="view-store-link">
                            <span>View Store Details</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="comparison-table-section glass">
                    <h3>Price Comparison Summary</h3>
                    <div className="comparison-table-wrapper">
                      <table className="comparison-table">
                        <thead>
                          <tr>
                            <th>Seller</th>
                            <th>Price</th>
                            <th>Savings</th>
                            <th>Distance</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedSellers.map(seller => (
                            <tr key={seller.id} className={seller.badge === 'Best Deal' ? 'highlight-row' : ''}>
                              <td>
                                <div className="table-seller">
                                  <Store size={16} />
                                  <span>{seller.name}</span>
                                </div>
                              </td>
                              <td className="table-price">₹{seller.product.price}</td>
                              <td className="table-savings text-success">
                                {seller.badge === 'Best Deal' ? 'Best Price' : `+ ₹${seller.product.price - Math.min(...sellers.map(s => s.product.price))}`}
                              </td>
                              <td>{seller.distance} km</td>
                              <td>
                                <button className="btn btn-ghost btn-xs">Quick Buy</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state glass">
                  <div className="empty-icon">
                    <Search size={48} />
                  </div>
                  <h2>No sellers found nearby</h2>
                  <p>Try increasing your search radius or changing the search query.</p>
                  <button className="btn btn-primary" onClick={() => setRadius(10)}>
                    Expand Radius to 10km
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="map-view-container glass">
            <div className="map-placeholder">
              <div className="map-instructions">
                <MapPin size={40} className="pulse" />
                <h3>Map View Integrated</h3>
                <p>Showing {sellers.length} sellers on the map around your location.</p>
                <div className="map-stats">
                  <div className="stat">
                    <span>{sellers.length}</span>
                    <label>Sellers</label>
                  </div>
                  <div className="stat">
                    <span>₹{Math.min(...sellers.map(s => s.product.price))}</span>
                    <label>Min Price</label>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => setViewMode('list')}>
                  Back to List View
                </button>
              </div>
              
              {/* This would be the Google Maps component in a real app */}
              <div className="mock-map">
                {sellers.map(seller => (
                  <div 
                    key={seller.id} 
                    className="map-marker"
                    style={{ 
                      top: `${40 + (seller.lat - 12.9716) * 500}%`, 
                      left: `${50 + (seller.lng - 77.5946) * 500}%` 
                    }}
                  >
                    <div className="marker-pin">
                      <Store size={16} />
                    </div>
                    <div className="marker-label glass">
                      <span>₹{seller.product.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <section className="best-deals-banner">
        <div className="container">
          <div className="banner-content glass">
            <div className="banner-info">
              <span className="banner-tag">Flash Deal</span>
              <h2>Get up to 40% OFF on nearby grocery stores</h2>
              <p>Exclusive deals for your location. Limited time offer.</p>
            </div>
            <button className="btn btn-light banner-btn">
              Explore Deals
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
