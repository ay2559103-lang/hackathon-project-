// src/services/aiChatbotService.js
// Note: In a production app, the actual AI generation should happen securely on the backend (e.g. Edge Functions)
// For this frontend implementation, we simulate an AI processing logic and backend architecture.

import { askBot } from './aiService';

export const processUserMessage = async (message, session) => {
  try {
    const responseContent = await askBot(message);
    
    return {
      sender: 'ai',
      content: responseContent,
      intent: 'openai_response',
      metadata: { processed_at: new Date().toISOString() },
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
  } catch (error) {
    console.error("Chatbot processing error:", error);
    return {
      sender: 'ai',
      content: "I'm having a bit of trouble thinking right now. Could you try saying that again?",
      intent: 'error',
      metadata: { error: error.message },
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
  }
};

export const logChatSession = async (supabase, userId) => {
  if (!supabase) return { id: crypto.randomUUID() };
  
  try {
    const { data, error } = await supabase
      .from('chatbot_sessions')
      .insert([{ 
        user_id: userId || null, 
        platform_info: { userAgent: navigator.userAgent } 
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Failed to log session:", err);
    return { id: crypto.randomUUID() }; // Fallback for UI if DB fails
  }
};

export const saveChatMessage = async (supabase, messageData) => {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('chatbot_messages')
      .insert([messageData]);
    if (error) throw error;
  } catch (err) {
    console.error("Failed to save message:", err);
    // Graceful error handling: we don't crash the UI if logging fails
  }
};
