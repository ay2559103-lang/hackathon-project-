import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle, Send, Search, Phone, Video,
  MoreVertical, Smile, Paperclip, Image, MapPin,
  Users, Check, CheckCheck, ChevronLeft, Sparkles,
  Info, ShieldCheck
} from 'lucide-react';
import { chatMessages as initialMessages, chatContacts } from '../data/mockData';
import './ChatPage.css';

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState(chatContacts[0]);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: messages.length + 1,
      senderId: 'me',
      senderName: 'You',
      message: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-page">
      <div className="container chat-wrapper-main">
        <div className="chat-layout glass-card">
          {/* Contacts Sidebar */}
          <aside className={`chat-sidebar ${!isSidebarOpen ? 'mobile-hidden' : ''}`}>
            <div className="sidebar-header-premium">
              <div className="sidebar-header-top">
                <h2 className="sidebar-title">Chats</h2>
                <button className="new-chat-btn"><Plus size={18} /></button>
              </div>
              
              <div className="chat-search-box glass">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="contacts-list-premium custom-scrollbar">
              {chatContacts.map(contact => (
                <div
                  key={contact.id}
                  className={`contact-item-premium ${activeChat.id === contact.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveChat(contact);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                >
                  <div className="contact-avatar-box">
                    <div className="avatar-main" style={{ background: contact.color || 'var(--color-primary)' }}>
                      {contact.initials}
                    </div>
                    {contact.online && <div className="online-indicator"></div>}
                  </div>
                  <div className="contact-info-box">
                    <div className="contact-header-row">
                      <span className="contact-name-text">{contact.name}</span>
                      <span className="last-msg-time">{contact.time}</span>
                    </div>
                    <div className="contact-meta-row">
                      <span className="last-msg-text">{contact.lastMessage}</span>
                      {contact.unread > 0 && <span className="unread-dot">{contact.unread}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Chat Main Window */}
          <main className="chat-main-window">
            {activeChat ? (
              <>
                <header className="chat-window-header glass">
                  <div className="active-user-box">
                    <button className="back-btn-mobile" onClick={() => setIsSidebarOpen(true)}>
                      <ChevronLeft size={24} />
                    </button>
                    <div className="avatar-main sm" style={{ background: activeChat.color }}>
                      {activeChat.initials}
                    </div>
                    <div className="active-user-details">
                      <div className="name-row">
                        <h3 className="active-username">{activeChat.name}</h3>
                        {activeChat.verified && <ShieldCheck size={14} className="color-primary" />}
                      </div>
                      <span className="active-status-text">
                        {activeChat.online ? <span className="online-text">Online</span> : 'Offline'}
                      </span>
                    </div>
                  </div>
                  <div className="window-header-actions">
                    <button className="icon-action-btn glass"><Phone size={20} /></button>
                    <button className="icon-action-btn glass"><Video size={20} /></button>
                    <button className="icon-action-btn glass"><Info size={20} /></button>
                  </div>
                </header>

                <div className="chat-messages-container custom-scrollbar">
                  <div className="chat-date-badge">
                    <span>Today</span>
                  </div>

                  <div className="ai-assistant-banner glass">
                    <div className="ai-icon-box">
                      <Sparkles size={18} />
                    </div>
                    <div className="ai-banner-content">
                      <p><strong>AI Selling Assistant:</strong> Priya is asking about pricing. I suggest offering a 5% discount for 2+ units.</p>
                      <button className="ai-action-link">Apply Suggestion</button>
                    </div>
                  </div>

                  {messages.map(msg => (
                    <div key={msg.id} className={`message-row ${msg.isOwn ? 'own' : 'other'}`}>
                      <div className="message-bubble-premium">
                        <p className="message-text">{msg.message}</p>
                        <div className="message-info-row">
                          <span className="message-time-text">{msg.time}</span>
                          {msg.isOwn && <CheckCheck size={14} className="color-primary" />}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <footer className="chat-input-footer glass">
                  <div className="input-toolbar-row">
                    <button className="toolbar-btn"><Paperclip size={20} /></button>
                    <button className="toolbar-btn"><Image size={20} /></button>
                    <button className="toolbar-btn"><Smile size={20} /></button>
                  </div>
                  <div className="main-input-area">
                    <textarea
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      rows={1}
                    />
                    <button 
                      className={`send-btn-premium ${newMessage.trim() ? 'active' : ''}`}
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </footer>
              </>
            ) : (
              <div className="no-chat-selected">
                <div className="empty-chat-icon">
                  <MessageCircle size={64} />
                </div>
                <h2>Select a chat to start messaging</h2>
                <p>Connect with local buyers and sellers instantly.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function Plus({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
