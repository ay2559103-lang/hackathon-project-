-- ==========================================
-- AI Chatbot Analytics & History Schema
-- ==========================================

-- 1. Chatbot Sessions
CREATE TABLE public.chatbot_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null if anonymous
    session_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    platform_info JSONB, -- Browser, OS, Mobile/Desktop
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Chatbot Messages
CREATE TABLE public.chatbot_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.chatbot_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL CHECK (sender IN ('user', 'ai', 'system')),
    content TEXT NOT NULL,
    intent VARCHAR(100), -- E.g., 'product_search', 'order_tracking', 'faq'
    metadata JSONB, -- For product links, order IDs, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Chatbot Feedback
CREATE TABLE public.chatbot_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES public.chatbot_messages(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.chatbot_sessions(id) ON DELETE CASCADE,
    rating SMALLINT CHECK (rating IN (-1, 0, 1)), -- -1: Thumbs Down, 1: Thumbs Up
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Chatbot Logs & Analytics (For debugging & AI training)
CREATE TABLE public.chatbot_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.chatbot_sessions(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- E.g., 'error', 'api_timeout', 'fallback_triggered'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_chatbot_messages_session_id ON public.chatbot_messages(session_id);
CREATE INDEX idx_chatbot_sessions_user_id ON public.chatbot_sessions(user_id);
CREATE INDEX idx_chatbot_messages_created_at ON public.chatbot_messages(created_at);

-- RLS Policies
ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only read their own sessions and messages
CREATE POLICY "Users can read own sessions" ON public.chatbot_sessions
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own sessions" ON public.chatbot_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can read own messages" ON public.chatbot_messages
    FOR SELECT USING (
        session_id IN (SELECT id FROM public.chatbot_sessions WHERE user_id = auth.uid() OR user_id IS NULL)
    );

CREATE POLICY "Users can insert own messages" ON public.chatbot_messages
    FOR INSERT WITH CHECK (
        session_id IN (SELECT id FROM public.chatbot_sessions WHERE user_id = auth.uid() OR user_id IS NULL)
    );
