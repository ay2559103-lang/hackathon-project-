import { useState } from 'react';
import {
  Upload, Sparkles, Camera, Tag, IndianRupee,
  FileText, MapPin, Package, Check, Loader, X,
  Image as ImageIcon, Plus, Wand2, ChevronRight, ChevronLeft,
  TrendingUp, Zap, Info
} from 'lucide-react';
import { categories } from '../data/mockData';
import './AddProductPage.css';

export default function AddProductPage() {
  const [step, setStep] = useState(1);
  const [imagePreview, setImagePreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    unit: 'piece',
    location: 'Sector 62, Noida',
    tags: [],
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateWithAI = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setFormData({
        ...formData,
        title: 'Premium Hand-Crafted Ceramic Planter',
        description: 'Elevate your space with this stunning, hand-thrown ceramic planter. Featuring a unique minimalist design with a textured matte finish. Perfect for indoor succulents and tropical plants. Each piece is unique and crafted with care by local artisans.',
        price: '899',
        originalPrice: '1299',
        category: 'Handmade Crafts',
        tags: ['artisanal', 'minimalist', 'home-decor', 'ceramic'],
      });
      setIsGenerating(false);
      setAiGenerated(true);
      setStep(2);
    }, 2500);
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, e.target.value.trim()],
      });
      e.target.value = '';
    }
  };

  const removeTag = (index) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const steps = [
    { number: 1, label: 'Upload' },
    { number: 2, label: 'Details' },
    { number: 3, label: 'Publish' }
  ];

  return (
    <div className="add-product-page">
      <div className="container narrow">
        <header className="add-header-premium">
          <h1 className="add-title-premium">List New <span className="gradient-text">Product</span></h1>
          <p className="add-subtitle-premium">Reach thousands of neighbors in minutes.</p>
        </header>

        {/* Premium Progress Stepper */}
        <div className="add-stepper-premium glass">
          {steps.map((s, i) => (
            <div key={i} className={`stepper-item-premium ${step >= s.number ? 'active' : ''} ${step > s.number ? 'completed' : ''}`}>
              <div className="stepper-circle-premium">
                {step > s.number ? <Check size={16} /> : s.number}
              </div>
              <span className="stepper-label-premium">{s.label}</span>
              {i < steps.length - 1 && <div className="stepper-line-premium"></div>}
            </div>
          ))}
        </div>

        <div className="add-content-area-premium">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="step-content upload-step-premium animate-fade-in">
              <div 
                className={`drop-zone-premium glass ${imagePreview ? 'has-image' : ''}`}
                onClick={() => document.getElementById('product-img').click()}
              >
                {imagePreview ? (
                  <div className="preview-container-premium">
                    <img src={imagePreview} alt="Product" className="img-preview-premium" />
                    <button className="remove-img-btn blur" onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}>
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="upload-prompt-premium">
                    <div className="upload-icon-circle pulsing-glow">
                      <Camera size={36} />
                    </div>
                    <h3>Upload Product Image</h3>
                    <p>Visuals are the key to trust. Show your best work.</p>
                    <span className="upload-limit-text">PNG, JPG or WebP (Max 10MB)</span>
                  </div>
                )}
                <input type="file" id="product-img" hidden onChange={handleImageUpload} accept="image/*" />
              </div>

              <div className="ai-onboarding-box glass">
                <div className="ai-onboarding-header">
                  <div className="ai-spark-icon"><Sparkles size={18} /></div>
                  <div className="ai-onboarding-text">
                    <h4>AI Listing Assistant</h4>
                    <p>Let our AI write the perfect title, description, and tags for you.</p>
                  </div>
                </div>
                <button 
                  className={`btn btn-primary btn-xl ai-magic-btn ${isGenerating ? 'is-loading' : ''}`}
                  onClick={generateWithAI}
                  disabled={!imagePreview || isGenerating}
                >
                  {isGenerating ? (
                    <><Loader size={20} className="spin-slow" /> Analyzing Image...</>
                  ) : (
                    <><Sparkles size={20} /> Magic Listing</>
                  )}
                </button>
                <div className="manual-skip">
                  <span>or</span>
                  <button className="btn-link" onClick={() => setStep(2)}>Fill Details Manually</button>
                </div>
              </div>

              <div className="benefits-grid">
                <div className="benefit-card-sm glass">
                  <Zap size={18} className="color-primary" />
                  <span>3x Faster Listing</span>
                </div>
                <div className="benefit-card-sm glass">
                  <TrendingUp size={18} className="color-secondary" />
                  <span>Price Optimization</span>
                </div>
                <div className="benefit-card-sm glass">
                  <ShieldCheck size={18} className="color-accent" />
                  <span>Smart Tagging</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="step-content details-step-premium animate-fade-in">
              <div className="form-layout-premium">
                <div className="form-fields-container glass-card">
                  <div className="field-group">
                    <label className="field-label">
                      Product Name
                      {aiGenerated && <div className="ai-badge-xs"><Sparkles size={10} /> AI</div>}
                    </label>
                    <input 
                      type="text" 
                      className="premium-input" 
                      placeholder="e.g. Handmade Ceramic Vase"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">Description</label>
                    <textarea 
                      className="premium-input" 
                      rows="5"
                      placeholder="Describe the unique features, materials, and story..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="field-row-premium">
                    <div className="field-group">
                      <label className="field-label">Price</label>
                      <div className="premium-icon-input">
                        <IndianRupee size={16} />
                        <input 
                          type="number" 
                          placeholder="0.00"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="field-group">
                      <label className="field-label">Category</label>
                      <select 
                        className="premium-input"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Search Tags</label>
                    <div className="premium-tags-box">
                      {formData.tags.map((t, i) => (
                        <div key={i} className="tag-chip-premium">
                          {t} <button onClick={() => removeTag(i)}><X size={12} /></button>
                        </div>
                      ))}
                      <input 
                        type="text" 
                        placeholder="Type and press Enter" 
                        onKeyDown={addTag}
                      />
                    </div>
                  </div>
                </div>

                <aside className="preview-sidebar-premium">
                  <div className="preview-sticky-box">
                    <h4 className="preview-title-sm"><ImageIcon size={16} /> Live Preview</h4>
                    <div className="preview-card-premium glass-card">
                      <div className="preview-img-wrapper">
                        {imagePreview ? <img src={imagePreview} /> : <div className="placeholder-box"><Camera size={32} /></div>}
                      </div>
                      <div className="preview-details-box">
                        <div className="preview-header">
                          <h3 className="p-title-preview">{formData.title || 'Product Title'}</h3>
                          <span className="p-price-preview">₹{formData.price || '0'}</span>
                        </div>
                        <p className="p-desc-preview">{formData.description || 'Fill details to see the preview...'}</p>
                        <div className="preview-footer-mock">
                          <div className="mock-seller">
                            <div className="mock-avatar"></div>
                            <span>Your Store</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="preview-tip">
                      <Info size={14} />
                      <p>Listings with descriptions over 100 words sell 40% better.</p>
                    </div>
                  </div>
                </aside>
              </div>

              <div className="onboarding-actions">
                <button className="btn btn-ghost" onClick={() => setStep(1)}><ChevronLeft size={18} /> Back</button>
                <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>Finalize Listing <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="step-content success-step-premium animate-fade-in">
              <div className="success-card-premium glass">
                <div className="confetti-mock">
                  <Zap size={48} className="zap-success" />
                </div>
                <div className="success-icon-premium">
                  <Check size={48} />
                </div>
                <h2>Ready for Launch!</h2>
                <p>Your product has been optimized and is ready to reach your neighborhood.</p>

                <div className="final-review-grid glass">
                  <div className="review-stat">
                    <span className="stat-label">Visibility</span>
                    <span className="stat-val-premium"><Zap size={14} /> Hyperlocal</span>
                  </div>
                  <div className="review-stat">
                    <span className="stat-label">Reach</span>
                    <span className="stat-val-premium">~2.5k Neighbors</span>
                  </div>
                  <div className="review-stat">
                    <span className="stat-label">AI Score</span>
                    <span className="stat-val-premium color-primary">9.8/10</span>
                  </div>
                </div>

                <div className="launch-actions">
                  <button className="btn btn-primary btn-xl btn-full" onClick={() => alert('Product Published! 🎉')}>
                    Publish Now
                  </button>
                  <button className="btn btn-ghost btn-lg btn-full" onClick={() => setStep(2)}>
                    One Last Edit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShieldCheck({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <path d="M9 12l2 2 4-4"></path>
    </svg>
  );
}
