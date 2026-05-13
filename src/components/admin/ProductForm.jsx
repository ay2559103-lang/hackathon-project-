import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, Upload, Sparkles, Plus, Trash2, 
  Save, RefreshCcw, Loader2, Image as ImageIcon,
  Check, AlertCircle, Copy, Info, ChevronRight,
  ChevronDown, Settings, Eye, Layout, Type,
  Tag, List, Layers, Search, Globe, Wand2,
  MoreHorizontal, GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { supabase } from '../../utils/supabase/client';
import { generateProductContent, improveContent } from '../../services/aiService';
import { uploadProductImage, saveImageGallery } from '../../services/imageService';
import './ProductForm.css';

const TABS = [
  { id: 'general', label: 'General Info', icon: Type },
  { id: 'media', label: 'Media Gallery', icon: ImageIcon },
  { id: 'inventory', label: 'Inventory & Variants', icon: Layers },
  { id: 'specs', label: 'Specifications', icon: List },
  { id: 'seo', label: 'SEO & Marketing', icon: Globe },
];

const CATEGORIES = [
  'Electronics', 'Fashion', 'Home & Living', 'Grocery', 
  'Beauty & Health', 'Sports & Outdoors', 'Books', 'Automotive'
];

export default function ProductForm({ product, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  
  const [images, setImages] = useState([]); // { url, path, is_primary, alt_text }
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    category_name: '',
    brand: '',
    price: '',
    discount_price: '',
    stock_quantity: '',
    sku: '',
    tags: '',
    status: 'draft',
    condition: 'new',
    weight: '',
    shipping_charges: 0,
    seo_title: '',
    seo_description: '',
  });

  const [specifications, setSpecifications] = useState([{ key: '', value: '' }]);
  const [variants, setVariants] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize
  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || '',
        description: product.description || '',
        short_description: product.short_description || '',
        category_name: product.category_name || '',
        brand: product.brand || '',
        price: product.price || '',
        discount_price: product.discount_price || '',
        stock_quantity: product.stock_quantity || '',
        sku: product.sku || '',
        tags: product.tags ? product.tags.join(', ') : '',
        status: product.status || 'draft',
        condition: product.product_condition || 'new',
        weight: product.weight || '',
        shipping_charges: product.shipping_charges || 0,
        seo_title: product.seo_title || '',
        seo_description: product.seo_description || '',
      });

      if (product.specifications && Object.keys(product.specifications).length > 0) {
        setSpecifications(Object.entries(product.specifications).map(([key, value]) => ({ key, value })));
      }

      // Fetch images
      const fetchImages = async () => {
        const { data } = await supabase.from('product_images').select('*').eq('product_id', product.id).order('display_order');
        if (data) setImages(data);
      };
      fetchImages();
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...specifications];
    newSpecs[index][field] = value;
    setSpecifications(newSpecs);
    setIsDirty(true);
  };

  const addSpec = () => setSpecifications([...specifications, { key: '', value: '' }]);
  const removeSpec = (index) => setSpecifications(specifications.filter((_, i) => i !== index));

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingImage(true);
    for (const file of files) {
      const { url, path, error } = await uploadProductImage(file);
      if (!error) {
        setImages(prev => [...prev, { 
          url, 
          path, 
          is_primary: prev.length === 0, 
          alt_text: formData.title,
          display_order: prev.length
        }]);
      } else {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setUploadingImage(false);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const setPrimaryImage = (index) => {
    setImages(prev => prev.map((img, i) => ({ ...img, is_primary: i === index })));
  };

  const handleAiAssist = async () => {
    if (!formData.title && !aiNotes) {
      toast.error('Please provide a title or notes for the AI');
      return;
    }

    setAiLoading(true);
    try {
      const result = await generateProductContent({
        title: formData.title,
        brand: formData.brand,
        category: formData.category_name,
        shortNotes: aiNotes
      });

      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        description: result.description,
        short_description: result.short_description,
        tags: result.tags,
        seo_title: result.seo_title,
        seo_description: result.seo_description,
      }));

      if (result.specifications) {
        setSpecifications(Object.entries(result.specifications).map(([key, value]) => ({ key, value })));
      }

      setShowAiAssistant(false);
      toast.success('AI suggestions applied!');
    } catch (error) {
      toast.error('AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Prepare Payload
      const specsObject = specifications.reduce((acc, curr) => {
        if (curr.key && curr.value) acc[curr.key] = curr.value;
        return acc;
      }, {});

      const productPayload = {
        ...formData,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        stock_quantity: parseInt(formData.stock_quantity),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        specifications: specsObject,
        image_url: images.find(img => img.is_primary)?.url || images[0]?.url || null,
        thumbnail_url: images.find(img => img.is_primary)?.url || images[0]?.url || null,
        updated_at: new Date(),
      };

      // 2. Save Product
      let productId;
      if (product) {
        const { error } = await supabase.from('products').update(productPayload).eq('id', product.id);
        if (error) throw error;
        productId = product.id;
      } else {
        const { data, error } = await supabase.from('products').insert([productPayload]).select().single();
        if (error) throw error;
        productId = data.id;
      }

      // 3. Save Images
      // First delete old image links
      await supabase.from('product_images').delete().eq('product_id', productId);
      // Insert new ones
      if (images.length > 0) {
        await saveImageGallery(productId, images);
      }

      toast.success(product ? 'Product updated' : 'Product published');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-overlay">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="product-form-container glass"
      >
        {/* Header */}
        <div className="form-header">
          <div className="header-left">
            <div className={`status-badge ${formData.status}`}>
              {formData.status}
            </div>
            <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
          </div>
          <div className="header-actions">
            <button 
              type="button" 
              className="ai-main-btn"
              onClick={() => setShowAiAssistant(!showAiAssistant)}
            >
              <Sparkles size={16} />
              AI Assistant
            </button>
            <button onClick={onClose} className="close-btn">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="form-tabs">
          {TABS.map(tab => (
            <button 
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="form-body">
          <div className="tab-content">
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="form-section-group">
                <div className="input-row">
                  <div className="input-group flex-[2]">
                    <label>Product Title</label>
                    <input 
                      name="title" 
                      value={formData.title} 
                      onChange={handleChange} 
                      placeholder="Enter a descriptive title..."
                      required
                    />
                  </div>
                  <div className="input-group flex-1">
                    <label>Brand</label>
                    <input 
                      name="brand" 
                      value={formData.brand} 
                      onChange={handleChange} 
                      placeholder="Brand name"
                    />
                  </div>
                </div>

                <div className="input-row">
                  <div className="input-group">
                    <label>Category</label>
                    <select name="category_name" value={formData.category_name} onChange={handleChange} required>
                      <option value="">Select Category</option>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Condition</label>
                    <select name="condition" value={formData.condition} onChange={handleChange}>
                      <option value="new">New</option>
                      <option value="like_new">Like New</option>
                      <option value="refurbished">Refurbished</option>
                      <option value="used">Used</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label>Short Description</label>
                  <input 
                    name="short_description" 
                    value={formData.short_description} 
                    onChange={handleChange} 
                    placeholder="Brief highlight of the product..."
                  />
                </div>

                <div className="input-group">
                  <label>Full Description</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    rows="6"
                    placeholder="Provide detailed information about features, benefits, and use cases..."
                  />
                </div>
              </div>
            )}

            {/* MEDIA TAB */}
            {activeTab === 'media' && (
              <div className="form-section-group">
                <div className="media-upload-container">
                  <input 
                    type="file" 
                    id="media-input" 
                    multiple 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />
                  <label htmlFor="media-input" className="dropzone glass">
                    {uploadingImage ? (
                      <Loader2 className="animate-spin" size={32} />
                    ) : (
                      <Upload size={32} />
                    )}
                    <div className="text-center">
                      <p className="font-medium">Click or drag images to upload</p>
                      <p className="text-xs text-muted">Supports JPG, PNG, WebP (Max 5MB each)</p>
                    </div>
                  </label>

                  <div className="media-preview-grid">
                    {images.map((img, index) => (
                      <motion.div 
                        layout
                        key={img.path || index} 
                        className={`preview-card glass ${img.is_primary ? 'primary' : ''}`}
                      >
                        <img src={img.url} alt="Product" />
                        <div className="preview-overlay">
                          <button type="button" onClick={() => setPrimaryImage(index)} title="Set as Primary">
                            <Check size={14} />
                          </button>
                          <button type="button" onClick={() => removeImage(index)} className="danger" title="Remove">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {img.is_primary && <span className="primary-label">Primary</span>}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* INVENTORY TAB */}
            {activeTab === 'inventory' && (
              <div className="form-section-group">
                <div className="input-row">
                  <div className="input-group">
                    <label>Regular Price (₹)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                    <label>Discount Price (₹)</label>
                    <input type="number" name="discount_price" value={formData.discount_price} onChange={handleChange} />
                  </div>
                </div>

                <div className="input-row">
                  <div className="input-group">
                    <label>Stock Quantity</label>
                    <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                    <label>SKU / ID</label>
                    <input name="sku" value={formData.sku} onChange={handleChange} placeholder="AUTO-GEN-123" />
                  </div>
                </div>

                <div className="input-row">
                  <div className="input-group">
                    <label>Weight (kg)</label>
                    <input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label>Shipping Charge (₹)</label>
                    <input type="number" name="shipping_charges" value={formData.shipping_charges} onChange={handleChange} />
                  </div>
                </div>

                <div className="input-group">
                  <label>Tags (comma separated)</label>
                  <input name="tags" value={formData.tags} onChange={handleChange} placeholder="e.g., electronic, smart, new" />
                </div>
              </div>
            )}

            {/* SPECIFICATIONS TAB */}
            {activeTab === 'specs' && (
              <div className="form-section-group">
                <p className="section-desc">Add technical specs or features in key-value pairs.</p>
                <div className="specs-list">
                  {specifications.map((spec, index) => (
                    <div key={index} className="spec-row">
                      <div className="drag-handle"><GripVertical size={16} /></div>
                      <input 
                        placeholder="Feature (e.g., Battery)" 
                        value={spec.key} 
                        onChange={(e) => handleSpecChange(index, 'key', e.target.value)} 
                      />
                      <input 
                        placeholder="Value (e.g., 5000mAh)" 
                        value={spec.value} 
                        onChange={(e) => handleSpecChange(index, 'value', e.target.value)} 
                      />
                      <button type="button" onClick={() => removeSpec(index)} className="remove-btn">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addSpec} className="add-btn">
                    <Plus size={16} /> Add Specification
                  </button>
                </div>
              </div>
            )}

            {/* SEO TAB */}
            {activeTab === 'seo' && (
              <div className="form-section-group">
                <div className="input-group">
                  <label>SEO Title</label>
                  <input name="seo_title" value={formData.seo_title} onChange={handleChange} maxLength={70} />
                  <span className="char-count">{formData.seo_title.length}/70</span>
                </div>
                <div className="input-group">
                  <label>SEO Meta Description</label>
                  <textarea name="seo_description" value={formData.seo_description} onChange={handleChange} rows="3" maxLength={160} />
                  <span className="char-count">{formData.seo_description.length}/160</span>
                </div>
                <div className="seo-preview glass">
                  <p className="preview-url">localsell.com &gt; products &gt; {formData.title.toLowerCase().replace(/\s+/g, '-') || '... '}</p>
                  <h4 className="preview-title">{formData.seo_title || formData.title || 'Product Title'}</h4>
                  <p className="preview-desc">{formData.seo_description || formData.description.slice(0, 160) || 'Product meta description goes here...'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Form Footer */}
          <div className="form-footer">
            <div className="footer-left">
              {isDirty && <span className="unsaved-notice"><AlertCircle size={14} /> Unsaved changes</span>}
            </div>
            <div className="footer-right">
              <button type="button" onClick={onClose} className="btn-cancel">Discard</button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {product ? 'Update Changes' : 'Publish Product'}
              </button>
            </div>
          </div>
        </form>

        {/* AI Assistant Sidebar/Overlay */}
        <AnimatePresence>
          {showAiAssistant && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="ai-assistant-panel glass"
            >
              <div className="ai-header">
                <h3><Sparkles size={18} /> AI Product Writer</h3>
                <button onClick={() => setShowAiAssistant(false)}><X size={18} /></button>
              </div>
              <div className="ai-body">
                <p className="text-sm opacity-70 mb-4">Provide context to help the AI generate high-converting product copy.</p>
                
                <div className="input-group">
                  <label>Brief Notes (Optional)</label>
                  <textarea 
                    value={aiNotes} 
                    onChange={(e) => setAiNotes(e.target.value)}
                    placeholder="e.g. fast charging, 5G, waterproof, great for gaming..."
                    rows="4"
                  />
                </div>

                <div className="ai-actions">
                  <button 
                    onClick={handleAiAssist} 
                    disabled={aiLoading} 
                    className="ai-gen-btn"
                  >
                    {aiLoading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                    Generate All Fields
                  </button>
                  <button className="ai-improve-btn" onClick={() => improveContent(formData.description)}>
                    Improve Current Description
                  </button>
                </div>

                <div className="ai-tips">
                  <div className="tip">
                    <Info size={14} />
                    <span>AI generates Title, Description, Tags, Specs, and SEO meta.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
