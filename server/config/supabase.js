require('./loadEnv');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

const supabaseErrorMessage =
  'Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY).';

const publishableKeyMessage =
  'Backend is using a Supabase publishable key. Set SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY as service role) for server writes.';

if (!supabaseUrl || !supabaseKey) {
  console.warn(`⚠️ ${supabaseErrorMessage}`);
}

const configured = Boolean(supabaseUrl && supabaseKey);
const usingPublishableKey = Boolean(
  !process.env.SUPABASE_SERVICE_ROLE_KEY &&
  supabaseKey &&
  String(supabaseKey).startsWith('sb_publishable_')
);

if (usingPublishableKey) {
  console.warn(`⚠️ ${publishableKeyMessage}`);
}

const notConfiguredClient = new Proxy(
  {},
  {
    get() {
      return () => {
        throw new Error(supabaseErrorMessage);
      };
    },
  }
);

const supabase = configured ? createClient(supabaseUrl, supabaseKey) : notConfiguredClient;

supabase.isConfigured = configured;
supabase.configError = configured ? null : supabaseErrorMessage;
supabase.usingPublishableKey = usingPublishableKey;
supabase.publishableKeyError = usingPublishableKey ? publishableKeyMessage : null;

module.exports = supabase;
