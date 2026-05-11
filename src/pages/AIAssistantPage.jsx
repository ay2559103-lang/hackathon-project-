import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, Bot, User, Lightbulb, TrendingUp,
  Tag, FileText, Camera, RefreshCw, Copy, Check,
  Wand2, Target, Globe, ChevronRight, MessageSquare
} from 'lucide-react';
import './AIAssistantPage.css';

const suggestedPrompts = [
  { icon: '💰', text: 'Suggest best price for organic tomatoes', category: 'pricing' },
  { icon: '✍️', text: 'Write a catchy description for hand-made pottery', category: 'caption' },
  { icon: '📈', text: 'What selling strategy works best for weekends?', category: 'strategy' },
  { icon: '🏷️', text: 'Generate tags for my fresh vegetable listing', category: 'tags' },
];

const initialMessages = [
  {
    id: 1,
    role: 'assistant',
    content: 'Namaste! 🙏 I\'m your AI Selling Assistant. I can help you with pricing, product descriptions, selling strategies, and market insights. How can I help you today?',
    time: 'Now',
  },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
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
      const aiResponse = generateAIResponse(userMsg);
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

  return (
    <div className="ai-page">
      <div className="container ai-container">
        <aside className="ai-sidebar glass">
          <div className="sidebar-header">
            <div className="ai-status">
              <div className="status-dot pulsing"></div>
              <span>AI System Online</span>
            </div>
          </div>

          <nav className="ai-nav">
            <div className="nav-group">
              <h4 className="nav-title">Smart Tools</h4>
              <button className="nav-item active">
                <MessageSquare size={18} />
                <span>Chat Assistant</span>
              </button>
              <button className="nav-item">
                <Tag size={18} />
                <span>Price Optimizer</span>
              </button>
              <button className="nav-item">
                <FileText size={18} />
                <span>Listing Wizard</span>
              </button>
            </div>

            <div className="nav-group">
              <h4 className="nav-title">Market Analysis</h4>
              <button className="nav-item">
                <TrendingUp size={18} />
                <span>Trending Now</span>
              </button>
              <button className="nav-item">
                <Target size={18} />
                <span>Local Insights</span>
              </button>
            </div>
          </nav>

          <div className="sidebar-footer glass">
            <div className="footer-tip">
              <div className="tip-header">
                <Lightbulb size={16} className="color-warning" />
                <span>Pro Tip</span>
              </div>
              <p>Upload a product photo and I'll analyze it for you instantly!</p>
            </div>
          </div>
        </aside>

        <main className="ai-main-chat">
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message-wrapper ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className="message-content">
                  <div className="message-bubble glass">
                    <div className="message-text" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}></div>
                    {msg.role === 'assistant' && msg.id > 1 && (
                      <div className="message-actions">
                        <button 
                          className="msg-action-btn"
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                        >
                          {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button className="msg-action-btn">
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="message-time">{msg.time}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message-wrapper assistant">
                <div className="message-avatar"><Bot size={20} /></div>
                <div className="message-bubble glass typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="prompt-suggestions">
              <h4 className="suggestions-title">Quick Actions</h4>
              <div className="suggestions-grid">
                {suggestedPrompts.map((prompt, i) => (
                  <button 
                    key={i} 
                    className="suggestion-card glass"
                    onClick={() => sendMessage(prompt.text)}
                  >
                    <span className="suggestion-icon">{prompt.icon}</span>
                    <span className="suggestion-text">{prompt.text}</span>
                    <ChevronRight size={14} className="suggestion-arrow" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ai-input-section glass">
            <div className="input-container">
              <button className="input-tool-btn">
                <Camera size={20} />
              </button>
              <textarea
                className="ai-chat-input"
                placeholder="Ask your AI Selling Assistant anything..."
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
            <p className="ai-disclaimer">LocalSell AI may provide inaccurate info. Double-check all pricing & strategy.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

function generateAIResponse(question) {
  const q = question.toLowerCase();

  if (q.includes('price') || q.includes('pricing')) {
    return '💰 **Pricing Analysis:**\n\nBased on your area (Noida, Sector 62) and current market trends:\n\n• **Organic Tomatoes**: ₹65-75/kg (current avg: ₹70/kg)\n• Your current price of ₹60/kg is **15% below** market average\n• **Recommendation**: Increase to ₹70/kg for optimal margins\n\n📊 Products in this range get **28% more conversions** than lower-priced alternatives.';
  }

  if (q.includes('description') || q.includes('pottery') || q.includes('caption')) {
    return '✍️ **AI-Generated Descriptions:**\n\n**Option 1** (Professional):\n"Handcrafted ceramic pottery with traditional Indian designs. Each piece is wheel-thrown and hand-painted. Food-safe glazing. Perfect as gifts or home décor."\n\n**Option 2** (Social Media):\n"✨ From our hands to your home! Beautiful handmade pottery with desi vibes 🏺 Each piece tells a story. Shop local, support artisans! 💛"';
  }

  if (q.includes('strategy') || q.includes('selling') || q.includes('weekend')) {
    return '📈 **Weekend Selling Strategy:**\n\n1. **Post between 8-10 AM Saturday** – 45% higher engagement\n2. **Offer weekend bundles** – "Buy 3, Get 1 Free" increases avg order by 35%\n3. **Use community feed** – Saturday posts get 2x more shares';
  }

  return '🤖 **Great question!**\n\nI can help you with:\n\n• **Product pricing** – Market-based price suggestions\n• **AI descriptions** – Auto-generate titles & descriptions\n• **Selling tips** – Strategies for your area\n• **Translations** – Hindi, English, Hinglish\n\nTry being more specific, like "What price should I set for homemade pickles?"';
}
