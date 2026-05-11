import React, { useState, useEffect } from 'react';
import { 
  Package, 
  MapPin, 
  Clock, 
  IndianRupee, 
  TrendingUp, 
  Activity, 
  Navigation, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Bell,
  Power,
  ChevronRight,
  History,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './DeliveryDashboardPage.css';

// Mock data for delivery dashboard
const deliveryStats = {
  todayEarnings: 1250,
  totalDeliveries: 45,
  rating: 4.9,
  onlineHours: 6.5,
  earningsGrowth: 15.4
};

const activeOrders = [
  {
    id: 'ORD-7721',
    customerName: 'Ananya Singh',
    pickupAddress: 'Fresh Farm Organics, Sector 15',
    deliveryAddress: 'Apt 402, Sunshine Residency, Noida',
    status: 'picked_up',
    distance: '3.2 km',
    eta: '12 mins',
    amount: 60
  }
];

const newRequests = [
  {
    id: 'ORD-8832',
    customerName: 'Rahul Mehta',
    pickupAddress: 'The Handmade Store, Sector 22',
    deliveryAddress: 'B-12, Green Park, Gurgaon',
    status: 'pending',
    distance: '1.5 km',
    amount: 45
  },
  {
    id: 'ORD-8835',
    customerName: 'Sonia Verma',
    pickupAddress: 'Priya\'s Kitchen, Hauz Khas',
    deliveryAddress: 'C-4, Safdarjung Enclave, Delhi',
    status: 'pending',
    distance: '2.8 km',
    amount: 55
  }
];

export default function DeliveryDashboardPage() {
  const [isOnline, setIsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState(activeOrders);
  const [requests, setRequests] = useState(newRequests);
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.2090 });

  // Simulate real-time location updates
  useEffect(() => {
    let interval;
    if (isOnline) {
      interval = setInterval(() => {
        setLocation(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.001,
          lng: prev.lng + (Math.random() - 0.5) * 0.001
        }));
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isOnline]);

  const toggleOnline = () => {
    setLoading(true);
    setTimeout(() => {
      setIsOnline(!isOnline);
      setLoading(false);
    }, 1000);
  };

  const acceptOrder = (order) => {
    setLoading(true);
    setTimeout(() => {
      setRequests(requests.filter(r => r.id !== order.id));
      setOrders([...orders, { ...order, status: 'assigned', eta: '15 mins' }]);
      setActiveTab('active');
      setLoading(false);
    }, 800);
  };

  const completeOrder = (orderId) => {
    setLoading(true);
    setTimeout(() => {
      setOrders(orders.filter(o => o.id !== orderId));
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="delivery-dashboard">
      <div className="container">
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="header-info">
            <div className="header-badge">
              <Activity size={14} />
              <span>Partner Portal</span>
            </div>
            <h1 className="dashboard-title">Delivery <span className="gradient-text">Partner</span></h1>
            <p className="dashboard-subtitle">Manage your deliveries and track earnings in real-time.</p>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={toggleOnline}
              disabled={loading}
              className={`status-toggle ${isOnline ? 'online' : 'offline'} glass-card`}
            >
              <Power size={18} />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
              {loading && <div className="loader-mini"></div>}
            </button>
            <div className="notification-bell glass-card">
              <Bell size={20} />
              {requests.length > 0 && isOnline && <span className="bell-dot"></span>}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid stagger">
          <div className="stat-card glass-card animate-fade-in-up">
            <div className="stat-header">
              <div className="stat-icon-box color-primary">
                <IndianRupee size={20} />
              </div>
              <div className="stat-trend plus">
                <TrendingUp size={14} />
                <span>+{deliveryStats.earningsGrowth}%</span>
              </div>
            </div>
            <div className="stat-body">
              <div className="stat-value">₹{deliveryStats.todayEarnings}</div>
              <div className="stat-label">Today's Earnings</div>
            </div>
          </div>

          <div className="stat-card glass-card animate-fade-in-up">
            <div className="stat-header">
              <div className="stat-icon-box color-secondary">
                <Package size={20} />
              </div>
            </div>
            <div className="stat-body">
              <div className="stat-value">{deliveryStats.totalDeliveries}</div>
              <div className="stat-label">Completed Orders</div>
            </div>
          </div>

          <div className="stat-card glass-card animate-fade-in-up">
            <div className="stat-header">
              <div className="stat-icon-box" style={{ color: '#F59E0B' }}>
                <Activity size={20} />
              </div>
            </div>
            <div className="stat-body">
              <div className="stat-value">{deliveryStats.rating}</div>
              <div className="stat-label">Performance Rating</div>
            </div>
          </div>

          <div className="stat-card glass-card animate-fade-in-up">
            <div className="stat-header">
              <div className="stat-icon-box color-primary">
                <Clock size={20} />
              </div>
            </div>
            <div className="stat-body">
              <div className="stat-value">{deliveryStats.onlineHours}h</div>
              <div className="stat-label">Online Time</div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="dashboard-content-grid">
          {/* Main List Section */}
          <div className="list-section glass-card">
            <div className="list-header">
              <div className="tab-controls">
                <button 
                  className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                  onClick={() => setActiveTab('active')}
                >
                  <Navigation size={18} />
                  Active Orders ({orders.length})
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                  onClick={() => setActiveTab('requests')}
                >
                  <Bell size={18} />
                  New Requests ({isOnline ? requests.length : 0})
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <History size={18} />
                  History
                </button>
              </div>
            </div>

            <div className="order-list">
              <AnimatePresence mode="wait">
                {activeTab === 'active' && (
                  <motion.div 
                    key="active"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="order-items-wrapper"
                  >
                    {orders.length > 0 ? (
                      orders.map(order => (
                        <div key={order.id} className="order-item-card glass">
                          <div className="order-item-header">
                            <div className="order-id">#{order.id}</div>
                            <div className={`order-status-badge ${order.status}`}>
                              {order.status.replace('_', ' ')}
                            </div>
                          </div>
                          <div className="order-item-body">
                            <div className="address-timeline">
                              <div className="timeline-item">
                                <div className="dot pickup"></div>
                                <div className="address-info">
                                  <span className="label">Pickup</span>
                                  <span className="address">{order.pickupAddress}</span>
                                </div>
                              </div>
                              <div className="timeline-line"></div>
                              <div className="timeline-item">
                                <div className="dot delivery"></div>
                                <div className="address-info">
                                  <span className="label">Delivery</span>
                                  <span className="address">{order.deliveryAddress}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="order-item-footer">
                            <div className="order-meta">
                              <div className="meta-item">
                                <Navigation size={14} />
                                <span>{order.distance}</span>
                              </div>
                              <div className="meta-item">
                                <Clock size={14} />
                                <span>ETA: {order.eta}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => completeOrder(order.id)}
                              className="btn btn-primary"
                            >
                              Complete Delivery <CheckCircle2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <Package size={48} className="empty-icon" />
                        <h3>No active orders</h3>
                        <p>Toggle online and check for new requests.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'requests' && (
                  <motion.div 
                    key="requests"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="order-items-wrapper"
                  >
                    {!isOnline && (
                      <div className="offline-warning glass">
                        <AlertCircle size={24} />
                        <div className="warning-text">
                          <h4>You are currently Offline</h4>
                          <p>Go online to start receiving new delivery requests.</p>
                        </div>
                        <button onClick={toggleOnline} className="btn btn-outline">Go Online</button>
                      </div>
                    )}
                    
                    {isOnline && requests.length > 0 ? (
                      requests.map(request => (
                        <div key={request.id} className="order-item-card glass request-card">
                          <div className="order-item-header">
                            <div className="order-id">#{request.id}</div>
                            <div className="order-amount">₹{request.amount}</div>
                          </div>
                          <div className="order-item-body">
                            <div className="address-simple">
                              <div className="location-row">
                                <MapPin size={16} className="text-blue-400" />
                                <span>{request.pickupAddress}</span>
                              </div>
                              <div className="location-row">
                                <Navigation size={16} className="text-emerald-400" />
                                <span>{request.deliveryAddress}</span>
                              </div>
                            </div>
                          </div>
                          <div className="order-item-footer">
                            <span className="distance-info">{request.distance} from you</span>
                            <div className="request-actions">
                              <button className="btn btn-ghost"><XCircle size={18} /></button>
                              <button 
                                onClick={() => acceptOrder(request)}
                                className="btn btn-primary"
                              >
                                Accept Request
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : isOnline && (
                      <div className="empty-state">
                        <Activity size={48} className="empty-icon animate-pulse" />
                        <h3>Searching for orders...</h3>
                        <p>We'll notify you when a new delivery is available nearby.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Map / Tracking Sidebar */}
          <div className="map-sidebar glass-card">
            <div className="card-header">
              <h3 className="card-title">Live Tracking</h3>
              <div className={`live-dot-pulse ${isOnline ? 'active' : ''}`}></div>
            </div>
            <div className="map-placeholder">
              <div className="map-overlay">
                <motion.div 
                  className="map-partner-dot"
                  animate={{ 
                    x: (location.lng - 77.2090) * 10000,
                    y: (location.lat - 28.6139) * 10000 
                  }}
                >
                  <div className="dot-inner"></div>
                  <div className="dot-pulse"></div>
                </motion.div>
                <div className="map-destination-pin">
                  <MapPin size={24} fill="var(--color-primary)" />
                </div>
              </div>
              <div className="map-controls">
                <button className="map-btn"><Navigation size={18} /></button>
              </div>
              <p className="map-hint text-center p-4">
                Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            </div>
            <div className="sidebar-info-card glass">
              <div className="info-header">Current Status</div>
              <div className="info-value">
                {isOnline ? (
                  <span className="flex items-center gap-2 text-emerald-400">
                    <Activity size={14} className="animate-pulse" />
                    Searching for nearby orders...
                  </span>
                ) : (
                  <span className="text-slate-400">Offline</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
