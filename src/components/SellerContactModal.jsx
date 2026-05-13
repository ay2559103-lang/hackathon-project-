import { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageCircle, 
  MessageSquare, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SellerContactModal.css';

export default function SellerContactModal({ seller, isOpen, onClose }) {
  const navigate = useNavigate();
  const [loadingAction, setLoadingAction] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Anti-spam state
  const [lastContacted, setLastContacted] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLoadingAction(null);
      setSuccessMsg('');
      setErrorMsg('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !seller) return null;

  const handleAction = async (actionType) => {
    // Spam prevention: Check if user tried to contact within the last 5 seconds
    const now = Date.now();
    if (lastContacted && (now - lastContacted < 5000)) {
      setErrorMsg('Please wait a moment before trying again to prevent spam.');
      return;
    }
    
    setLoadingAction(actionType);
    setErrorMsg('');
    setLastContacted(now);

    try {
      // Simulate network verification or logging for security
      await new Promise(resolve => setTimeout(resolve, 800));

      if (actionType === 'call') {
        if (!seller.phone) throw new Error("Seller phone number not available.");
        window.location.href = `tel:${seller.phone}`;
        setSuccessMsg('Opening phone dialer...');
      } 
      else if (actionType === 'whatsapp') {
        if (!seller.phone) throw new Error("Seller phone number not available.");
        const message = encodeURIComponent(`Hi ${seller.name}, I'm interested in your products on LocalSell.`);
        window.open(`https://wa.me/${seller.phone}?text=${message}`, '_blank');
        setSuccessMsg('Redirecting to WhatsApp...');
      }
      else if (actionType === 'chat') {
        setSuccessMsg('Opening secure chat...');
        setTimeout(() => {
          navigate('/chat', { state: { targetSeller: seller } });
          onClose();
        }, 500);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Action failed. Please try again later.');
    } finally {
      setLoadingAction(null);
      // Clear success message after a delay if not navigating away
      if (actionType !== 'chat') {
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    }
  };

  return (
    <div className="scm-overlay">
      <div className="scm-modal animate-scale-up">
        <button className="scm-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Header: Seller Details */}
        <div className="scm-header">
          <div className="scm-avatar-wrapper">
            <div className="scm-avatar" style={{ background: seller.color || 'var(--gradient-primary)' }}>
              {seller.initials || seller.name?.substring(0, 2).toUpperCase() || 'S'}
            </div>
            {seller.isOnline ? (
              <div className="scm-status-badge online" title="Online now" />
            ) : (
              <div className="scm-status-badge offline" title="Offline" />
            )}
          </div>
          
          <div className="scm-seller-info">
            <h3 className="scm-name">
              {seller.name}
              {seller.verified && <ShieldCheck size={16} className="scm-verified-icon" />}
            </h3>
            <div className="scm-meta">
              <span>{seller.rating ? `${seller.rating}★ Rating` : 'New Seller'}</span>
              <span className="scm-dot">•</span>
              <span className="scm-status-text">
                {seller.isOnline ? 'Active Now' : `Last active ${seller.lastActive || '2h ago'}`}
              </span>
            </div>
          </div>
        </div>

        {/* Security / Trust Notice */}
        <div className="scm-trust-banner">
          <ShieldCheck size={16} />
          <p>For your safety, never share passwords or bank OTPs with sellers.</p>
        </div>

        {/* Action Buttons */}
        <div className="scm-actions">
          <button 
            className={`scm-btn scm-btn-call ${loadingAction === 'call' ? 'loading' : ''}`}
            onClick={() => handleAction('call')}
            disabled={loadingAction !== null}
          >
            {loadingAction === 'call' ? (
              <div className="scm-spinner" />
            ) : (
              <Phone size={18} />
            )}
            <span>Call Seller</span>
          </button>

          <button 
            className={`scm-btn scm-btn-whatsapp ${loadingAction === 'whatsapp' ? 'loading' : ''}`}
            onClick={() => handleAction('whatsapp')}
            disabled={loadingAction !== null}
          >
            {loadingAction === 'whatsapp' ? (
              <div className="scm-spinner" />
            ) : (
              <MessageCircle size={18} />
            )}
            <span>WhatsApp</span>
          </button>

          <button 
            className={`scm-btn scm-btn-chat ${loadingAction === 'chat' ? 'loading' : ''}`}
            onClick={() => handleAction('chat')}
            disabled={loadingAction !== null}
          >
            {loadingAction === 'chat' ? (
              <div className="scm-spinner" />
            ) : (
              <MessageSquare size={18} />
            )}
            <span>Secure Chat</span>
          </button>
        </div>

        {/* Feedback Messages */}
        <div className="scm-feedback-container">
          {successMsg && (
            <div className="scm-feedback scm-success animate-fade-in">
              <CheckCircle2 size={16} />
              <p>{successMsg}</p>
            </div>
          )}
          {errorMsg && (
            <div className="scm-feedback scm-error animate-fade-in">
              <AlertCircle size={16} />
              <p>{errorMsg}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
