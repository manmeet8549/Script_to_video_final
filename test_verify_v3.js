const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

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
const encryptionKeyRaw = env.ENCRYPTION_KEY;

const IV_LEN = 12;
const TAG_LEN = 16;

function getKey() {
  const raw = encryptionKeyRaw.trim();
  return /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');
}

function decryptSecret(payload) {
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const workspaceId = '6f7f4402-944e-4319-97b8-f7c3cf8493a1';

// Custom avatar ID from earlier runs
const avatarId = '3a8d91662d7f4a43af72dacc650eb82b';

async function testEndpoint(url, apiKey) {
  console.log(`Testing endpoint: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    });
    console.log(`Status for ${url}:`, res.status, res.statusText);
    const json = await res.json().catch(() => ({}));
    console.log(`Response for ${url}:`, JSON.stringify(json).substring(0, 300) + '...\n');
  } catch (err) {
    console.error(`Error for ${url}:`, err.message);
  }
}

async function run() {
  try {
    const { data: apis } = await supabase
      .from('workspace_apis')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'video')
      .single();

    const apiKey = decryptSecret(apis.api_key_encrypted);

    // Try various possible v3 endpoints for specific avatar/look ID
    await testEndpoint(`https://api.heygen.com/v3/avatars/${avatarId}`, apiKey);
    await testEndpoint(`https://api.heygen.com/v3/avatars/looks?limit=10`, apiKey);

  } catch (err) {
    console.error(err);
  }
}

run();
