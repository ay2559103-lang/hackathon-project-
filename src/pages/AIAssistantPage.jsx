import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, Bot, User, Lightbulb, TrendingUp,
  Tag, FileText, Camera, RefreshCw, Copy, Check,
  Target, Globe, ChevronRight, MessageSquare, Mic, 
  Search, Settings, ArrowUpRight, BarChart3, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './AIAssistantPage.css';

const suggestedPrompts = [
  { icon: '💰', text: 'Suggest best price for organic tomatoes', category: 'pricing' },
  { icon: '✍️', text: 'Write a catchy title & description for my pottery', category: 'listing' },
  { icon: '📈', text: 'Analyze my sales and suggest improvements', category: 'analytics' },
  { icon: '💬', text: 'Suggest a smart reply for a complaining customer', category: 'reply' },
  { icon: '📊', text: 'What are the current market trends in my area?', category: 'trends' },
  { icon: '⭐', text: 'Summarize my recent customer reviews', category: 'reviews' },
];

const initialMessages = [
  {
    id: 1,
    role: 'assistant',
    content: 'Namaste! 🙏 I\'m your AI Selling Assistant. I can help you with product titles, descriptions, pricing, analytics, and customer replies. How can I boost your sales today?',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [language, setLanguage] = useState('English');
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (text) => {
    const userMsg = text || input;
    if (!userMsg.trim()) return;

    const newUserMsg = {
      id: messages.length + 1,
      role: 'user',
      content: userMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = generateAIResponse(userMsg, language);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant',
        content: aiResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      setIsTyping(false);
    }, 1500);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleListen = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        setInput("Suggest a smart reply for a complaining customer");
      }, 3000); // Simulate listening
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ai-page">
      <div className="container ai-container">
        {/* Sidebar */}
        <aside className="ai-sidebar glass">
          <div className="sidebar-header">
            <div className="ai-status">
              <div className="status-dot pulsing"></div>
              <span>AI System Online</span>
            </div>
            <div className="language-selector">
              <Globe size={16} className="text-slate-400" />
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-xs text-slate-300 outline-none"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Hinglish">Hinglish</option>
                <option value="Tamil">Tamil</option>
              </select>
            </div>
          </div>

          <div className="ai-search-box">
            <Search size={16} className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Search chat history..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <nav className="ai-nav">
            <div className="nav-group">
              <h4 className="nav-title">Smart Tools</h4>
              <button className="nav-item active">
                <MessageSquare size={18} /><span>Chat Assistant</span>
              </button>
              <button className="nav-item">
                <Tag size={18} /><span>Price Optimizer</span>
              </button>
              <button className="nav-item">
                <FileText size={18} /><span>Listing Wizard</span>
              </button>
            </div>

            <div className="nav-group">
              <h4 className="nav-title">Market & Analytics</h4>
              <button className="nav-item">
                <BarChart3 size={18} /><span>Sales Analytics</span>
              </button>
              <button className="nav-item">
                <TrendingUp size={18} /><span>Market Trends</span>
              </button>
              <button className="nav-item">
                <AlertCircle size={18} /><span>Inventory Alerts</span>
              </button>
            </div>
          </nav>

          <div className="sidebar-footer glass">
            <div className="footer-tip">
              <div className="tip-header">
                <Lightbulb size={16} className="color-warning" />
                <span>Pro Tip</span>
              </div>
              <p>Ask me to generate SEO keywords for your products to boost visibility!</p>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="ai-main-chat">
          <div className="chat-messages">
            <AnimatePresence>
              {filteredMessages.map(msg => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`message-wrapper ${msg.role}`}
                >
                  <div className="message-avatar">
                    {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                  </div>
                  <div className="message-content">
                    <div className="message-bubble glass">
                      <div className="message-text" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}></div>
                      {msg.role === 'assistant' && (
                        <div className="message-actions">
                          <button 
                            className="msg-action-btn"
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                          >
                            {copiedId === msg.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          </button>
                          <button className="msg-action-btn" onClick={() => sendMessage(messages[messages.length-2]?.content)}>
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="message-time">{msg.time}</span>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="message-wrapper assistant"
                >
                  <div className="message-avatar"><Bot size={20} /></div>
                  <div className="message-bubble glass typing">
                    <span></span><span></span><span></span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && !searchQuery && (
            <div className="prompt-suggestions">
              <h4 className="suggestions-title">Quick Actions</h4>
              <div className="suggestions-grid">
                {suggestedPrompts.map((prompt, i) => (
                  <motion.button 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="suggestion-card glass"
                    onClick={() => sendMessage(prompt.text)}
                  >
                    <span className="suggestion-icon">{prompt.icon}</span>
                    <span className="suggestion-text">{prompt.text}</span>
                    <ChevronRight size={14} className="suggestion-arrow" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <div className="ai-input-section glass">
            <div className={`input-container ${isListening ? 'listening' : ''}`}>
              <button className="input-tool-btn" title="Upload Image">
                <Camera size={20} />
              </button>
              <button 
                className={`input-tool-btn ${isListening ? 'text-red-400 animate-pulse' : ''}`} 
                onClick={toggleListen}
                title="Voice Input"
              >
                <Mic size={20} />
              </button>
              <textarea
                className="ai-chat-input"
                placeholder={isListening ? "Listening..." : "Ask your AI Selling Assistant anything..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                rows="1"
              ></textarea>
              <button 
                className={`send-btn ${input.trim() ? 'active' : ''}`}
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
              >
                <Send size={20} />
              </button>
            </div>
            <p className="ai-disclaimer">AI suggestions are generated based on your shop data and market trends.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

function generateAIResponse(question, lang) {
  const q = question.toLowerCase();
  
  const prefix = lang === 'Hindi' ? 'नमस्ते! ' : lang === 'Hinglish' ? 'Hello ji! ' : '';

  // 1. Pricing Suggestions
  if (q.includes('price') || q.includes('pricing')) {
    return `${prefix}💰 **Pricing Analysis:**\n\nBased on current local market trends in your area:\n\n• **Organic Tomatoes**: ₹65-75/kg (avg: ₹70/kg)\n• Your current price: ₹60/kg (**15% below** average)\n• **Recommendation**: Increase to ₹70/kg to improve margins without losing competitiveness.\n\n📊 *Products priced accurately get 28% more conversions.*`;
  }

  // 2. Title & Description & SEO
  if (q.includes('title') || q.includes('description') || q.includes('pottery') || q.includes('listing')) {
    return `${prefix}✍️ **Optimized Listing Generated:**\n\n**Title**: Handcrafted Ceramic Mandala Mug Set - Premium Quality\n\n**Description**:\n"Elevate your morning coffee with our beautiful hand-painted ceramic mugs featuring traditional Indian mandala designs. Each piece is unique, wheel-thrown, and finished with food-safe glazing. Perfect for gifting or adding an artistic touch to your kitchen."\n\n**SEO Keywords**: handmade pottery, ceramic mug, mandala design, handcrafted gifts, artisan coffee cup.`;
  }

  // 3. Analytics & Best Selling
  if (q.includes('analytics') || q.includes('sales') || q.includes('best')) {
    return `${prefix}📊 **Sales Analytics Insights:**\n\n• **Top Seller**: "Handpainted Ceramic Mug Set" (45 units sold this week, +12% growth)\n• **Low Performer**: "Basic Terracotta Planters" (-5% views).\n• **Insight**: Your engagement peaks on Saturdays between 4 PM - 7 PM.\n• **Action Plan**: Schedule new product drops on Saturday evenings to maximize visibility.`;
  }

  // 4. Smart Replies
  if (q.includes('reply') || q.includes('customer') || q.includes('complaining')) {
    return `${prefix}💬 **Smart Reply Suggestion:**\n\nHere are 2 professional responses for a delayed order:\n\n**Option 1 (Empathetic):**\n"Hi [Name], I sincerely apologize for the delay with your order. It's currently out for delivery and should reach you by [Time]. Thank you for your patience! 🙏"\n\n**Option 2 (Direct & Reassuring):**\n"Hello! We're sorry for the slight hold-up. Your package is safe and on its way. Please track it here: [Link]. Let us know if you need anything else."`;
  }

  // 5. Market Trends & Improvement
  if (q.includes('trend') || q.includes('market') || q.includes('improve')) {
    return `${prefix}📈 **Market Trends & Recommendations:**\n\n• **Trending Search**: "Organic Skincare" is up by 300% in your locality.\n• **Product Improvement**: Customers frequently ask if your packaging is eco-friendly. Consider highlighting "100% Recyclable Packaging" in your descriptions.\n• **Bundle Suggestion**: Pairing your "Fresh Tomatoes" with "Organic Onions" as a "Salad Combo" could increase your Average Order Value by ₹80.`;
  }

  // 6. Review Summarization
  if (q.includes('review') || q.includes('summarize') || q.includes('feedback')) {
    return `${prefix}⭐ **Customer Review Summary (Last 30 Days):**\n\n**Overall Sentiment**: Very Positive (4.8/5 avg)\n\n**What they love ❤️:**\n- Exceptional freshness of produce (mentioned 15 times)\n- Quick delivery times (mentioned 12 times)\n\n**Areas to improve 🔧:**\n- Packaging for fragile items (2 customers reported minor damage)\n- Clearer size dimensions for pottery.`;
  }

  // 7. Inventory Alerts
  if (q.includes('inventory') || q.includes('stock') || q.includes('alert')) {
    return `${prefix}⚠️ **Inventory Alerts:**\n\n- **Low Stock**: "Artisan Sourdough Bread" (Only 2 left!)\n- **Out of Stock**: "Fresh Green Spinach Bundle"\n\n*Would you like me to auto-hide the out-of-stock items from your storefront?*`;
  }

  return `${prefix}🤖 **I'm your AI Selling Assistant!**\n\nI can help you with:\n- **Listing Generation** (Titles, Descriptions, SEO tags)\n- **Pricing Strategies** (Market-based suggestions)\n- **Sales Analytics** (Insights and trends)\n- **Customer Service** (Smart replies & review summaries)\n- **Inventory** (Stock alerts)\n\nJust ask me anything!`;
}
