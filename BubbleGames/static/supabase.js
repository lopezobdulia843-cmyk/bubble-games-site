// This is the "Phone" that talks to your database via the Render Bridge
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// We point directly to your Render URL. 
// Because of your '/*' rewrite rule, Render will secretly handle the Supabase connection!
const supabaseUrl = 'https://bubblegames.onrender.com';
const supabaseKey = 'sb_publishable_5JbFhSI73LX6H2oehrtizA_zu-tWKjc';

export const supabase = createClient(supabaseUrl, supabaseKey);
