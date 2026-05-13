import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, CreditCard, Smartphone, 
  CheckCircle2, Lock, ChevronRight, MapPin, 
  Zap, Clock, Package, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import './CheckoutPage.css';

const PAYMENT_METHODS = [
  { id: 'upi', name: 'UPI (GPay, PhonePe, Paytm)', icon: <Smartphone size={24} />, description: 'Scan QR or enter UPI ID' },
  { id: 'card', name: 'Credit / Debit Card', icon: <CreditCard size={24} />, description: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', name: 'Net Banking', icon: <Lock size={24} />, description: 'All major Indian banks' },
  { id: 'cod', name: 'Cash on Delivery', icon: <MapPin size={24} />, description: 'Pay when you receive' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get product data from location state or fallback
  const product = location.state?.product || {
    title: 'Organic Avocado (Pack of 2)',
    price: 150,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    quantity: 1
  };

  const shipping = 40;
  const total = product.price * (product.quantity || 1) + shipping;

  const handleProcessPayment = () => {
    setIsProcessing(true);
    
    // Simulate payment gateway processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      toast.success('Payment Successful!');
      
      // Redirect to orders after success
      setTimeout(() => {
        navigate('/orders');
      }, 3000);
    }, 2500);
  };

  return (
    <div className="checkout-page">
      <div className="container">
        <header className="checkout-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1>Secure <span className="gradient-text">Checkout</span></h1>
          <div className="security-badge">
            <ShieldCheck size={16} />
            <span>SSL Secured</span>
          </div>
        </header>

        <div className="checkout-layout">
          <div className="checkout-main">
            {/* Step Indicators */}
            <div className="checkout-steps">
              <div className={`step ${step >= 1 ? 'active' : ''}`}>
                <div className="step-num">{step > 1 ? <CheckCircle2 size={16} /> : '1'}</div>
                <span>Shipping</span>
              </div>
              <div className="step-line"></div>
              <div className={`step ${step >= 2 ? 'active' : ''}`}>
                <div className="step-num">{step > 2 ? <CheckCircle2 size={16} /> : '2'}</div>
                <span>Payment</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="checkout-form-section"
                >
                  <h3>Shipping Address</h3>
                  <div className="address-card selected glass">
                    <div className="address-header">
                      <MapPin size={18} className="color-primary" />
                      <span className="address-type">Home</span>
                      <span className="default-badge">Default</span>
                    </div>
                    <div className="address-content">
                      <strong>Anurag Yadav</strong>
                      <p>Sector 62, Noida, Uttar Pradesh - 201301</p>
                      <p>Phone: +91 98765 43210</p>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-full mt-xl" onClick={() => setStep(2)}>
                    Proceed to Payment <ChevronRight size={18} />
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="checkout-payment-section"
                >
                  <h3>Select Payment Method</h3>
                  <div className="payment-methods-list">
                    {PAYMENT_METHODS.map(method => (
                      <label key={method.id} className={`payment-method-card glass ${paymentMethod === method.id ? 'active' : ''}`}>
                        <input 
                          type="radio" 
                          name="payment" 
                          value={method.id} 
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <div className="method-icon">{method.icon}</div>
                        <div className="method-info">
                          <span className="method-name">{method.name}</span>
                          <span className="method-desc">{method.description}</span>
                        </div>
                        {paymentMethod === method.id && <CheckCircle2 size={20} className="check-icon" />}
                      </label>
                    ))}
                  </div>

                  <div className="upi-apps-row mt-lg">
                    <div className="upi-app glass"><img src="https://img.icons8.com/color/48/google-pay-new.png" alt="GPay" /></div>
                    <div className="upi-app glass"><img src="https://img.icons8.com/color/48/phonepe.png" alt="PhonePe" /></div>
                    <div className="upi-app glass"><img src="https://img.icons8.com/color/48/paytm.png" alt="Paytm" /></div>
                  </div>

                  <button 
                    className={`btn btn-primary btn-full mt-xl ${isProcessing ? 'loading' : ''}`}
                    onClick={handleProcessPayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : `Pay ₹${total.toLocaleString()}`}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside className="checkout-summary">
            <div className="summary-card glass">
              <h3>Order Summary</h3>
              <div className="summary-item product-preview">
                <img src={product.image} alt={product.title} />
                <div className="summary-product-info">
                  <span className="product-name">{product.title}</span>
                  <span className="product-qty">Qty: {product.quantity || 1}</span>
                </div>
                <span className="product-price">₹{product.price}</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{product.price * (product.quantity || 1)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className="color-success">₹{shipping}</span>
              </div>
              <div className="summary-row promo">
                <span>Promo Code</span>
                <button className="btn-text">Apply</button>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row total">
                <span>Total Amount</span>
                <span>₹{total.toLocaleString()}</span>
              </div>

              <div className="delivery-perks">
                <div className="perk">
                  <Zap size={14} className="color-secondary" />
                  <span>Lightning fast local delivery</span>
                </div>
                <div className="perk">
                  <Clock size={14} className="color-primary" />
                  <span>Delivered within 2 hours</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Payment Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="payment-overlay"
          >
            <div className="processing-modal glass">
              <div className="spinner"></div>
              <h2>Processing Payment</h2>
              <p>Please do not refresh the page or close the window.</p>
              <div className="secure-footer">
                <Lock size={14} /> <span>End-to-end encrypted</span>
              </div>
            </div>
          </motion.div>
        )}

        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="payment-overlay"
          >
            <div className="success-modal glass">
              <div className="success-icon">
                <CheckCircle2 size={64} />
              </div>
              <h2>Order Placed!</h2>
              <p>Your payment of ₹{total.toLocaleString()} was successful.</p>
              <p>Redirecting to your orders...</p>
              <button className="btn btn-primary" onClick={() => navigate('/orders')}>
                Go to My Orders
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
