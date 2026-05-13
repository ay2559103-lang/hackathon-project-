import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { processUserMessage, logChatSession, saveChatMessage } from '../services/aiChatbotService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase/client';
import './AIChatbot.css';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      content: 'Hello! I am your AI assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [session, setSession] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    // Initialize Session
    const initSession = async () => {
      const newSession = await logChatSession(supabase, user?.id);
      setSession(newSession);
    };
    initSession();
  }, [user]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');
    
    // Add user message to UI
    const userMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      content: userText,
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Save to backend asynchronously (fire and forget)
    saveChatMessage(supabase, {
      session_id: session?.id,
      sender: 'user',
      content: userText
    });

    try {
      // Process with AI Service
      const aiResponse = await processUserMessage(userText, session);
      
      setMessages((prev) => [...prev, aiResponse]);
      
      // Save AI response to backend
      saveChatMessage(supabase, {
        session_id: session?.id,
        sender: 'ai',
        content: aiResponse.content,
        intent: aiResponse.intent,
        metadata: aiResponse.metadata
      });
      
    } catch (error) {
      console.error("Chatbot Error:", error);
      // Fallback response on error
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        sender: 'ai',
        content: 'Sorry, I encountered an error connecting to my servers. Please try again later.',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  return (
    <div className={`ai-chatbot-wrapper ${isOpen ? 'open' : ''}`}>
      {/* Floating Action Button */}
      <button 
        className="ai-chatbot-fab" 
        onClick={toggleChat}
        aria-label="Open AI Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      <div className={`ai-chatbot-window ${isOpen ? 'visible' : 'hidden'}`}>
        {/* Header */}
        <div className="ai-chatbot-header">
          <div className="ai-chatbot-header-info">
            <div className="ai-chatbot-avatar">
              <Bot size={20} />
            </div>
            <div>
              <h3>AI Assistant</h3>
              <span className="ai-chatbot-status">Online</span>
            </div>
          </div>
          <button className="ai-chatbot-close" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Message List */}
        <div className="ai-chatbot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-chatbot-msg-wrapper ${msg.sender}`}>
              {msg.sender === 'ai' && (
                <div className="ai-msg-avatar">
                  <Bot size={16} />
                </div>
              )}
              <div className="ai-chatbot-msg-bubble">
                {msg.content}
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="ai-chatbot-msg-wrapper ai">
              <div className="ai-msg-avatar">
                <Bot size={16} />
              </div>
              <div className="ai-chatbot-msg-bubble typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form className="ai-chatbot-input-area" onSubmit={handleSend}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
          />
          <button 
            type="submit" 
            className="ai-chatbot-send-btn"
            disabled={!input.trim() || isTyping}
          >
            {isTyping ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
