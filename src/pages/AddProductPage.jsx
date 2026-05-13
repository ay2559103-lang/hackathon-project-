import { useState, useEffect, useRef } from 'react';
import {
  Upload, Sparkles, Camera, Tag, IndianRupee,
  FileText, MapPin, Package, Check, Loader, X,
  Image as ImageIcon, Plus, Wand2, ChevronRight, ChevronLeft,
  TrendingUp, Zap, Info, ShieldCheck, Truck, ShieldAlert,
  ArrowRight, Save, Eye, CheckCircle2, Search, HelpCircle,
  AlertCircle, DollarSign, Box, Layers, Map, Calendar,
  RefreshCcw, Verified, Lock, User
} from 'lucide-react';
import { categories } from '../data/mockData';
import { createProduct } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateProductContent } from '../services/aiService';
import './AddProductPage.css';

export default function AddProductPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  
  // UI State
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState(null);
  
  // Image State
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [imageIssues, setImageIssues] = useState([]);

  // Form Data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    brand: '',
    condition: 'New',
    features: [],
    price: '',
    originalPrice: '',
    stock: '1',
    shippingAvailable: 'yes',
    shippingCharges: '0',
    deliveryTime: '3-5 Days',
    city: 'Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    pincode: '',
    returnPolicy: '7 Days Return',
    warranty: '',
    tags: [],
    confirmedAccuracy: false,
    agreedTerms: false
  });

  // Dynamic Lists inputs
  const [featureInput, setFeatureInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('product_listing_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.title || formData.description) {
        localStorage.setItem('product_listing_draft', JSON.stringify(formData));
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData]);

  // Check for prompt in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prompt = params.get('prompt');
    if (prompt && !formData.title && !formData.description) {
      handleAutofillFromPrompt(prompt);
    }
  }, [location.search]);

  const handleAutofillFromPrompt = async (prompt) => {
    setIsGenerating(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        title: prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt,
        description: `This premium product is meticulously crafted based on your request: "${prompt}". We've focused on delivering exceptional quality and a sophisticated aesthetic that stands out. Built for those who appreciate the finer details.`,
        category: 'Electronics',
        price: '1499',
        stock: '1',
        tags: ['premium', 'exclusive', 'ai-curated']
      }));
      setIsGenerating(false);
      toast.success("AI has pre-filled your listing based on your idea!");
      setStep(1);
    }, 1500);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 10) {
      toast.error("You can only upload up to 10 images.");
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    files.forEach(file => {
      if (file.size < 100 * 1024) {
        setImageIssues(prev => [...prev, `Image ${file.name} is low resolution.`]);
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviews(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    if (thumbnailIndex === index) setThumbnailIndex(0);
    else if (thumbnailIndex > index) setThumbnailIndex(thumbnailIndex - 1);
  };

  const generateWithAI = async () => {
    if (imagePreviews.length === 0) {
      toast.error("Please upload an image for AI analysis.");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateProductContent({
        title: formData.title || "New Product",
        category: formData.category || "General",
        brand: formData.brand || "Local",
        shortNotes: formData.description || "A premium local product."
      });

      setFormData({
        ...formData,
        title: result.title,
        description: result.description,
        category: result.category_suggestion || formData.category,
        tags: result.tags ? result.tags.split(',').map(t => t.trim()) : [],
        seoTitle: result.seo_title,
        seoDescription: result.seo_description
      });
      toast.success("Gemini AI has polished your listing!");
    } catch (err) {
      console.error(err);
      toast.error("AI service is currently unavailable.");
    } finally {
      setIsGenerating(false);
    }
  };

  const validateStep = (s) => {
    if (s === 1) {
      if (imageFiles.length === 0) return "Add at least one photo.";
      if (!formData.title) return "Product Name is required.";
    }
    if (s === 2) {
      if (!formData.category) return "Select a category.";
      if (!formData.description) return "Add a description.";
    }
    if (s === 3) {
      if (!formData.price || parseFloat(formData.price) <= 0) return "Valid price is required.";
    }
    if (s === 4) {
      if (!formData.pincode) return "PIN Code is required.";
    }
    return null;
  };

  const handlePublish = async () => {
    if (!formData.confirmedAccuracy || !formData.agreedTerms) {
      toast.error("Please agree to terms and accuracy.");
      return;
    }
    setIsPublishing(true);
    try {
      const orderedFiles = [...imageFiles];
      const thumb = orderedFiles.splice(thumbnailIndex, 1)[0];
      orderedFiles.unshift(thumb);
      await createProduct(formData, orderedFiles, user, 'active');
      localStorage.removeItem('product_listing_draft');
      toast.success("Product published!");
      navigate('/dashboard');
    } catch (err) {
      toast.error("Failed: " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const steps = [
    { number: 1, label: 'Photos', icon: <Camera size={18} /> },
    { number: 2, label: 'Details', icon: <FileText size={18} /> },
    { number: 3, label: 'Pricing', icon: <IndianRupee size={18} /> },
    { number: 4, label: 'Shipping', icon: <Truck size={18} /> },
    { number: 5, label: 'Review', icon: <ShieldCheck size={18} /> }
  ];

  return (
    <div className="add-product-page premium-bg">
      <div className="container narrow">
        
        {/* Premium Header */}
        <header className="listing-header animate-fade-in">
          <div className="header-eyebrow">
            <Sparkles size={14} className="icon-pulse" />
            <span>AI-Powered Seller Studio</span>
          </div>
          <h1 className="listing-title">Create New <span className="gradient-text">Listing</span></h1>
          <p className="listing-subtitle">Showcase your products to thousands of local buyers with premium AI assistance.</p>
        </header>

        {/* High-Fidelity Stepper */}
        <div className="premium-stepper glass">
          {steps.map((s, i) => (
            <div key={i} className={`stepper-node ${step === s.number ? 'active' : ''} ${step > s.number ? 'completed' : ''}`}>
              <div className="node-icon">
                {step > s.number ? <Check size={20} /> : s.icon}
              </div>
              <span className="node-label">{s.label}</span>
              {i < steps.length - 1 && <div className="node-line"></div>}
            </div>
          ))}
        </div>

        <div className="listing-main-content">
          <div className="listing-form-container glass-card">
            
            {/* STEP 1: MEDIA & TITLE */}
            {step === 1 && (
              <div className="step-content animate-slide-up">
                <div className="content-header">
                  <Camera size={24} className="color-primary" />
                  <h2>Media & Identity</h2>
                </div>

                <div className="field-group">
                  <label className="p-label">Product Photos <span className="req">*</span></label>
                  <div 
                    className={`p-upload-zone ${imagePreviews.length > 0 ? 'has-files' : ''}`}
                    onClick={() => fileInputRef.current.click()}
                  >
                    {imagePreviews.length === 0 ? (
                      <div className="upload-placeholder">
                        <div className="upload-glow-icon"><Upload size={32} /></div>
                        <h3>Upload Product Images</h3>
                        <p>Drag and drop or click to upload (Max 10)</p>
                      </div>
                    ) : (
                      <div className="p-preview-grid">
                        {imagePreviews.map((src, idx) => (
                          <div 
                            key={idx} 
                            className={`p-preview-item ${thumbnailIndex === idx ? 'is-main' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setThumbnailIndex(idx); }}
                          >
                            <img src={src} alt="Preview" />
                            <button className="p-remove-btn" onClick={(e) => { e.stopPropagation(); removeImage(idx); }}>
                              <X size={14} />
                            </button>
                            {thumbnailIndex === idx && <div className="main-badge">COVER</div>}
                          </div>
                        ))}
                        {imagePreviews.length < 10 && (
                          <div className="p-add-more">
                            <Plus size={24} />
                            <span>Add</span>
                          </div>
                        )}
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} hidden multiple onChange={handleImageUpload} accept="image/*" />
                  </div>
                </div>

                <div className="field-group mt-xl">
                  <label className="p-label">Product Title <span className="req">*</span></label>
                  <div className="p-input-wrapper">
                    <input 
                      type="text" 
                      className="p-input" 
                      placeholder="e.g. Handmade Vintage Walnut Coffee Table"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                    <span className="p-limit">{formData.title.length}/100</span>
                  </div>
                </div>

                <div className="ai-magic-banner glass">
                  <div className="ai-info">
                    <Wand2 size={24} className="color-accent" />
                    <div>
                      <h4>AI Listing Assistant</h4>
                      <p>Let AI analyze your photos to generate a premium description.</p>
                    </div>
                  </div>
                  <button 
                    className={`btn btn-primary ai-pulse ${isGenerating ? 'loading' : ''}`}
                    onClick={generateWithAI}
                    disabled={imagePreviews.length === 0 || isGenerating}
                  >
                    {isGenerating ? <Loader size={18} className="spin" /> : <Sparkles size={18} />}
                    {isGenerating ? 'Analyzing...' : 'Auto-Generate'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DETAILS */}
            {step === 2 && (
              <div className="step-content animate-slide-up">
                <div className="content-header">
                  <FileText size={24} className="color-primary" />
                  <h2>Product Specifications</h2>
                </div>

                <div className="p-grid-2">
                  <div className="field-group">
                    <label className="p-label">Category <span className="req">*</span></label>
                    <select className="p-select" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="p-label">Condition <span className="req">*</span></label>
                    <select className="p-select" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                      {['New', 'Like New', 'Good', 'Fair', 'Used'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="field-group mt-xl">
                  <label className="p-label">Product Description <span className="req">*</span></label>
                  <textarea 
                    className="p-textarea" 
                    rows="6"
                    placeholder="Tell your customers what makes this product special..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: PRICING */}
            {step === 3 && (
              <div className="step-content animate-slide-up">
                <div className="content-header">
                  <IndianRupee size={24} className="color-primary" />
                  <h2>Pricing & Inventory</h2>
                </div>

                <div className="p-grid-2">
                  <div className="field-group">
                    <label className="p-label">Selling Price <span className="req">*</span></label>
                    <div className="p-icon-input">
                      <IndianRupee size={18} />
                      <input type="number" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="p-label">Stock Quantity <span className="req">*</span></label>
                    <div className="p-icon-input">
                      <Box size={18} />
                      <input type="number" placeholder="1" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: SHIPPING */}
            {step === 4 && (
              <div className="step-content animate-slide-up">
                <div className="content-header">
                  <Truck size={24} className="color-primary" />
                  <h2>Logistics</h2>
                </div>

                <div className="field-group">
                  <label className="p-label">Pickup Location PIN Code <span className="req">*</span></label>
                  <div className="p-icon-input">
                    <MapPin size={18} />
                    <input type="number" placeholder="6-digit PIN" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW */}
            {step === 5 && (
              <div className="step-content animate-slide-up">
                <div className="content-header">
                  <ShieldCheck size={24} className="color-primary" />
                  <h2>Final Review</h2>
                </div>

                <div className="p-review-summary glass">
                  <div className="summary-item">
                    <span>Title:</span>
                    <strong>{formData.title}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Category:</span>
                    <strong>{formData.category}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Price:</span>
                    <strong className="color-primary">₹{formData.price}</strong>
                  </div>
                </div>

                <div className="p-compliance mt-xl">
                  <label className="p-checkbox">
                    <input type="checkbox" checked={formData.confirmedAccuracy} onChange={e => setFormData({...formData, confirmedAccuracy: e.target.checked})} />
                    <span>I confirm the product details are accurate.</span>
                  </label>
                  <label className="p-checkbox">
                    <input type="checkbox" checked={formData.agreedTerms} onChange={e => setFormData({...formData, agreedTerms: e.target.checked})} />
                    <span>I agree to the Seller Terms of Service.</span>
                  </label>
                </div>
              </div>
            )}

            {/* NAVIGATION ACTIONS */}
            <div className="listing-actions">
              {step > 1 && (
                <button className="btn btn-outline" onClick={() => setStep(step - 1)}>
                  <ChevronLeft size={20} /> Back
                </button>
              )}
              
              <div className="ml-auto flex gap-3">
                <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
                  Save Draft
                </button>
                
                {step < 5 ? (
                  <button className="btn btn-primary" onClick={() => {
                    const error = validateStep(step);
                    if (error) {
                      toast.error(error);
                      return;
                    }
                    setStep(step + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}>
                    Next Step <ChevronRight size={20} />
                  </button>
                ) : (
                  <button 
                    className={`btn btn-primary publish-btn ${isPublishing ? 'loading' : ''}`}
                    onClick={handlePublish}
                    disabled={isPublishing}
                  >
                    {isPublishing ? 'Publishing...' : 'Publish Listing'}
                    {!isPublishing && <ArrowRight size={20} />}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
