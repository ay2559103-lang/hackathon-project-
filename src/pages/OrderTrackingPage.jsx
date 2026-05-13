import { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { 
  Package, MapPin, Truck, CheckCircle2, ChevronLeft, 
  Phone, MessageSquare, Star, Clock, Navigation
} from 'lucide-react';
import { motion } from 'framer-motion';
import noidaMap from '../assets/noida_map.png';
import './OrderTrackingPage.css';

const MOCK_ORDER = {
  id: 'ORD-7721',
  productTitle: 'Fresh Organic Tomatoes',
  seller: 'Fresh Farm Organics',
  price: 120,
  eta: '10-15 mins',
  status: 'out_for_delivery',
  deliveryPartner: {
    name: 'Rahul Sharma',
    rating: 4.8,
    phone: '+91 98765 43210',
    vehicle: 'Honda Activa • UP16 XY 1234'
  }
};

const STATUS_STEPS = [
  { id: 'placed', label: 'Order Placed', icon: Package },
  { id: 'packed', label: 'Packed', icon: CheckCircle2 },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: Navigation },
  { id: 'delivered', label: 'Delivered', icon: MapPin },
];

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(MOCK_ORDER);
  const [partnerLocation, setPartnerLocation] = useState({ lat: 28.625, lng: 77.375 });
  const [mapCenter, setMapCenter] = useState({ lat: 28.630, lng: 77.380 });
  const [mapLoaded, setMapLoaded] = useState(false);

  // Simulate real-time GPS updates using WebSocket mockup
  useEffect(() => {
    const wsMock = setInterval(() => {
      setPartnerLocation(prev => ({
        lat: prev.lat + (Math.random() - 0.2) * 0.001,
        lng: prev.lng + (Math.random() - 0.2) * 0.001
      }));
    }, 2000);

    // Simulate map load
    setTimeout(() => setMapLoaded(true), 1000);

    return () => clearInterval(wsMock);
  }, []);

  const currentStepIndex = STATUS_STEPS.findIndex(step => step.id === order.status);

  return (
    <div className="tracking-page">
      <div className="container tracking-container">
        <div className="tracking-header">
          <NavLink to="/orders" className="back-btn glass">
            <ChevronLeft size={20} />
          </NavLink>
          <div className="header-info">
            <h1 className="order-id">Order #{orderId || order.id}</h1>
            <p className="order-seller">Sold by {order.seller}</p>
          </div>
          <div className="header-eta glass">
            <Clock size={16} className="color-primary-light" />
            <span>ETA: <strong>{order.eta}</strong></span>
          </div>
        </div>

        <div className="tracking-content grid">
          {/* Left Column: Map & Partner */}
          <div className="tracking-main stagger">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="map-container glass-card"
            >
              {!mapLoaded ? (
                <div className="map-loading">
                  <div className="spinner"></div>
                  <p>Connecting to GPS satellite...</p>
                </div>
              ) : (
                <div className="map-real-view">
                  <img src={noidaMap} alt="Live Map" className="map-img-real" />
                  <div className="map-overlay-glow"></div>
                  
                  {/* Destination Pin */}
                  <motion.div 
                    className="map-pin destination-pin pulse-glow"
                    style={{ left: '70%', top: '30%' }}
                  >
                    <MapPin size={24} fill="var(--color-primary)" color="white" />
                  </motion.div>

                  {/* Partner Pin (Moving) */}
                  <motion.div 
                    className="map-pin partner-pin"
                    animate={{
                      left: `${50 + (partnerLocation.lng - 77.375) * 10000}%`,
                      top: `${60 - (partnerLocation.lat - 28.625) * 10000}%`
                    }}
                    transition={{ ease: "linear", duration: 2 }}
                  >
                    <div className="partner-marker pulse-glow-warning">
                      <Truck size={16} color="white" />
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="partner-card glass-card"
            >
              <div className="partner-info-row">
                <div className="partner-avatar">
                  {order.deliveryPartner.name.charAt(0)}
                </div>
                <div className="partner-details">
                  <h3>{order.deliveryPartner.name}</h3>
                  <p>{order.deliveryPartner.vehicle}</p>
                  <div className="partner-rating">
                    <Star size={14} fill="var(--color-warning)" color="var(--color-warning)" />
                    <span>{order.deliveryPartner.rating} • Delivery Partner</span>
                  </div>
                </div>
              </div>
              <div className="partner-actions">
                <button className="btn btn-outline btn-full">
                  <MessageSquare size={18} /> Message
                </button>
                <button className="btn btn-primary btn-full">
                  <Phone size={18} /> Call Partner
                </button>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Timeline & Order Details */}
          <div className="tracking-sidebar stagger">
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="timeline-card glass-card"
            >
              <h3 className="card-title">Order Status</h3>
              <div className="timeline">
                {STATUS_STEPS.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div key={step.id} className={`timeline-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                      <div className="timeline-icon-wrapper">
                        <div className="timeline-line"></div>
                        <div className={`timeline-icon ${isCurrent ? 'pulse-glow' : ''}`}>
                          <step.icon size={16} />
                        </div>
                      </div>
                      <div className="timeline-content">
                        <h4>{step.label}</h4>
                        {isCurrent && <p className="timeline-desc">Your order is on the way.</p>}
                        {isCompleted && !isCurrent && <p className="timeline-time">10:30 AM</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="order-summary-card glass-card"
            >
              <h3 className="card-title">Order Summary</h3>
              <div className="summary-item">
                <span>{order.productTitle}</span>
                <span>₹{order.price}</span>
              </div>
              <div className="summary-item">
                <span>Delivery Fee</span>
                <span>₹30</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-item total">
                <span>Total Amount</span>
                <span className="gradient-text">₹{order.price + 30}</span>
              </div>
              
              <div className="delivery-address-box">
                <div className="box-icon"><MapPin size={16} /></div>
                <div>
                  <h4>Delivery Address</h4>
                  <p>A-14, Tower B, Supertech Emerald Court, Sector 93A, Noida, UP - 201304</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
