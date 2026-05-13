import React, { useState, useEffect, useCallback } from 'react';
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
  LayoutDashboard,
  Search,
  Star,
  ShoppingBag,
  ArrowRight,
  Store,
  ChevronDown,
  RefreshCw,
  Loader2,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './DeliveryDashboardPage.css';
import { toast } from 'react-hot-toast';
import { deliveryService, FALLBACK_DELIVERIES } from '../services/deliveryService';

// Mock data for delivery dashboard
const deliveryStats = {
  todayEarnings: 1250,
  totalDeliveries: 45,
  rating: 4.9,
  onlineHours: 6.5,
  earningsGrowth: 15.4
};

// Mock Data for Nearby Rides
const nearbyRides = [
  {
    id: 'RIDE-101',
    restaurant: "Green Apple Gourmet",
    distance: "2.4 km",
    wages: 65,
    profit: 18,
    duration: "15 min",
    items: 4,
    address: "HSR Layout, Sector 7",
    type: "Instant",
    rating: 4.8
  },
  {
    id: 'RIDE-102',
    restaurant: "Fresh Mart Pro",
    distance: "3.1 km",
    wages: 85,
    profit: 24,
    duration: "20 min",
    items: 7,
    address: "Koramangala 4th Block",
    type: "Standard",
    rating: 4.5
  }
];

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
  const [activeTab, setActiveTab] = useState('nearby'); // Default to nearby rides
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState(activeOrders);
  const [requests, setRequests] = useState(newRequests);
  const [availableRides, setAvailableRides] = useState([]);
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.2090 });
  
  // Real-time Supabase Data States
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [deliveriesError, setDeliveriesError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationLabel, setLocationLabel] = useState('Detect My Location');

  const fetchNearbyDeliveries = useCallback(async () => {
    setDeliveriesLoading(true);
    setDeliveriesError('');
    try {
      const { data, error: fetchErr } = await deliveryService.getAvailableDeliveries();
      if (fetchErr) throw fetchErr;

      if (data && data.length > 0) {
        setAvailableRides(data);
      } else {
        const seedResult = await deliveryService.seedDeliveryOrders();
        if (seedResult.seeded) {
          const { data: seededData } = await deliveryService.getAvailableDeliveries();
          setAvailableRides(seededData || FALLBACK_DELIVERIES);
        } else {
          setAvailableRides(FALLBACK_DELIVERIES);
        }
      }
    } catch (err) {
      console.warn('Supabase fetch failed, using fallback data:', err);
      setAvailableRides(FALLBACK_DELIVERIES);
      setDeliveriesError('Using offline preview data');
    } finally {
      setDeliveriesLoading(false);
    }
  }, []);

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      toast.loading('Detecting location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          setLocationLabel('Nearby Bangalore');
          toast.dismiss();
          toast.success('Location updated');
          if (isOnline) fetchNearbyDeliveries();
        },
        () => {
          setLocation({ lat: 12.9716, lng: 77.5946 });
          setLocationLabel('Nearby Bangalore');
          toast.dismiss();
          toast.success('Using default location');
          if (isOnline) fetchNearbyDeliveries();
        }
      );
    }
  };

  useEffect(() => {
    if (isOnline && activeTab === 'nearby' && availableRides.length === 0) {
      fetchNearbyDeliveries();
    }
  }, [isOnline, activeTab, fetchNearbyDeliveries, availableRides.length]);

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
      toast.success('Order completed successfully!');
      setLoading(false);
    }, 1000);
  };

  const acceptRide = (ride) => {
    setLoading(true);
    setTimeout(() => {
      setAvailableRides(availableRides.filter(r => r.id !== ride.id));
      setOrders([...orders, { 
        id: ride.id, 
        customerName: 'New Customer', 
        pickupAddress: ride.restaurant, 
        deliveryAddress: ride.address, 
        status: 'assigned', 
        distance: ride.distance, 
        eta: ride.duration,
        amount: ride.wages 
      }]);
      setActiveTab('active');
      toast.success('Ride accepted! Adding to active orders.');
      setLoading(false);
    }, 800);
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
                  className={`tab-btn ${activeTab === 'nearby' ? 'active' : ''}`}
                  onClick={() => setActiveTab('nearby')}
                >
                  <MapPin size={18} />
                  Nearby Rides ({isOnline ? availableRides.length : 0})
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                  onClick={() => setActiveTab('active')}
                >
                  <Navigation size={18} />
                  Active ({orders.length})
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                  onClick={() => setActiveTab('requests')}
                >
                  <Bell size={18} />
                  Requests ({isOnline ? requests.length : 0})
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <History size={18} />
                  Stats
                </button>
              </div>
            </div>

            <div className="order-list">
              <AnimatePresence mode="wait">
                {activeTab === 'nearby' && (
                  <motion.div 
                    key="nearby"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="order-items-wrapper"
                  >
                    {!isOnline ? (
                      <div className="offline-warning glass">
                        <AlertCircle size={24} />
                        <div className="warning-text">
                          <h4>Discovery Paused</h4>
                          <p>Go online to see rides available in your current area.</p>
                        </div>
                        <button onClick={toggleOnline} className="btn btn-primary btn-sm">Go Online</button>
                      </div>
                    ) : (
                      <>
                        <div className="nearby-header glass mb-4" style={{ borderRadius: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)' }}>
                          <div className="search-section" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div className="location-picker">
                              <button className="location-btn" onClick={handleUseLocation} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                                <Navigation size={18} />
                                <span>{locationLabel}</span>
                                <ChevronDown size={14} />
                              </button>
                            </div>
                            
                            <div className="search-bar-wrapper" style={{ flex: 1, minWidth: '200px', display: 'flex', gap: '0.5rem' }}>
                              <div className="search-input-group" style={{ flex: 1, position: 'relative' }}>
                                <Search className="search-icon" size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input 
                                  type="text" 
                                  placeholder="Search nearby restaurants..." 
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                />
                              </div>
                              <button className="btn btn-primary search-submit" onClick={fetchNearbyDeliveries}>
                                {deliveriesLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {deliveriesLoading ? (
                           <div className="empty-state">
                             <Loader2 size={48} className="empty-icon animate-spin" />
                             <h3>Fetching Live Rides...</h3>
                           </div>
                        ) : availableRides.length > 0 ? (
                          availableRides
                            .filter(ride => ride.restaurant.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(ride => (
                            <div key={ride.id} className="ride-offer-card glass animate-fade-in">
                              <div className="ride-offer-header">
                                <div className="restaurant-tag">
                                  <Store size={16} />
                                  <span>{ride.restaurant}</span>
                                </div>
                                <div className="ride-financials">
                                  <span className="wages">₹{Number(ride.wages)}</span>
                                  <span className="profit">₹{Number(ride.net_profit || ride.profit)} net</span>
                                </div>
                              </div>
                              <div className="ride-offer-body">
                                <div className="offer-stat">
                                  <Navigation size={14} />
                                  <span>{ride.distance_km || ride.distance} {ride.distance_km ? 'km' : ''}</span>
                                </div>
                                <div className="offer-stat">
                                  <Clock size={14} />
                                  <span>{ride.duration_min || ride.duration} {ride.duration_min ? 'min' : ''}</span>
                                </div>
                                <div className="offer-stat">
                                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                                  <span>{Number(ride.rating).toFixed(1)}</span>
                                </div>
                                {ride.is_surge && (
                                  <div className="offer-stat text-amber-500">
                                    <Zap size={14} />
                                    <span>Surge</span>
                                  </div>
                                )}
                              </div>
                              <button 
                                className="btn btn-primary btn-sm btn-full"
                                onClick={() => acceptRide(ride)}
                              >
                                Accept Ride <ArrowRight size={16} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="empty-state">
                            <Activity size={48} className="empty-icon animate-pulse" />
                            <h3>Searching for rides...</h3>
                            <p>Hang tight! We're checking for new orders near you.</p>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

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
