// src/pages/admin/AdminProductsPage.jsx
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../../utils/supabase/client';
import { getProducts, deleteProduct } from '../../services/productService';
import { bulkUploadProducts, duplicateProduct, getAdminStats } from '../../services/adminService';
import ProductForm from '../../components/admin/ProductForm';
import {
  Trash2, Edit, Plus, Loader2, Copy, Link as LinkIcon,
  Search, UploadCloud, Package, ShoppingBag, AlertTriangle,
  LayoutGrid, List, ChevronLeft, ChevronRight, ArrowUpDown,
  Eye, ImageIcon, MoreVertical, Filter, Download, RefreshCw,
  TrendingUp, Archive, FileText, Check, X, FileUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import './AdminProductsPage.css';

const ITEMS_PER_PAGE = 12;

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // View & Pagination
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);

  // Stats
  const [stats, setStats] = useState({
    total_products: 0, published: 0, drafts: 0, low_stock: 0
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, statsRes] = await Promise.all([
        getProducts(),
        getAdminStats()
      ]);

      if (prodRes.error) throw prodRes.error;
      setProducts(prodRes.data || []);

      if (!statsRes.error && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];
    const term = searchTerm.toLowerCase().trim();

    if (term) {
      result = result.filter(p =>
        (p.title || '').toLowerCase().includes(term) ||
        (p.brand || '').toLowerCase().includes(term) ||
        (p.sku || '').toLowerCase().includes(term) ||
        (p.category_name || '').toLowerCase().includes(term)
      );
    }

    if (statusFilter) {
      result = result.filter(p => (p.status || 'draft') === statusFilter);
    }

    if (categoryFilter) {
      result = result.filter(p => p.category_name === categoryFilter);
    }

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === 'price' || sortField === 'stock_quantity') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, searchTerm, statusFilter, categoryFilter, sortField, sortDir]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, categoryFilter]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category_name).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  // Handlers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleCopyLink = (productId) => {
    const url = `${window.location.origin}/product/${productId}`;
    navigator.clipboard.writeText(url);
    toast.success('Product link copied!');
  };

  const handleDuplicateProduct = async (product) => {
    const { error } = await duplicateProduct(product);
    if (error) {
      toast.error('Duplication failed');
    } else {
      toast.success('Product duplicated as draft');
      fetchData();
    }
  };

  const handleDelete = async (productId) => {
    const { error } = await deleteProduct(productId);
    if (error) {
      toast.error('Delete failed');
    } else {
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Product deleted');
    }
    setShowDeleteModal(null);
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkLoading(true);
    try {
      // In a real app, parse CSV here. For demo, we simulate parsing.
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockParsedProducts = [
        { title: 'New iPhone 15 Pro', brand: 'Apple', price: 129900, stock_quantity: 10, category_name: 'Electronics', status: 'draft' },
        { title: 'Samsung S24 Ultra', brand: 'Samsung', price: 119900, stock_quantity: 5, category_name: 'Electronics', status: 'draft' },
        { title: 'Leather Jacket', brand: 'Zara', price: 5999, stock_quantity: 20, category_name: 'Fashion', status: 'draft' },
      ];

      const { error } = await bulkUploadProducts(mockParsedProducts);
      if (error) throw error;

      toast.success(`Successfully uploaded ${mockParsedProducts.length} products`);
      setShowBulkModal(false);
      fetchData();
    } catch (error) {
      toast.error('Bulk upload failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const openCreate = () => { setEditingProduct(null); setShowForm(true); };
  const openEdit = (product) => { setEditingProduct(product); setShowForm(true); };

  return (
    <div className="admin-products-page">
      {/* Dashboard Stats */}
      <div className="products-stats-grid">
        <StatCard label="Total Products" value={stats.total_products} icon={Package} color="blue" />
        <StatCard label="Live on Store" value={stats.published} icon={TrendingUp} color="green" />
        <StatCard label="Pending Drafts" value={stats.drafts} icon={FileText} color="amber" />
        <StatCard label="Inventory Alerts" value={stats.low_stock} icon={AlertTriangle} color="red" />
      </div>

      {/* Control Bar */}
      <div className="products-toolbar glass">
        <div className="toolbar-left">
          <div className="products-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name, brand, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <Filter size={16} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        <div className="toolbar-right">
          <div className="view-toggle">
            <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}><List size={18} /></button>
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}><LayoutGrid size={18} /></button>
          </div>
          <button className="btn-secondary" onClick={() => setShowBulkModal(true)}>
            <FileUp size={18} /> Bulk
          </button>
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {/* Main List Area */}
      <div className="products-content-container">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={40} />
            <p>Orchestrating product catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState onAdd={openCreate} isFiltered={!!(searchTerm || statusFilter || categoryFilter)} />
        ) : viewMode === 'table' ? (
          <div className="table-wrapper glass">
            <table className="products-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('title')}>Product <ArrowUpDown size={12} /></th>
                  <th>Category</th>
                  <th>Status</th>
                  <th onClick={() => handleSort('price')}>Price <ArrowUpDown size={12} /></th>
                  <th onClick={() => handleSort('stock_quantity')}>Stock <ArrowUpDown size={12} /></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginatedProducts.map((p, i) => (
                    <ProductTableRow 
                      key={p.id} 
                      product={p} 
                      onEdit={() => openEdit(p)}
                      onDelete={() => setShowDeleteModal(p)}
                      onDuplicate={() => handleDuplicateProduct(p)}
                      onCopyLink={() => handleCopyLink(p.id)}
                      index={i}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            <Pagination 
              current={currentPage} 
              total={totalPages} 
              onPageChange={setCurrentPage}
              totalItems={filteredProducts.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        ) : (
          <div className="grid-wrapper">
            <div className="products-grid">
              {paginatedProducts.map((p, i) => (
                <ProductGridCard 
                  key={p.id} 
                  product={p} 
                  onEdit={() => openEdit(p)}
                  onDelete={() => setShowDeleteModal(p)}
                  index={i}
                />
              ))}
            </div>
            <Pagination 
              current={currentPage} 
              total={totalPages} 
              onPageChange={setCurrentPage}
              totalItems={filteredProducts.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <ProductForm
            product={editingProduct}
            onClose={() => setShowForm(false)}
            onSuccess={fetchData}
          />
        )}

        {showDeleteModal && (
          <DeleteModal 
            product={showDeleteModal} 
            onCancel={() => setShowDeleteModal(null)}
            onConfirm={() => handleDelete(showDeleteModal.id)}
          />
        )}

        {showBulkModal && (
          <BulkUploadModal 
            onClose={() => setShowBulkModal(false)}
            onUpload={handleBulkUpload}
            loading={bulkLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components
const StatCard = ({ label, value, icon: Icon, color }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="stat-card glass">
    <div className={`stat-icon ${color}`}><Icon size={24} /></div>
    <div className="stat-info">
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  </motion.div>
);

const ProductTableRow = ({ product: p, onEdit, onDelete, onDuplicate, onCopyLink, index }) => (
  <motion.tr 
    initial={{ opacity: 0, x: -10 }} 
    animate={{ opacity: 1, x: 0 }} 
    transition={{ delay: index * 0.02 }}
  >
    <td>
      <div className="product-info-cell">
        <div className="prod-thumb">
          {p.image_url ? <img src={p.image_url} alt="" /> : <ImageIcon size={20} />}
        </div>
        <div>
          <div className="prod-title">{p.title}</div>
          <div className="prod-sku">{p.brand} • {p.sku || 'No SKU'}</div>
        </div>
      </div>
    </td>
    <td><span className="cat-badge">{p.category_name || 'Uncategorized'}</span></td>
    <td><span className={`status-pill ${p.status}`}>{p.status}</span></td>
    <td>
      <div className="price-info">
        <span className="current">₹{p.discount_price || p.price}</span>
        {p.discount_price && <span className="original">₹{p.price}</span>}
      </div>
    </td>
    <td>
      <div className={`stock-status ${p.stock_quantity <= 5 ? 'low' : ''}`}>
        {p.stock_quantity} units
      </div>
    </td>
    <td>
      <div className="action-btns">
        <button onClick={onEdit} className="edit"><Edit size={16} /></button>
        <button onClick={onDuplicate} className="copy"><Copy size={16} /></button>
        <button onClick={onCopyLink} className="link"><LinkIcon size={16} /></button>
        <button onClick={onDelete} className="delete"><Trash2 size={16} /></button>
      </div>
    </td>
  </motion.tr>
);

const ProductGridCard = ({ product: p, onEdit, onDelete, index }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }} 
    animate={{ opacity: 1, scale: 1 }} 
    className="prod-grid-card glass"
  >
    <div className="card-media">
      {p.image_url ? <img src={p.image_url} alt="" /> : <div className="placeholder"><ImageIcon size={40} /></div>}
      <div className="card-badges">
        <span className={`status-pill ${p.status}`}>{p.status}</span>
      </div>
    </div>
    <div className="card-content">
      <h4>{p.title}</h4>
      <p>{p.category_name}</p>
      <div className="card-footer">
        <div className="price">₹{p.discount_price || p.price}</div>
        <div className="btns">
          <button onClick={onEdit}><Edit size={14} /></button>
          <button onClick={onDelete} className="delete"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  </motion.div>
);

const Pagination = ({ current, total, onPageChange, totalItems, itemsPerPage }) => (
  <div className="pagination">
    <p>Showing {Math.min((current-1)*itemsPerPage+1, totalItems)}-{Math.min(current*itemsPerPage, totalItems)} of {totalItems}</p>
    <div className="page-btns">
      <button disabled={current === 1} onClick={() => onPageChange(current-1)}><ChevronLeft size={16} /></button>
      {[...Array(total)].map((_, i) => (
        <button key={i} className={current === i+1 ? 'active' : ''} onClick={() => onPageChange(i+1)}>{i+1}</button>
      )).slice(0, 5)}
      <button disabled={current === total} onClick={() => onPageChange(current+1)}><ChevronRight size={16} /></button>
    </div>
  </div>
);

const EmptyState = ({ onAdd, isFiltered }) => (
  <div className="empty-state">
    <ShoppingBag size={48} />
    <h3>{isFiltered ? 'No products match filters' : 'Catalog is empty'}</h3>
    <p>{isFiltered ? 'Try clearing your search or filters.' : 'Get started by adding your first product.'}</p>
    {!isFiltered && <button className="btn-primary" onClick={onAdd}>Add Product</button>}
  </div>
);

const DeleteModal = ({ product, onCancel, onConfirm }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="modal-overlay">
    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="modal-content glass">
      <div className="modal-icon warning"><AlertTriangle size={32} /></div>
      <h3>Delete Product?</h3>
      <p>Are you sure you want to delete <strong>{product.title}</strong>? This will remove all associated images and data.</p>
      <div className="modal-btns">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm}>Delete Permanently</button>
      </div>
    </motion.div>
  </motion.div>
);

const BulkUploadModal = ({ onClose, onUpload, loading }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="modal-overlay">
    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="modal-content glass">
      <div className="modal-icon"><UploadCloud size={32} /></div>
      <h3>Bulk Product Upload</h3>
      <p>Upload a CSV file with your product data. Ensure your headers match our template.</p>
      
      <div className="upload-zone">
        {loading ? (
          <div className="loading-upload">
            <Loader2 className="animate-spin" size={24} />
            <span>Processing CSV data...</span>
          </div>
        ) : (
          <label className="file-label">
            <input type="file" accept=".csv" onChange={onUpload} />
            <div className="label-content">
              <Download size={20} />
              <span>Select CSV File</span>
            </div>
          </label>
        )}
      </div>

      <div className="modal-btns">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-link"><Download size={14} /> Download Template</button>
      </div>
    </motion.div>
  </motion.div>
);
