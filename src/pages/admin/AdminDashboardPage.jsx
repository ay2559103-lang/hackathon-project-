import { useState } from 'react';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, 
  ArrowUpRight, ArrowDownRight, Download, Activity,
  Package, MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';
import './AdminDashboardPage.css';

const STATS = [
  { label: 'Total Revenue', value: '₹4,52,310', icon: DollarSign, trend: '+12.5%', isUp: true },
  { label: 'Active Users', value: '12,450', icon: Users, trend: '+5.2%', isUp: true },
  { label: 'Total Orders', value: '3,842', icon: ShoppingBag, trend: '-2.1%', isUp: false },
  { label: 'Active Sellers', value: '428', icon: TrendingUp, trend: '+18.4%', isUp: true },
];

const RECENT_ACTIVITY = [
  { id: 1, type: 'order', text: 'New order #ORD-882 placed by Priya Singh', time: '2 mins ago', icon: Package },
  { id: 2, type: 'user', text: 'New seller "Fresh Bakes" registered', time: '15 mins ago', icon: Users },
  { id: 3, type: 'delivery', text: 'Delivery partner Rahul started shift', time: '1 hour ago', icon: MapPin },
  { id: 4, type: 'alert', text: 'High traffic detected in Noida Sector 62', time: '2 hours ago', icon: Activity },
];

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState('7days');

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Platform Analytics</h1>
          <p className="admin-page-desc">Overview of your ecommerce platform performance.</p>
        </div>
        <div className="header-actions">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="admin-select glass"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="year">This Year</option>
          </select>
          <button className="btn btn-primary">
            <Download size={18} /> Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid stagger">
        {STATS.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="admin-stat-card glass-card"
          >
            <div className="stat-icon-wrapper">
              <stat.icon size={24} className="color-primary" />
            </div>
            <div className="stat-content">
              <span className="stat-label">{stat.label}</span>
              <h3 className="stat-value">{stat.value}</h3>
              <div className={`stat-trend ${stat.isUp ? 'positive' : 'negative'}`}>
                {stat.isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                <span>{stat.trend} from last period</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="admin-dashboard-grid">
        {/* Placeholder for Chart */}
        <div className="admin-chart-section glass-card">
          <div className="section-header">
            <h3>Revenue Overview</h3>
          </div>
          <div className="chart-placeholder flex-center">
            <div className="placeholder-text">
              <BarChart size={48} className="color-text-muted mb-sm" />
              <p>Interactive Line Chart Component</p>
              <span>(Integrate Recharts or Chart.js here)</span>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="admin-activity-section glass-card">
          <div className="section-header">
            <h3>System Activity</h3>
            <button className="btn-text">View All</button>
          </div>
          <div className="activity-list">
            {RECENT_ACTIVITY.map(act => (
              <div key={act.id} className="activity-item">
                <div className={`activity-icon-sm ${act.type}`}>
                  <act.icon size={14} />
                </div>
                <div className="activity-details">
                  <p>{act.text}</p>
                  <span>{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
