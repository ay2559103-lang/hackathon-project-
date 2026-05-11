import { NavLink } from 'react-router-dom';
import {
  MapPin, Sparkles, ShoppingBag, MessageCircle, Star,
  BarChart3, ArrowRight, ChevronRight, Zap, Shield,
  Users, TrendingUp, Store, Plus, Globe, Smartphone,
  Heart, CheckCircle, Clock, LayoutGrid
} from 'lucide-react';
import heroPremium from '../assets/hero_premium.png';
import { categories, products, sellers } from '../data/mockData';
import './HomePage.css';

const stats = [
  { label: 'Local Sellers', value: '500+', icon: Users },
  { label: 'Products', value: '10,000+', icon: ShoppingBag },
  { label: 'Listing Speed', value: '95% Faster', icon: Zap },
  { label: 'Buyer Support', value: '24/7 Chat', icon: MessageCircle },
];

const howItWorks = [
  { id: 1, title: 'Upload Product', desc: 'Snap a photo and upload your item details in seconds.', icon: Plus },
  { id: 2, title: 'AI Generation', desc: 'Our AI generates premium titles and descriptions for you.', icon: Sparkles },
  { id: 3, title: 'Publish Listing', desc: 'Your product goes live to your local community instantly.', icon: Globe },
  { id: 4, title: 'Connect with Buyers', desc: 'Chat directly with buyers and close the deal safely.', icon: MessageCircle },
];

const testimonials = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    role: 'Local Artisan',
    content: 'LocalSell transformed how I reach my neighbors. The AI description tool is a game-changer for my pottery business!',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Organic Farmer',
    content: 'I used to struggle with logistics. Now, I sell my fresh produce within a 2km radius without any middleman.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 3,
    name: 'Elena Rodriguez',
    role: 'Home Baker',
    content: 'The trust and community feel on this platform are unmatched. My weekend bakes sell out in minutes!',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
  },
];

const featuredCategories = [
  { name: 'Fashion', icon: '👗' },
  { name: 'Electronics', icon: '📱' },
  { name: 'Home Decor', icon: '🏠' },
  { name: 'Grocery', icon: '🍎' },
  { name: 'Handmade', icon: '🎨' },
  { name: 'Furniture', icon: '🛋️' },
];

