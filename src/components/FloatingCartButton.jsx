import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './FloatingCartButton.css';

export default function FloatingCartButton() {
  const { cartCount } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isPulsing, setIsPulsing] = useState(false);
  const isSeller = profile?.role === 'seller';
  const isDelivery = profile?.role === 'delivery';

  // Show on customer-facing pages
  const showOnPaths = ['/nearby', '/feed'];
  const shouldShow = showOnPaths.includes(location.pathname);

  useEffect(() => {
    const handlePulse = () => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 600);
    };

    window.addEventListener('cartItemAdded', handlePulse);
    return () => window.removeEventListener('cartItemAdded', handlePulse);
  }, []);

  if (isSeller || isDelivery) return null;
  if (!shouldShow) return null;

  return (
    <div className={`floating-cart-container ${shouldShow ? 'cart-entrance' : 'cart-exit'}`}>
      <button 
        className={`floating-cart-btn ${isPulsing ? 'pulse-anim' : ''}`}
        onClick={() => navigate('/cart')} 
        aria-label="Open Shopping Cart"
      >
        <ShoppingCart size={28} />
        {cartCount > 0 && (
          <span className="badge">{cartCount}</span>
        )}
        <span className="cart-tooltip">View Cart</span>
      </button>
    </div>
  );
}
