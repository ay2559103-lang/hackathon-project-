-- =====================================================
-- REAL-TIME MESSAGING SCHEMA
-- =====================================================
-- Supports direct chat between buyers and sellers
-- Features: Conversations, Messages, Read Receipts
-- =====================================================

-- 1. CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure participant_1 is always "lesser" UUID to prevent duplicate conversations
    CONSTRAINT conversation_participants_check CHECK (participant_1 < participant_2),
    UNIQUE(participant_1, participant_2)
);

-- 2. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- For images, product links, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON public.conversations(participant_2);

-- 4. REALTIME ENABLEMENT
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can only see conversations they are part of
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Messages: Users can see messages in their conversations
CREATE POLICY "Users can view messages in own conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in own conversations" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
        )
    );

-- 6. TRIGGERS
-- Automatically update last_message_at in conversation
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_update_conversation_timestamp
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE PROCEDURE public.update_conversation_timestamp();
