import { useCart } from '../context/CartContext';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

export default function CartPage() {
  const { cartItems, addToCart, cartCount, refreshCart } = useCart();
  const navigate = useNavigate();

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.product?.price || 0;
    return acc + (price * (item.quantity || 1));
  }, 0);

  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping;

  const handleUpdateQuantity = async (productId, newQty) => {
    if (newQty < 1) return;
    await addToCart(productId, newQty);
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page empty">
        <div className="container">
          <div className="empty-cart-card glass">
            <div className="empty-icon">
              <ShoppingBag size={64} />
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <button className="btn btn-primary" onClick={() => navigate('/feed')}>
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title">Shopping Cart ({cartCount})</h1>
        
        <div className="cart-grid">
          <div className="cart-items-section">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item-card glass">
                <div className="item-image">
                  <img src={item.product?.image_url || item.product?.image} alt={item.product?.title} />
                </div>
                <div className="item-details">
                  <div className="item-header">
                    <h3>{item.product?.title}</h3>
                    <button className="remove-btn" title="Remove Item">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="item-meta">
                    <Store size={14} />
                    <span>{item.product?.seller_name || 'Local Seller'}</span>
                  </div>
                  <div className="item-footer">
                    <div className="qty-controls">
                      <button 
                        className="qty-btn" 
                        onClick={() => handleUpdateQuantity(item.product_id, (item.quantity || 1) - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="qty-val">{item.quantity || 1}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => handleUpdateQuantity(item.product_id, (item.quantity || 1) + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="item-price">
                      <span>₹{(item.product?.price || 0) * (item.quantity || 1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary-section">
            <div className="summary-card glass">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
              <button className="btn btn-primary btn-full checkout-btn">
                Proceed to Checkout
                <ArrowRight size={18} />
              </button>
              <p className="secure-text">Secure Checkout Powered by LocalSell</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
