import { createClient } from "@supabase/supabase-js";

// Public values only: the publishable key is designed to live in the browser.
// Row-level security (see supabase/schema.sql) protects the data.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && key ? createClient(url, key) : null;
