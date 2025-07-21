import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from 'react-native-dotenv';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
  throw new Error('Supabase configuration is incomplete');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);