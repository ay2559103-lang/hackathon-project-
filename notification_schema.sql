-- ==========================================
-- Scalable Real-Time Notification Architecture
-- ==========================================

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('order', 'message', 'seller', 'delivery', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- Optional URL to redirect when clicked
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store extra payload data like order_id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Notification Logs (For tracking delivery and push status)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
    delivery_status VARCHAR(50) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
    push_provider VARCHAR(50), -- e.g., 'fcm', 'apns'
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance (crucial for real-time and scaling)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(delivery_status);

-- 3. Auto-update Timestamp Trigger
CREATE OR REPLACE FUNCTION update_notification_logs_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_notification_logs_modtime ON public.notification_logs;
CREATE TRIGGER update_notification_logs_modtime
BEFORE UPDATE ON public.notification_logs
FOR EACH ROW EXECUTE PROCEDURE update_notification_logs_modtime();

-- 4. Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Prevent users from deleting their own notifications directly if you want auditability, 
-- but we'll allow it for cleanups.
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- (Logs are internal, so no public policies usually needed, but admins can read)

-- 5. Realtime Publication Setup
-- Enable Supabase Realtime for the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
