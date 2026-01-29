import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jnzeiqnpwhtwurxnxmgo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuemVpcW5wd2h0d3VyeG54bWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDE3NjMsImV4cCI6MjA4NTI3Nzc2M30.PkKDUASvAwVOgHX3ROjxxgkdLJysvf9DtJZb44S2xAg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
