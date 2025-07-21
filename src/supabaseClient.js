import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://crdpvtaqdwptzaqccfba.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZHB2dGFxZHdwdHphcWNjZmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5MjY2ODMsImV4cCI6MjA2MTUwMjY4M30.A__MrCDmz-YHBR8vCjPGhAokOmV4-zMGKw27f1-CqRc'
);