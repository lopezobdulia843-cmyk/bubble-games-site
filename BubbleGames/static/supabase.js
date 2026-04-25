// This is the "Phone" that talks to your database
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Use the exact URL and Key we found earlier
const supabaseUrl = 'https://ygpknejcukucsygokaen.supabase.co';
const supabaseKey = 'sb_publishable_5JbFhSI73LX6H2oehrtizA_zu-tWKjc';

export const supabase = createClient(supabaseUrl, supabaseKey);
