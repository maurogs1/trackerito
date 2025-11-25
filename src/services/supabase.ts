import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://ybbbmgxjowhcxkicdnxy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliYmJtZ3hqb3doY3hraWNkbnh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTMzODgsImV4cCI6MjA3OTU2OTM4OH0.Yhn0qSmOO08cTIznGXsqPZuIChxhGRKYXUMcf96WgKs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
