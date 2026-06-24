const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const absoluteEnvPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(absoluteEnvPath)) {
  console.error('.env.local not found');
  process.exit(1);
}

const envContent = fs.readFileSync(absoluteEnvPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const projectId = 'caebbca8-f9da-4fd7-a919-87b1db33296f';

async function run() {
  try {
    console.log('Fetching video generation rows for project:', projectId);
    const { data: vids, error } = await supabase
      .from('video_generations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching video generations:', error);
      return;
    }

    console.log(`Found ${vids.length} attempts:`);
    vids.forEach(v => {
      console.log(`- ID: ${v.id}`);
      console.log(`  Status: ${v.status}`);
      console.log(`  Provider Job ID: ${v.provider_job_id}`);
      console.log(`  Error: ${v.error}`);
      console.log(`  Video URL: ${v.video_url}`);
      console.log(`  Settings:`, JSON.stringify(v.settings));
      console.log(`  Created At: ${v.created_at}`);
      console.log('----------------------------');
    });
  } catch (e) {
    console.error(e);
  }
}

run();
