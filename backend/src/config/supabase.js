const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

module.exports = supabase;