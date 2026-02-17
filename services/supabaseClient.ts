
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vlkgjzppiczewozornng.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsa2dqenBwaWN6ZXdvem9ybm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMzI1MzIsImV4cCI6MjA4NjgwODUzMn0.8rTuNSNNGHlklxy9Y2XoUimXhcwRPTsiDa5PuEwy2jA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
