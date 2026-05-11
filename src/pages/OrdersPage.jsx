import React from 'react';
import { Package, Clock, ChevronRight, MapPin, CheckCircle2, Navigation } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import './OrdersPage.css';

const myOrders = [
  {
    id: 'ORD-7721',
    productTitle: 'Fresh Organic Tomatoes',
    price: 120,
    status: 'out_for_delivery',
    date: 'Today, 10:30 AM',
    seller: 'Fresh Farm Organics',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'ORD-6612',
    productTitle: 'Handpainted Ceramic Mug Set',
    price: 850,
    status: 'delivered',
    date: 'Yesterday, 4:15 PM',
    seller: 'Rajesh Kumar',
    image: 'https://images.unsplash.com/photo-1578511435345-3f305046206d?auto=format&fit=crop&q=80&w=200'
  }
];

export default function OrdersPage() {
  return (
    <div className="orders-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">My <span className="gradient-text">Orders</span></h1>
          <p className="page-subtitle">Track your recent purchases and delivery status.</p>
        </div>

        <div className="orders-list stagger">
          {myOrders.map((order, i) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="order-card glass-card"
            >
              <div className="order-main">
                <div className="order-img-wrapper">
                  <img src={order.image} alt={order.productTitle} />
                </div>
                <div className="order-details">
                  <div className="order-header">
                    <span className="order-id">#{order.id}</span>
                    <span className={`status-badge ${order.status}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="product-title">{order.productTitle}</h3>
                  <div className="order-meta">
                    <span className="seller-name">{order.seller}</span>
                    <span className="dot"></span>
                    <span className="order-date">{order.date}</span>
                  </div>
                  <div className="order-price">₹{order.price}</div>
                </div>
              </div>
              
              <div className="order-actions">
                {order.status === 'out_for_delivery' || order.status === 'assigned' || order.status === 'picked_up' ? (
                  <NavLink to={`/track/${order.id}`} className="btn btn-primary btn-sm">
                    <Navigation size={16} /> Track Order
                  </NavLink>
                ) : (
                  <button className="btn btn-ghost btn-sm">View Details</button>
                )}
                <button className="btn btn-ghost btn-sm">Help</button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
