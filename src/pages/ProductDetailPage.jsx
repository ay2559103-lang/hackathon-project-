import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, ShoppingCart, Heart, Share2,
  MapPin, ShieldCheck, Truck, Phone,
  MessageSquare, ChevronRight, AlertCircle,
  ArrowLeft, Store, Info, CheckCircle2,
  Package, RotateCcw, Zap, CreditCard,
  Plus, Minus, X, Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { productService } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { products as mockProducts, reviews as mockReviews } from '../data/mockData';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  // Data State
  const [product, setProduct] = useState(null);
  const [nearbyPrices, setNearbyPrices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI State
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [showFullGallery, setShowFullGallery] = useState(false);

  // Review Form State
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', name: '' });

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProductData();
  }, [id]);

  async function loadProductData() {
    setLoading(true);
    setError(null);
    try {
      // 1. Try fetching from Supabase
      const [prodRes, pricesRes, reviewsRes] = await Promise.all([
        productService.getProductById(id),
        productService.getNearbyPrices(id),
        productService.getProductReviews(id)
      ]);

      if (!prodRes.error && prodRes.data) {
        setProduct(prodRes.data);
        setNearbyPrices(pricesRes.data || []);
        setReviews(reviewsRes.data || []);

        if (prodRes.data.images?.length > 0) {
          const primary = prodRes.data.images.find(img => img.is_primary);
          setActiveImage(primary ? prodRes.data.images.indexOf(primary) : 0);
        }
      } else {
        // 2. Fallback to Mock Data
        const mockItem = mockProducts.find(p => p.id.toString() === id.toString());
        if (mockItem) {
          setProduct(mockItem);
          setNearbyPrices([]);
          setReviews(mockReviews);
        } else {
          throw new Error('Product not found');
        }
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setError('Product failed to load.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddToCart = async () => {
    await addToCart(id, quantity);
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.error('Please login to use wishlist');
      return;
    }
    const { action, error } = await productService.toggleWishlist(user.id, id);
    if (!error) {
      setIsWishlisted(action === 'added');
      toast.success(action === 'added' ? 'Added to wishlist' : 'Removed from wishlist');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Product link copied!');
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    const newReview = {
      id: Date.now(),
      userName: reviewForm.name || 'Anonymous',
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      date: 'Just now',
      verified: false
    };
    setReviews([newReview, ...reviews]);
    setReviewForm({ rating: 5, comment: '', name: '' });
    toast.success('Review submitted for approval!');
  };

  if (loading) return <PDPSkeleton />;
  if (error || !product) return <ErrorState message={error} onRetry={() => navigate('/feed')} />;

  const images = product.images?.length > 0 ? product.images : [{ url: product.image || product.image_url }];
  const discountPercent = product.original_price || product.originalPrice
    ? Math.round((((product.original_price || product.originalPrice) - (product.price || product.price)) / (product.original_price || product.originalPrice)) * 100)
    : 0;

  return (
    <div className="pdp-container">
      {/* Breadcrumbs */}
      <nav className="pdp-breadcrumb">
        <span onClick={() => navigate('/feed')}>Home</span>
        <ChevronRight size={14} />
        <span>{product.category?.name || product.category || 'Product'}</span>
        <ChevronRight size={14} />
        <span className="active">{product.title}</span>
      </nav>

      <div className="pdp-layout">
        {/* Gallery Section */}
        <div className="pdp-gallery-section">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="pdp-gallery-card">
            <div className="pdp-main-image-container" onClick={() => setShowFullGallery(true)}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={images[activeImage]?.url}
                  alt={product.title}
                  className="pdp-main-image"
                />
              </AnimatePresence>
              <button className="gallery-maximize-btn">
                <Maximize2 size={20} />
              </button>
            </div>

            <div className="pdp-thumbnails">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img.url}
                  className={`pdp-thumb ${activeImage === idx ? 'active' : ''}`}
                  onClick={() => setActiveImage(idx)}
                  alt={`Thumbnail ${idx + 1}`}
                />
              ))}
            </div>
          </motion.div>

          {/* Trust Badges */}
          <div className="pdp-trust-badges">
            <div className="trust-badge">
              <ShieldCheck size={24} />
              <span>100% Genuine</span>
            </div>
            <div className="trust-badge">
              <RotateCcw size={24} />
              <span>Easy Returns</span>
            </div>
            <div className="trust-badge">
              <Zap size={24} />
              <span>Fast Delivery</span>
            </div>
            <div className="trust-badge">
              <CreditCard size={24} />
              <span>Secure Payment</span>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="pdp-info-section">
          <div className="pdp-badge-row">
            <span className={`pdp-badge ${product.stock_quantity === 0 ? 'out' : ''}`}>
              {product.stock_quantity > 0 ? (product.stock_quantity < 5 ? 'Limited Stock' : 'In Stock') : 'Out of Stock'}
            </span>
            {product.brand && <span className="pdp-badge brand">{product.brand}</span>}
            {discountPercent > 0 && <span className="pdp-badge discount">{discountPercent}% OFF</span>}
          </div>

          <div className="pdp-header">
            <h1 className="pdp-title">{product.title}</h1>
            {product.tagline && <p className="pdp-tagline">{product.tagline}</p>}
            <span className="pdp-sku">SKU: {product.sku || product.id.toString().slice(0, 8).toUpperCase()}</span>
          </div>

          <div className="pdp-rating-summary">
            <div className="pdp-stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  fill={i < Math.floor(product.rating || 4.5) ? "#fbbf24" : "none"}
                  color={i < Math.floor(product.rating || 4.5) ? "#fbbf24" : "rgba(255,255,255,0.2)"}
                />
              ))}
            </div>
            <span className="pdp-rating-val">{product.rating || 4.5}</span>
            <span className="pdp-review-count">({product.reviewCount || product.review_count || reviews.length} Reviews)</span>
          </div>

          <div className="pdp-price-card">
            <div className="pdp-price-row">
              <span className="pdp-current-price">₹{product.price}</span>
              {(product.originalPrice || product.original_price) && (
                <span className="pdp-old-price">₹{product.originalPrice || product.original_price}</span>
              )}
            </div>
            <span className="pdp-tax-info">{product.taxInfo || 'Inclusive of all taxes'}</span>
            {(product.emi_options || product.price > 2000) && (
              <div className="pdp-emi-info">
                <CreditCard size={14} />
                <span>EMI starting from ₹{(product.price / 12).toFixed(0)}/month</span>
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="pdp-variants">
            {(product.size_variants || product.sizeVariants) && (
              <div className="variant-group">
                <span className="variant-label">Select Size</span>
                <div className="variant-options">
                  {(product.size_variants || product.sizeVariants || ['S', 'M', 'L', 'XL']).map(size => (
                    <button
                      key={size}
                      className={`variant-btn ${selectedSize === size ? 'active' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(product.color_variants || product.colorVariants) && (
              <div className="variant-group">
                <span className="variant-label">Select Color</span>
                <div className="variant-options">
                  {(product.color_variants || product.colorVariants || ['#fff', '#000', '#3b82f6']).map(color => (
                    <button
                      key={color}
                      className={`variant-color-btn ${selectedColor === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="quantity-selector">
              <span className="variant-label">Quantity</span>
              <div className="qty-controls">
                <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>
                  <Minus size={16} />
                </button>
                <span className="qty-val">{quantity}</span>
                <button className="qty-btn" onClick={() => setQuantity(q => q + 1)}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pdp-main-actions">
            <button className="btn-pdp btn-cart" onClick={handleAddToCart}>
              <ShoppingCart size={20} /> Add to Cart
            </button>
            <button className="btn-pdp btn-buy" onClick={() => navigate('/checkout', { state: { product: { ...product, quantity } } })}>
              Buy Now
            </button>
            <button className={`btn-pdp btn-icon-pdp ${isWishlisted ? 'active' : ''}`} onClick={handleToggleWishlist}>
              <Heart size={20} fill={isWishlisted ? "#ef4444" : "none"} />
            </button>
            <button className="btn-pdp btn-icon-pdp" onClick={handleShare}>
              <Share2 size={20} />
            </button>
          </div>

          {/* Seller Card */}
          <div className="pdp-seller-card">
            <div className="seller-main">
              <div className="seller-avatar-large">
                {product.seller?.avatar_url ? (
                  <img src={product.seller.avatar_url} alt={product.seller.full_name} />
                ) : (
                  <span>{product.seller?.full_name?.charAt(0) || product.sellerName?.charAt(0) || 'S'}</span>
                )}
              </div>
              <div className="seller-info">
                <h4>{product.seller?.full_name || product.sellerName}</h4>
                <div className="seller-stats">
                  <span className="seller-rating-pill">⭐ {product.seller?.rating || product.sellerRating || '4.8'}</span>
                  <span>{product.seller?.total_reviews || product.sellerReviewCount || '150+'} Reviews</span>
                </div>
                <div className="seller-location">
                  <MapPin size={14} />
                  <span>{product.seller?.location_city || product.sellerLocation || 'New Delhi, India'}</span>
                </div>
              </div>
            </div>
            <div className="seller-actions">
              <button className="btn-seller visit" onClick={() => navigate(`/seller/${product.seller_id}`)}>
                <Store size={16} /> Visit Store
              </button>
              <button className="btn-seller contact">
                <MessageSquare size={16} /> Contact Seller
              </button>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="pdp-delivery-card">
            <div className="delivery-grid">
              <div className="delivery-item">
                <Truck size={20} />
                <div>
                  <h5>Delivery by {product.deliveryEstimate || 'Tomorrow'}</h5>
                  <p>{(product.shippingCharges || 0) === 0 ? 'FREE Shipping' : `₹${product.shippingCharges} Shipping`}</p>
                </div>
              </div>
              <div className="delivery-item">
                <Package size={20} />
                <div>
                  <h5>{product.returnPolicy || '7 Days Return'}</h5>
                  <p>Easy returns & replacement</p>
                </div>
              </div>
              <div className="delivery-item">
                <ShieldCheck size={20} />
                <div>
                  <h5>COD Available</h5>
                  <p>Pay when you receive</p>
                </div>
              </div>
              <div className="delivery-item">
                <CheckCircle2 size={20} />
                <div>
                  <h5>Genuine Product</h5>
                  <p>Brand authorized seller</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="pdp-details-tabs">
        <div className="tab-nav">
          {['description', 'specifications', 'reviews', 'faq'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'description' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="pdp-desc-text">
                {product.description}
              </div>
              {product.keyFeatures && (
                <div className="key-features">
                  {product.keyFeatures.map((f, i) => (
                    <div key={i} className="feature-pill">
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'specifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <table className="specs-table">
                <tbody>
                  {Object.entries(product.specifications || {}).map(([key, val]) => (
                    <tr key={key}>
                      <td className="specs-label">{key}</td>
                      <td className="specs-val">{val}</td>
                    </tr>
                  ))}
                  {product.materials && (
                    <tr>
                      <td className="specs-label">Material</td>
                      <td className="specs-val">{product.materials}</td>
                    </tr>
                  )}
                  {product.dimensions && (
                    <tr>
                      <td className="specs-label">Dimensions</td>
                      <td className="specs-val">{product.dimensions}</td>
                    </tr>
                  )}
                  {product.warranty_info && (
                    <tr>
                      <td className="specs-label">Warranty</td>
                      <td className="specs-val">{product.warranty_info}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="pdp-reviews-header">
                <div className="rating-overview">
                  <span className="big-rating">{product.rating || 4.5}</span>
                  <div className="pdp-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={24} fill={i < 4 ? "#fbbf24" : "none"} color="#fbbf24" />
                    ))}
                  </div>
                  <div className="rating-bars">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = product.ratingBreakdown?.[star] || (star === 5 ? 40 : 10);
                      const total = Object.values(product.ratingBreakdown || { 5: 40, 4: 10, 3: 5, 2: 2, 1: 1 }).reduce((a, b) => a + b, 0);
                      return (
                        <div key={star} className="rating-bar-row">
                          <span>{star}★</span>
                          <div className="bar-bg">
                            <div className="bar-fill" style={{ width: `${(count / total) * 100}%` }}></div>
                          </div>
                          <span>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="review-form-card">
                  <h4>Write a Review</h4>
                  <form onSubmit={handleSubmitReview}>
                    <div className="form-group">
                      <div className="star-selector">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            size={24}
                            className="star-input"
                            fill={s <= reviewForm.rating ? "#fbbf24" : "none"}
                            color="#fbbf24"
                            onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Your Name"
                        className="form-input"
                        value={reviewForm.name}
                        onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <textarea
                        placeholder="Your Comment"
                        className="form-input"
                        rows="4"
                        value={reviewForm.comment}
                        onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        required
                      ></textarea>
                    </div>
                    <button type="submit" className="btn-pdp btn-buy" style={{ width: '100%' }}>
                      Submit Review
                    </button>
                  </form>
                </div>
              </div>

              <div className="pdp-reviews-list">
                {reviews.map(review => (
                  <div key={review.id} className="pdp-review-card glass">
                    <div className="review-header">
                      <div className="review-user">
                        <div className="user-avatar-sm">{review.initials || review.userName?.charAt(0)}</div>
                        <div>
                          <span className="user-name">{review.userName || review.user?.full_name}</span>
                          <span className="review-date">{review.date || 'Recently'}</span>
                        </div>
                      </div>
                      <div className="review-rating">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill={i < review.rating ? "#fbbf24" : "none"} color={i < review.rating ? "#fbbf24" : "rgba(255,255,255,0.2)"} />
                        ))}
                      </div>
                    </div>
                    <p className="review-content">{review.comment || review.content}</p>
                    {(review.verified || review.is_verified_purchase) && (
                      <span className="verified-purchase"><ShieldCheck size={12} /> Verified Purchase</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'faq' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="faq-grid">
                {(product.faqs || [
                  { question: 'Is this product original?', answer: 'Yes, all products on our platform are sourced directly from authorized sellers.' },
                  { question: 'What is the return policy?', answer: 'We offer a 7-day easy return policy for most products.' },
                  { question: 'How long does delivery take?', answer: 'Delivery typically takes 3-5 business days depending on your location.' }
                ]).map((faq, i) => (
                  <div key={i} className="faq-item">
                    <div className="faq-q">
                      <Info size={18} color="#3b82f6" />
                      <span>{faq.question}</span>
                    </div>
                    <div className="faq-a">{faq.answer}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      <div className="related-products-section">
        <h3 className="section-title">Related Products</h3>
        <div className="related-grid">
          {mockProducts.slice(1, 5).map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      {/* Sticky Mobile Bar */}
      <div className="sticky-purchase-bar">
        <div className="sticky-price">
          <span>Total Price</span>
          <span>₹{product.price * quantity}</span>
        </div>
        <div className="sticky-actions">
          <button className="btn-sticky cart" onClick={handleAddToCart}>Add to Cart</button>
          <button className="btn-sticky buy" onClick={() => navigate('/checkout', { state: { product: { ...product, quantity } } })}>Buy Now</button>
        </div>
      </div>

      {/* Image Gallery Modal */}
      <AnimatePresence>
        {showFullGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="gallery-modal"
            onClick={() => setShowFullGallery(false)}
          >
            <button className="close-gallery" onClick={() => setShowFullGallery(false)}>
              <X size={32} />
            </button>
            <div className="gallery-modal-content" onClick={e => e.stopPropagation()}>
              <img src={images[activeImage]?.url} alt="Full view" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductCard({ product }) {
  const navigate = useNavigate();
  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="pdp-product-card"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="card-image">
        <img src={product.image || product.image_url} alt={product.title} />
        {product.originalPrice && (
          <span className="card-discount">
            -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
          </span>
        )}
      </div>
      <div className="card-info">
        <span className="card-category">{product.category}</span>
        <h4>{product.title}</h4>
        <div className="card-rating">
          <Star size={12} fill="#fbbf24" color="#fbbf24" />
          <span>{product.rating}</span>
          <span className="card-reviews">({product.reviewCount})</span>
        </div>
        <div className="card-price-row">
          <span className="card-price">₹{product.price}</span>
          {product.originalPrice && <span className="card-old-price">₹{product.originalPrice}</span>}
        </div>
        <button className="card-btn">Add to Cart</button>
      </div>
    </motion.div>
  );
}

function PDPSkeleton() {
  return (
    <div className="pdp-container skeleton-active">
      <div className="pdp-layout">
        <div className="skeleton pdp-gallery-card" style={{ height: '500px' }}></div>
        <div className="pdp-info-section">
          <div className="skeleton" style={{ width: '150px', height: '24px' }}></div>
          <div className="skeleton" style={{ width: '90%', height: '48px', marginTop: '1rem' }}></div>
          <div className="skeleton" style={{ width: '200px', height: '24px', marginTop: '1rem' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '120px', marginTop: '2rem' }}></div>
          <div className="pdp-main-actions">
            <div className="skeleton" style={{ height: '56px' }}></div>
            <div className="skeleton" style={{ height: '56px' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="pdp-error-state">
      <AlertCircle size={64} color="#ef4444" />
      <h2>{message || 'Something went wrong'}</h2>
      <p>We couldn't load the product details. Please try again later.</p>
      <button onClick={onRetry} className="btn-pdp btn-buy">
        <ArrowLeft size={18} /> Back to Shop
      </button>
    </div>
  );
}
