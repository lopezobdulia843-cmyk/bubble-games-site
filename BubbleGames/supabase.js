// This file initializes the connection to your Supabase project.
// We use 'process.env' to keep your keys "invisible" like Roblox does.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

// This is the "Client" that we will use in our Auth and Game files
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
