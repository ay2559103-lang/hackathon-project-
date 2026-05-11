# AI Assistant Backend Architecture

This document outlines the scalable backend architecture for the LocalSell AI Selling Assistant, designed specifically for sellers. The system ensures fast responses, secure access, chat history persistence, and robust rate limiting.

## 1. System Architecture Overview

The backend leverages **Supabase** (PostgreSQL, Edge Functions, Auth) to provide a scalable, serverless architecture.

```mermaid
graph TD
    Client[Seller Dashboard UI] -->|Auth Token| Edge[Supabase Edge Function: 'ai-assistant']
    Edge -->|Verify JWT + Role| Auth[Supabase Auth]
    Edge -->|Check Rate Limit| DB[(Supabase Postgres)]
    Edge -->|Send Prompt| LLM[LLM Provider API (e.g., Gemini / OpenAI)]
    LLM -->|Stream Response| Edge
    Edge -->|Save to History| DB
    Edge -->|Return Stream/JSON| Client
```

## 2. Core Components

### A. Authentication & Security (Seller Only Access)
- **Supabase Auth**: All requests to the AI must include a valid JWT.
- **Role-Based Access Control (RBAC)**: The API endpoint (Edge Function) decodes the JWT and verifies that `user_metadata.role` is strictly equal to `'seller'`. Customers and Delivery Partners receive a `403 Forbidden` response.
- **Row Level Security (RLS)**: Chat history tables are secured so a seller can only `SELECT` and `INSERT` their own messages.

### B. API Handling (Supabase Edge Functions)
- We use **Deno-based Supabase Edge Functions** for low-latency processing globally.
- **Streaming Support**: To prevent "UI breaking issues" and "lag", the Edge Function connects to the LLM API using Server-Sent Events (SSE) and streams the chunks directly to the React frontend. This creates a fast, typing-like experience.

### C. Rate Limiting (Database + Redis/Supabase Cache)
To prevent abuse and control LLM costs:
- **Tier 1 (Soft Limit)**: Monitored via a Postgres table `ai_usage_logs`.
- A database function `check_rate_limit(seller_id)` runs before calling the LLM. If the user exceeds 50 prompts per hour, they receive an HTTP `429 Too Many Requests`.

## 3. Database Schema

Execute this SQL in your Supabase SQL Editor to set up the backend structure for the AI Assistant:

```sql
-- Create table for AI Chat History
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    category TEXT, -- 'pricing', 'seo', 'reply', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Secure the chat history (Sellers can only see their own chats)
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own chat history" 
    ON public.ai_chat_history FOR SELECT 
    USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own chat history" 
    ON public.ai_chat_history FOR INSERT 
    WITH CHECK (auth.uid() = seller_id);

-- Create table for Rate Limiting and Analytics
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast rate-limit queries
CREATE INDEX idx_ai_usage_seller_time ON public.ai_usage_logs(seller_id, created_at);

-- Function to check rate limits (Max 50 requests per hour)
CREATE OR REPLACE FUNCTION check_ai_rate_limit(target_seller_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO request_count
    FROM public.ai_usage_logs
    WHERE seller_id = target_seller_id 
    AND created_at > NOW() - INTERVAL '1 hour';
    
    IF request_count >= 50 THEN
        RETURN FALSE; -- Rate limit exceeded
    END IF;
    
    RETURN TRUE; -- Allowed
END;
$$;
```

## 4. API Integration Structure (Edge Function Example)

When you deploy your Edge Function (`supabase/functions/ai-assistant/index.ts`), it will look like this:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 1. Get Auth Header
  const authHeader = req.headers.get('Authorization')
  
  // 2. Initialize Supabase Admin Client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  // 3. Verify User & Role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata.role !== 'seller') {
    return new Response(JSON.stringify({ error: 'Unauthorized. Sellers only.' }), { status: 403 })
  }

  // 4. Check Rate Limit via Postgres RPC
  const { data: allowed } = await supabase.rpc('check_ai_rate_limit', { target_seller_id: user.id })
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), { status: 429 })
  }

  // 5. Call LLM API (Gemini/OpenAI) and stream response
  const { prompt } = await req.json()
  // ... LLM fetch logic with stream: true ...

  // 6. Log Usage (Async)
  await supabase.from('ai_usage_logs').insert({ seller_id: user.id, tokens_used: 150 })
  await supabase.from('ai_chat_history').insert([
    { seller_id: user.id, role: 'user', content: prompt },
    { seller_id: user.id, role: 'assistant', content: '...' }
  ])

  return new Response("LLM Response", { status: 200 })
})
```

## 5. Frontend API Handling (React)

To prevent UI lag in React, the `AIAssistantPage.jsx` component uses asynchronous state updates. When connected to the real backend, replace the `setTimeout` simulation with a standard `fetch` call to your Supabase Edge Function URL, ensuring you pass the session JWT in the Authorization header.

```javascript
// Example Frontend API Call
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch('https://[PROJECT_REF].supabase.co/functions/v1/ai-assistant', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({ prompt: userMsg, language: selectedLanguage })
});
```
