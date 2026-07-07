const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;
const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY && SUPABASE_SECRET_KEY !== 'YOUR_SECRET_KEY_HERE');

function createSupabaseStub() {
  const errorResult = { data: null, error: { message: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.' } };

  class QueryBuilder {
    constructor() {
      this._result = errorResult;
    }
    select() { return this; }
    eq() { return this; }
    order() { return Promise.resolve(this._result); }
    single() { return Promise.resolve(this._result); }
    maybeSingle() { return Promise.resolve(this._result); }
    insert() { return this; }
    update() { return this; }
    delete() { return Promise.resolve(this._result); }
  }

  return {
    isConfigured: false,
    from() {
      return new QueryBuilder();
    }
  };
}

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.warn('Supabase environment variables are missing. Supabase will not be available.');
} else if (!hasSupabaseConfig) {
  console.warn('Supabase secret key is still a placeholder. Replace it with a real key to enable live database access.');
}

const supabase = hasSupabaseConfig
  ? Object.assign(createClient(SUPABASE_URL, SUPABASE_SECRET_KEY), { isConfigured: true })
  : createSupabaseStub();

module.exports = supabase;
