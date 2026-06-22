// Run using: node --env-file=.env.local scripts/test_create.js
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function test() {
  const { data, error } = await supabase.rpc("get_tables"); // Or query from a table
  console.log("Testing notifications table select...");
  const { data: notifs, error: nErr } = await supabase.from("notifications").select("*").limit(1);
  if (nErr) console.error("Notifications table query error:", nErr);
  else console.log("Notifications table query success:", notifs);
}

test();