export default function HomePage() {
  return (
    <div className="home-page">
      {/* Full-Width Premium Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-glow hero-glow-1"></div>
          <div className="hero-glow hero-glow-2"></div>
        </div>
        
        <div className="container hero-container">
          <div className="hero-content animate-fade-in">
            <div className="hero-badge">
              <Sparkles size={14} className="icon-pulse" />
              <span>Premium Hyperlocal Marketplace</span>
            </div>
            <h1 className="hero-title">
              The Future of <span className="gradient-text">Local</span><br />
              Commerce is <span className="gradient-text">Here</span>.
            </h1>
            <p className="hero-subtitle">
              Connect with 500+ local sellers using AI-powered listing tools 
              and instant buyer-seller chat. Experience trade at the speed of thought.
            </p>
            <div className="hero-actions">
              <NavLink to="/products" className="btn btn-primary btn-lg">
                Explore Products <ShoppingBag size={20} />
              </NavLink>
              <NavLink to="/add-product" className="btn btn-outline btn-lg">
                Sell Your Product <Plus size={20} />
              </NavLink>
              <NavLink to="/login" className="btn btn-ghost btn-lg ml-4">
                Login <ArrowRight size={20} />
              </NavLink>
            </div>

            
            <div className="hero-trust">
              <div className="trust-avatars">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`trust-avatar avatar-${i}`}></div>
                ))}
              </div>
              <p>Join <b>5,000+</b> active community members</p>
            </div>
          </div>
          
          <div className="hero-visual animate-fade-in">
            <div className="hero-image-container">
              <img src={heroPremium} alt="LocalSell Premium" className="hero-image-main" />
              
              {/* Floating Glass Cards */}
              <div className="floating-card card-1 glass animate-float">
                <Users size={20} className="color-primary" />
                <div>
                  <div className="card-value">500+</div>
                  <div className="card-label">Local Sellers</div>
                </div>
              </div>
              
              <div className="floating-card card-2 glass animate-float-delayed">
                <Sparkles size={20} className="color-secondary" />
                <div>
                  <div className="card-value">AI Active</div>
                  <div className="card-label">Smart Listings</div>
                </div>
              </div>
              
              <div className="floating-card card-3 glass animate-float">
                <MessageCircle size={20} className="color-accent" />
                <div>
                  <div className="card-value">Instant</div>
                  <div className="card-label">Buyer Chat</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid glass animate-scale-in">
            {stats.map((stat, i) => (
              <div key={i} className="stat-item">
                <div className="stat-icon-box">
                  <stat.icon size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
                {i < stats.length - 1 && <div className="stat-divider"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Shop by <span className="gradient-text">Category</span></h2>
            <p className="section-subtitle">Find exactly what you need in your neighborhood.</p>
          </div>
          
          <div className="categories-grid stagger">
            {featuredCategories.map((cat, i) => (
              <NavLink key={i} to="/feed" className="category-card glass-card">
                <div className="category-icon">{cat.icon}</div>
                <span className="category-name">{cat.name}</span>
                <ChevronRight size={16} className="category-arrow" />
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="products-section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Featured <span className="gradient-text">Listings</span></h2>
              <p className="section-subtitle">Premium picks from our top-rated local sellers.</p>
            </div>
            <NavLink to="/feed" className="btn btn-ghost">
              View All <ArrowRight size={18} />
            </NavLink>
          </div>
          
          <div className="products-grid stagger">
            {products.slice(0, 8).map((product) => (
              <div key={product.id} className="product-card-premium glass-card animate-fade-in-up">
                <div className="product-image-box">
                  <img src={product.image} alt={product.title} className="product-img" />
                  <div className="product-badges">
                    <span className="badge-price">₹{product.price}</span>
                    <span className="badge-category">{product.category}</span>
                  </div>
                  <button className="favorite-btn" aria-label="Add to favorites">
                    <Heart size={18} />
                  </button>
                  {product.aiGenerated && (
                    <div className="ai-status">
                      <Sparkles size={10} /> AI Optimized
                    </div>
                  )}
                </div>
                <div className="product-details">
                  <div className="seller-info-row">
                    <div className="seller-avatar-sm" style={{ background: product.sellerColor || 'var(--color-primary)' }}>
                      {product.sellerInitials}
                    </div>
                    <span className="seller-name">{product.sellerName}</span>
                    <div className="product-rating-sm">
                      <Star size={12} fill="var(--color-warning)" stroke="var(--color-warning)" />
                      <span>{product.rating}</span>
                    </div>
                  </div>
                  <h3 className="product-title-premium">{product.title}</h3>
                  <p className="product-desc-preview">{product.description.substring(0, 60)}...</p>
                  
                  <div className="product-actions-row">
                    <div className="product-location">
                      <MapPin size={12} />
                      <span>{product.distance}</span>
                    </div>
                    <div className="product-btn-group">
                      <NavLink to="/chat" className="btn-chat-icon" title="Chat with seller">
                        <MessageCircle size={18} />
                      </NavLink>
                      <button className="btn-buy-now">Details</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">How It <span className="gradient-text">Works</span></h2>
            <p className="section-subtitle">Experience the magic of AI-powered local selling.</p>
          </div>
          
          <div className="how-grid">
            {howItWorks.map((step) => (
              <div key={step.id} className="how-card glass-card">
                <div className="how-step-num">{step.id}</div>
                <div className="how-icon-wrapper">
                  <step.icon size={32} />
                </div>
                <h3 className="how-title">{step.title}</h3>
                <p className="how-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Seller <span className="gradient-text">Stories</span></h2>
            <p className="section-subtitle">Hear from the community growing with LocalSell.</p>
          </div>
          
          <div className="testimonials-grid">
            {testimonials.map((t) => (
              <div key={t.id} className="testimonial-card glass-card">
                <div className="testimonial-content">
                  <p>"{t.content}"</p>
                </div>
                <div className="testimonial-author">
                  <img src={t.image} alt={t.name} className="author-img" />
                  <div className="author-info">
                    <div className="author-name">{t.name}</div>
                    <div className="author-role">{t.role}</div>
                  </div>
                  <div className="testimonial-stars">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="var(--color-warning)" stroke="var(--color-warning)" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Large CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-container-premium glass animate-scale-in">
            <div className="cta-content-premium">
              <h2 className="cta-title">Ready to Start Your <span className="gradient-text">Local Journey</span>?</h2>
              <p className="cta-desc">
                Join the future of hyperlocal commerce. Whether you're looking to declutter 
                your home or start a professional local business, we've got the tools you need.
              </p>
              <div className="cta-buttons-premium">
                <NavLink to="/add-product" className="btn btn-primary btn-xl">
                  Start Selling Now <Plus size={22} />
                </NavLink>
                <NavLink to="/ai-assistant" className="btn btn-outline btn-xl">
                  Chat with AI Assistant <Sparkles size={22} />
                </NavLink>
              </div>
            </div>
            <div className="cta-glow"></div>
          </div>
        </div>
      </section>
    </div>
  );
}
