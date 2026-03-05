import { createBrowserClient } from '@supabase/ssr';

// Create a client that uses cookies for auth sharing with server
export const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);
