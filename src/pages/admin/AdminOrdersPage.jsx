import { useState } from 'react';
import { 
  Eye, RefreshCw, Truck, RotateCcw, ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import './AdminUsersPage.css'; // Reusing table styles

const MOCK_ORDERS = [
  { id: 'ORD-8821', customer: 'Priya Singh', amount: '₹1,250', status: 'processing', date: 'Today, 10:30 AM', payment: 'Paid' },
  { id: 'ORD-8820', customer: 'Amit Sharma', amount: '₹450', status: 'shipped', date: 'Today, 09:15 AM', payment: 'Paid' },
  { id: 'ORD-8819', customer: 'Neha Gupta', amount: '₹890', status: 'refund_requested', date: 'Yesterday, 04:20 PM', payment: 'Disputed' },
  { id: 'ORD-8818', customer: 'Vikram Singh', amount: '₹2,100', status: 'delivered', date: 'Yesterday, 02:10 PM', payment: 'Paid' },
];

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');


  const filteredOrders = MOCK_ORDERS.filter(o => {
    if (activeTab === 'refunds' && o.status !== 'refund_requested') return false;
    if (activeTab === 'active' && !['processing', 'shipped'].includes(o.status)) return false;

    return true;
  });

  return (
    <div className="admin-users-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Order & Refund Management</h1>
          <p className="admin-page-desc">Monitor live orders, assign delivery, and process refunds.</p>
        </div>
      </div>

      <div className="admin-table-container glass-card">
        <div className="table-toolbar">
          <div className="admin-tabs">
            <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Orders</button>
            <button className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Orders</button>
            <button className={`tab-btn ${activeTab === 'refunds' ? 'active' : ''}`} onClick={() => setActiveTab('refunds')}>Refund Requests</button>
          </div>

          <div className="toolbar-actions">

          </div>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID & Date</th>
                <th>Customer</th>
                <th>Amount & Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, i) => (
                <motion.tr 
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <td>
                    <div className="table-name">{order.id}</div>
                    <div className="table-date">{order.date}</div>
                  </td>
                  <td>{order.customer}</td>
                  <td>
                    <div className="table-name">{order.amount}</div>
                    <div className="table-email">{order.payment}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      order.status === 'delivered' ? 'active' : 
                      order.status === 'refund_requested' ? 'banned' : 'pending_verification'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="action-btn neutral" title="View Details">
                        <Eye size={18} />
                      </button>
                      
                      {order.status === 'processing' && (
                        <button className="action-btn warning" title="Assign Delivery Partner">
                          <Truck size={18} />
                        </button>
                      )}

                      {order.status === 'refund_requested' && (
                        <button className="action-btn success" title="Process Refund">
                          <RefreshCw size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="table-empty-state">
              <ShieldAlert size={48} className="color-text-muted" />
              <p>No orders found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
