import { useState } from 'react';
import { 
  Search, CheckCircle, XCircle, Eye, 
  Filter, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import './AdminUsersPage.css'; // Reusing table styles

const MOCK_PRODUCTS = [
  { id: 'PRD-992', name: 'Organic Honey', seller: 'Fresh Farms', price: '₹450', stock: 120, status: 'pending', submittedAt: '2 hours ago' },
  { id: 'PRD-993', name: 'Handwoven Basket', seller: 'Crafts Villa', price: '₹890', stock: 15, status: 'approved', submittedAt: '1 day ago' },
  { id: 'PRD-994', name: 'Fake Rolex Watch', seller: 'Shady Store', price: '₹2000', stock: 5, status: 'rejected', submittedAt: '2 days ago' },
];

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    if (activeTab !== 'all' && p.status !== activeTab) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="admin-users-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Product Approvals</h1>
          <p className="admin-page-desc">Review and manage products submitted by sellers.</p>
        </div>
      </div>

      <div className="admin-table-container glass-card">
        <div className="table-toolbar">
          <div className="admin-tabs">
            <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>Pending Approval</button>
            <button className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>Approved</button>
            <button className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')}>Rejected</button>
            <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Products</button>
          </div>

          <div className="toolbar-actions">
            <div className="admin-search-sm">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product Info</th>
                <th>Seller</th>
                <th>Price & Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, i) => (
                <motion.tr 
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <td>
                    <div className="table-user-info">
                      <div className="table-avatar" style={{ borderRadius: '8px' }}>
                        {product.name.charAt(0)}
                      </div>
                      <div>
                        <div className="table-name">{product.name}</div>
                        <div className="table-email">{product.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{product.seller}</td>
                  <td>
                    <div>{product.price}</div>
                    <div className="table-email">{product.stock} in stock</div>
                  </td>
                  <td>
                    <span className={`status-badge ${product.status === 'pending' ? 'pending_verification' : product.status === 'approved' ? 'active' : 'banned'}`}>
                      {product.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="action-btn neutral" title="View Details">
                        <Eye size={18} />
                      </button>
                      {product.status === 'pending' && (
                        <>
                          <button className="action-btn success" title="Approve Product">
                            <CheckCircle size={18} />
                          </button>
                          <button className="action-btn danger" title="Reject Product">
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      {product.status === 'approved' && (
                        <button className="action-btn danger" title="Revoke Approval">
                          <AlertTriangle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="table-empty-state">
              <ShieldAlert size={48} className="color-text-muted" />
              <p>No products found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
