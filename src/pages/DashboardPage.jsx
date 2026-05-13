import {
  BarChart3, TrendingUp, TrendingDown, Eye, MousePointerClick,
  ShoppingCart, IndianRupee, ArrowUpRight, Sparkles, Zap,
  Clock, Target, ChevronRight, Activity, Plus, Box
} from 'lucide-react';
import { dashboardStats, aiInsights, weeklyViewsData, products as mockProducts } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { seedSellerProducts } from '../services/seedingService';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id);

    if (data) setProducts(data);
    setIsLoading(false);
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    const result = await seedSellerProducts(user);
    if (result.success) {
      toast.success(`Successfully added ${result.count} sample products!`);
      fetchProducts();
    } else {
      toast.error(result.error);
    }
    setIsSeeding(false);
  };

  const maxViews = Math.max(...weeklyViewsData.map(d => d.views));

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Empty State / Seeding Banner */}
        {products.length === 0 && !isLoading && (
          <div className="seeding-banner glass animate-slide-in">
            <div className="seeding-content">
              <div className="seeding-icon">
                <Box size={32} className="color-primary" />
              </div>
              <div className="seeding-text">
                <h3>Your shop is empty!</h3>
                <p>Want to see how your dashboard looks with products? Add some sample items with related images in one click.</p>
              </div>
            </div>
            <button
              className={`btn btn-primary ${isSeeding ? 'loading' : ''}`}
              onClick={handleSeed}
              disabled={isSeeding}
            >
              {isSeeding ? 'Adding...' : 'Add Sample Products'}
              {!isSeeding && <Plus size={18} />}
            </button>
          </div>
        )}

        {/* Premium Dashboard Header */}
        <div className="dashboard-header">
          <div className="header-info">
            <div className="header-badge">
              <Activity size={14} />
              <span>Real-time Analytics</span>
            </div>
            <h1 className="dashboard-title">Seller <span className="gradient-text">Overview</span></h1>
            <p className="dashboard-subtitle">Track your growth and optimize with AI-driven insights.</p>
          </div>
          <div className="dashboard-controls glass">
            <button className="btn btn-primary btn-sm mr-2" onClick={() => navigate('/add-product')}>
              <Plus size={16} /> List New Product
            </button>
            <button className="control-btn active">7D</button>
            <button className="control-btn">30D</button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid stagger">
          <div className="stat-card glass-card animate-fade-in-up">
            <div className="stat-header">
              <div className="stat-icon-box color-primary">
                <Eye size={20} />
              </div>
              <div className="stat-trend plus">
                <TrendingUp size={14} />
                <span>+12.5%</span>
              </div>
            </div>
            <div className="stat-body">
              <div className="stat-value">{dashboardStats.totalViews.toLocaleString()}</div>
              <div className="stat-label">Total Views</div>
            </div>
            <div className="stat-footer">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '70%', background: 'var(--color-primary)' }}></div>
              </div>
            </div>
          </div>

          <div className="stat-card glass-card animate-fade-in-up">
            <div className="stat-header">
              <div className="stat-icon-box color-secondary">
                <MousePointerClick size={20} />
              </div>
              <div className="stat-trend plus">
                <TrendingUp size={14} />
                <span>+8.2%</span>
              </div>
            </div>
            <div className="stat-body">
              <div className="stat-value">{dashboardStats.totalClicks.toLocaleString()}</div>
              <div className="stat-label">Total Clicks</div>
            </div>
            <div className="stat-footer">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '55%', background: 'var(--color-secondary)' }}></div>
              </div>
            </div>
          </div>

          <div className="stat-card glass-card animate-fade-in-up">
            <div className="stat-header">
              <div className="stat-icon-box" style={{ color: '#F59E0B' }}>
                <ShoppingCart size={20} />
              </div>
              <div className="stat-trend plus">
                <TrendingUp size={14} />
                <span>+4.1%</span>
              </div>
            </div>
            <div className="stat-body">
              <div className="stat-value">{dashboardStats.totalSales}</div>
              <div className="stat-label">Total Sales</div>
            </div>
            <div className="stat-footer">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '40%', background: '#F59E0B' }}></div>
              </div>
            </div>
          </div>

          <div className="stat-card glass-card animate-fade-in-up">
            <div className="stat-header">
              <div className="stat-icon-box color-primary">
                <IndianRupee size={20} />
              </div>
              <div className="stat-trend plus">
                <TrendingUp size={14} />
                <span>+15.3%</span>
              </div>
            </div>
            <div className="stat-body">
              <div className="stat-value">₹{dashboardStats.revenue.toLocaleString()}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
            <div className="stat-footer">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '85%', background: 'var(--gradient-primary)' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-main-grid">
          {/* Main Chart Section */}
          <div className="chart-section glass-card">
            <div className="card-header">
              <h3 className="card-title">Engagement Velocity</h3>
              <div className="card-actions">
                <span className="badge-primary">Last 7 Days</span>
              </div>
            </div>
            <div className="engagement-chart">
              {weeklyViewsData.map((day, i) => (
                <div key={i} className="chart-column">
                  <div className="column-bar-wrapper">
                    <div
                      className="column-bar"
                      style={{ height: `${(day.views / maxViews) * 100}%` }}
                    >
                      <div className="bar-tooltip">{day.views}</div>
                    </div>
                  </div>
                  <span className="column-label">{day.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Listing Assistant Section */}
          <div className="ai-listing-assistant glass-card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Sparkles size={18} className="color-primary" />
                Create with AI
              </h3>
            </div>
            <div className="ai-assistant-body">
              <p className="ai-prompt-text">Describe what you want to sell, and AI will create the premium listing for you.</p>
              <div className="ai-input-group">
                <textarea
                  className="ai-glow-input"
                  placeholder="e.g. A handmade wooden coffee table, walnut finish, mid-century modern style..."
                  rows="3"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                ></textarea>
                <button
                  className="btn btn-primary btn-lg btn-full ai-generate-btn"
                  onClick={() => navigate(`/add-product?prompt=${encodeURIComponent(aiPrompt)}`)}
                >
                  Generate Listing <Sparkles size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="products-table-section glass-card">
          <div className="card-header">
            <h3 className="card-title">Top Performing Listings</h3>
            <button className="btn-text">See All Listings <ArrowUpRight size={14} /></button>
          </div>
          <div className="table-wrapper">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Product Details</th>
                  <th>Views</th>
                  <th>Engagement</th>
                  <th>Conversion</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(products.length > 0 ? products : mockProducts.filter(p => p.sellerId === 1)).slice(0, 5).map((product, i) => (
                  <tr key={i}>
                    <td><span className="rank-badge">#{i + 1}</span></td>
                    <td>
                      <div className="table-product">
                        <div className="product-thumb">
                          {product.image ? (
                            <img src={product.image} alt="" className="thumb-img" />
                          ) : (
                            (product.category_name || product.category || 'P').charAt(0)
                          )}
                        </div>
                        <div className="product-meta">
                          <span className="name">{product.title}</span>
                          <span className="category">{product.category_name || product.category || product.category || 'Product'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{(product.views || 0).toLocaleString()}</td>
                    <td>
                      <div className="engagement-metric">
                        <div className="metric-dot"></div>
                        <span>{product.likes || 0} likes</span>
                      </div>
                    </td>
                    <td>{Math.floor(Math.random() * 10 + 2)}%</td>
                    <td>
                      <span className="status-badge online">Live</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
