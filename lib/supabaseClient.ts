
import { createClient } from '@supabase/supabase-js';

// Helper to safely access environment variables if they exist
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) return process.env[key];
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env[key];
  return '';
};

// Use provided credentials as defaults if env vars are missing
const supabaseUrl = getEnv('REACT_APP_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || 'https://yfhcrharrgmyjfvozerw.supabase.co';
const supabaseKey = getEnv('REACT_APP_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmaGNyaGFycmdteWpmdm96ZXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTEyNzEsImV4cCI6MjA4NjA2NzI3MX0.WLu7ofct9CtmE4IohQPtlGhhgBZeEzHMW9GfH_7s-88';

let client;

// Only attempt to create the client if we have a valid-looking URL
if (supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey) {
  client = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('Supabase URL/Key missing. Using mock client for UI functionality.');
  
  // Mock client implementation to prevent crashes
  client = {
    from: (table: string) => ({
      insert: (data: any) => {
        console.log(`[Supabase Mock] Insert into '${table}':`, data);
        // Simulate successful response
        return Promise.resolve({ data, error: null });
      },
      select: () => Promise.resolve({ data: [], error: null })
    })
  } as any;
}

export const supabase = client;
