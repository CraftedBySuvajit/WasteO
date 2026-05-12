const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabaseErrorMessage =
  'Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY).';

if (!supabaseUrl || !supabaseKey) {
  console.warn(`⚠️ ${supabaseErrorMessage}`);
}

const configured = Boolean(supabaseUrl && supabaseKey);

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

module.exports = supabase;
