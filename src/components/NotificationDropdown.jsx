import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, Package, MessageCircle, Info, CheckCircle, Navigation, X, Store } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import './NotificationDropdown.css';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <Package size={16} className="text-blue-400" />;
      case 'message': return <MessageCircle size={16} className="text-green-400" />;
      case 'delivery': return <Navigation size={16} className="text-yellow-400" />;
      case 'seller': return <Store size={16} className="text-purple-400" />;
      default: return <Info size={16} className="text-gray-400" />;
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    setIsOpen(false);
  };

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      <button 
        className="header-icon-btn notification-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge animate-pop">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown glass-card animate-slide-down">
          <div className="nd-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="nd-mark-all" onClick={markAllAsRead}>
                <CheckCircle size={14} /> Mark all read
              </button>
            )}
          </div>
          
          <div className="nd-body custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="nd-empty">
                <Bell size={32} className="opacity-30 mb-2" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`nd-item ${!notif.is_read ? 'unread' : ''}`}
                >
                  <div className="nd-icon-wrapper">
                    {getIcon(notif.type)}
                  </div>
                  <div className="nd-content">
                    {notif.link ? (
                      <NavLink to={notif.link} className="nd-link" onClick={() => handleNotificationClick(notif)}>
                        <h4>{notif.title}</h4>
                        <p>{notif.message}</p>
                      </NavLink>
                    ) : (
                      <div className="nd-text" onClick={() => handleNotificationClick(notif)}>
                        <h4>{notif.title}</h4>
                        <p>{notif.message}</p>
                      </div>
                    )}
                    <span className="nd-time">{formatTime(notif.created_at)}</span>
                  </div>
                  {!notif.is_read && <div className="nd-unread-dot"></div>}
                </div>
              ))
            )}
          </div>
          
          <div className="nd-footer">
            <NavLink to="/profile" onClick={() => setIsOpen(false)}>
              View all notifications
            </NavLink>
          </div>
        </div>
      )}
    </div>
  );
}
