import { useState } from 'react';
import { 
  Search, Filter, ShieldCheck, Ban, CheckCircle, 
  XCircle, MoreVertical, ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import './AdminUsersPage.css';

const MOCK_USERS = [
  { id: 'USR-101', name: 'Ravi Kumar', role: 'customer', email: 'ravi@example.com', status: 'active', joinDate: '2026-04-12' },
  { id: 'USR-102', name: 'Fresh Bakes', role: 'seller', email: 'bakes@example.com', status: 'pending_verification', joinDate: '2026-05-10', doc: 'FSSAI License.pdf' },
  { id: 'USR-103', name: 'Rahul Delivery', role: 'delivery', email: 'rahul.d@example.com', status: 'active', joinDate: '2026-03-22' },
  { id: 'USR-104', name: 'Suspicious User', role: 'customer', email: 'spam@example.com', status: 'banned', joinDate: '2026-05-11' },
];

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = MOCK_USERS.filter(user => {
    if (activeTab !== 'all' && user.role !== activeTab) return false;
    if (searchQuery && !user.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="admin-users-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-desc">Manage customers, sellers, and delivery partners.</p>
        </div>
      </div>

      <div className="admin-table-container glass-card">
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="admin-tabs">
            <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Users</button>
            <button className={`tab-btn ${activeTab === 'customer' ? 'active' : ''}`} onClick={() => setActiveTab('customer')}>Customers</button>
            <button className={`tab-btn ${activeTab === 'seller' ? 'active' : ''}`} onClick={() => setActiveTab('seller')}>Sellers</button>
            <button className={`tab-btn ${activeTab === 'delivery' ? 'active' : ''}`} onClick={() => setActiveTab('delivery')}>Delivery</button>
          </div>

          <div className="toolbar-actions">
            <div className="admin-search-sm">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn btn-outline btn-sm">
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => (
                <motion.tr 
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <td>
                    <div className="table-user-info">
                      <div className="table-avatar">{user.name.charAt(0)}</div>
                      <div>
                        <div className="table-name">{user.name}</div>
                        <div className="table-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="table-date">{user.joinDate}</td>
                  <td>
                    <div className="table-actions">
                      {user.status === 'pending_verification' && (
                        <>
                          <button className="action-btn success" title="Approve">
                            <CheckCircle size={18} />
                          </button>
                          <button className="action-btn danger" title="Reject">
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      {user.status === 'active' && (
                        <button className="action-btn warning" title="Ban User">
                          <Ban size={18} />
                        </button>
                      )}
                      {user.status === 'banned' && (
                        <button className="action-btn success" title="Unban User">
                          <ShieldCheck size={18} />
                        </button>
                      )}
                      <button className="action-btn neutral" title="More Options">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="table-empty-state">
              <ShieldAlert size={48} className="color-text-muted" />
              <p>No users found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="table-pagination">
          <span className="pagination-info">Showing 1 to {filteredUsers.length} of {filteredUsers.length} entries</span>
          <div className="pagination-controls">
            <button className="btn btn-outline btn-sm" disabled>Previous</button>
            <button className="btn btn-primary btn-sm">1</button>
            <button className="btn btn-outline btn-sm" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
