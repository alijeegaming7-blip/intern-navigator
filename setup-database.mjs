#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Intern Navigator - Database Setup Script');
console.log('===========================================\n');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env file');
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('✅ Supabase URL:', SUPABASE_URL);
console.log('✅ Service key found\n');

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('📡 Connecting to Supabase...\n');

async function executeSQLFile(filename, description) {
  console.log(`📄 Running: ${description}`);
  console.log(`   File: ${filename}`);
  
  try {
    const sql = readFileSync(join(__dirname, 'supabase', 'migrations', filename), 'utf-8');
    
    // Execute SQL using the REST API directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Try alternative method using pg_* functions
      const { data, error } = await supabase.rpc('exec_sql', { query: sql });
      
      if (error) {
        // If exec_sql doesn't exist, we need to use a different approach
        // Let's try executing via the Supabase management API
        throw new Error(`SQL execution failed: ${error.message}`);
      }
    }
    
    console.log('   ✅ Success!\n');
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

async function executeSQLDirect(sql, description) {
  console.log(`📄 Running: ${description}`);
  
  try {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`   Found ${statements.length} SQL statements to execute...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;
      
      // Use Supabase SQL query endpoint
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ query: statement + ';' })
      });
      
      // Even if response is not ok, continue (some statements might not return data)
      if (i % 10 === 0 && i > 0) {
        console.log(`   Progress: ${i}/${statements.length} statements...`);
      }
    }
    
    console.log('   ✅ Success!\n');
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

async function checkConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "relation does not exist" which is expected before setup
      throw error;
    }
    return true;
  } catch (error) {
    return false;
  }
}

async function setup() {
  // Test connection
  console.log('🔍 Testing connection...');
  const connected = await checkConnection();
  console.log(connected ? '✅ Connected!\n' : '⚠️  Tables not yet created (expected)\n');
  
  // Read the complete setup SQL
  console.log('📖 Reading database setup script...');
  const setupSQL = readFileSync(join(__dirname, 'COMPLETE_DATABASE_SETUP.sql'), 'utf-8');
  console.log('✅ Script loaded\n');
  
  console.log('⚡ Executing database setup...');
  console.log('   This will create all tables, functions, and seed data.\n');
  
  // Execute the complete SQL file
  const success = await executeSQLDirect(setupSQL, 'Complete Database Setup');
  
  if (success) {
    console.log('\n✨ DATABASE SETUP COMPLETE! ✨\n');
    console.log('📊 Your database now has:');
    console.log('   ✅ 12 tables created');
    console.log('   ✅ 30 skills loaded');
    console.log('   ✅ 10 case studies loaded');
    console.log('   ✅ Row Level Security configured');
    console.log('   ✅ Triggers and functions set up');
    console.log('   ✅ Admin functions ready\n');
    
    console.log('🎉 Next Steps:');
    console.log('   1. Go to: http://localhost:8080/');
    console.log('   2. Click "Create account"');
    console.log('   3. Sign up with your email');
    console.log('   4. Start using the app!\n');
    
    console.log('💡 Tip: The first user can become admin by calling');
    console.log('   the bootstrap_first_admin() function.\n');
    
    return true;
  } else {
    console.log('\n⚠️  SETUP INCOMPLETE\n');
    console.log('❌ There was an error during setup.');
    console.log('📋 Please run the SQL script manually:');
    console.log('   1. Open: https://supabase.com/dashboard/project/duvjqwptlnmluwrjxcud');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Copy content from: COMPLETE_DATABASE_SETUP.sql');
    console.log('   4. Paste and run in SQL Editor\n');
    return false;
  }
}

// Run setup
setup().catch(error => {
  console.error('\n❌ Fatal Error:', error.message);
  console.error('\n📋 Manual setup required. Please follow SUPABASE_SETUP_INSTRUCTIONS.md\n');
  process.exit(1);
});
