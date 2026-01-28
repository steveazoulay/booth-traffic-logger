import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lfaupxnwfyyuvpaggdpt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmYXVweG53Znl5dXZwYWdnZHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NjQzMjIsImV4cCI6MjA4NTE0MDMyMn0.wfDKmhINIf_mJ9gW8tMB966mVsXX7ixMg2Nubq5PD64'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
