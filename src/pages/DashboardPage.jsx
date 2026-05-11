import {
  BarChart3, TrendingUp, TrendingDown, Eye, MousePointerClick,
  ShoppingCart, IndianRupee, ArrowUpRight, Sparkles, Zap,
  Clock, Target, ChevronRight, Activity
} from 'lucide-react';
import { dashboardStats, aiInsights, weeklyViewsData, products } from '../data/mockData';
import './DashboardPage.css';

export default function DashboardPage() {
  const maxViews = Math.max(...weeklyViewsData.map(d => d.views));

  return (
    <div className="dashboard-page">
      <div className="container">
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
            <button className="control-btn active">7D</button>
            <button className="control-btn">30D</button>
            <button className="control-btn">1Y</button>
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

          {/* AI Insights Section */}
          <div className="insights-section glass-card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Sparkles size={18} className="color-primary" />
                AI Optimization
              </h3>
            </div>
            <div className="insights-list">
              {aiInsights.map((insight, i) => (
                <div key={i} className="insight-card">
                  <div className="insight-icon">{insight.icon}</div>
                  <div className="insight-details">
                    <h4 className="insight-title">{insight.title}</h4>
                    <p className="insight-desc">{insight.description}</p>
                    <button className="insight-btn">
                      Apply Suggestion <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
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
                {products.slice(0, 5).map((product, i) => (
                  <tr key={i}>
                    <td><span className="rank-badge">#{i + 1}</span></td>
                    <td>
                      <div className="table-product">
                        <div className="product-thumb">
                          {product.category.charAt(0)}
                        </div>
                        <div className="product-meta">
                          <span className="name">{product.title}</span>
                          <span className="category">{product.category}</span>
                        </div>
                      </div>
                    </td>
                    <td>{product.views.toLocaleString()}</td>
                    <td>
                      <div className="engagement-metric">
                        <div className="metric-dot"></div>
                        <span>{product.likes} likes</span>
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
