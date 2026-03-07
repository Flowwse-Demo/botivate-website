import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fekrswxjqpqnhuvkezxv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZla3Jzd3hqcXBxbmh1dmtlenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTM1NTgsImV4cCI6MjA2NTYyOTU1OH0.T9kUSNi4tloP3zxR9y9w3gdQBm1uNoR1WaexnivgnFI';

async function test() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { count, error } = await supabase
        .from("FMS")
        .select("*", { count: 'exact', head: true });

    console.log(`Total exact count of rows in FMS: ${count}`);
}

test();
