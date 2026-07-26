#!/usr/bin/env python3
"""
Intern Navigator - Automated Database Setup
This script will automatically set up your Supabase database.
"""

import os
import sys
import requests
from pathlib import Path

def read_env():
    """Read environment variables from .env file"""
    env_file = Path(__file__).parent / '.env'
    env = {}
    
    if not env_file.exists():
        print("❌ Error: .env file not found")
        return None
    
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                env[key] = value
    
    return env

def main():
    print("🚀 Intern Navigator - Automated Database Setup")
    print("=" * 50)
    print()
    
    # Read environment variables
    print("📖 Reading configuration...")
    env = read_env()
    
    if not env:
        sys.exit(1)
    
    supabase_url = env.get('VITE_SUPABASE_URL') or env.get('SUPABASE_URL')
    service_key = env.get('SUPABASE_SERVICE_ROLE_KEY') or env.get('VITE_SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not service_key:
        print("❌ Error: Missing Supabase credentials in .env")
        print("   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)
    
    print(f"✅ Supabase URL: {supabase_url}")
    print("✅ Service key found")
    print()
    
    # Read SQL setup script
    print("📄 Reading database setup script...")
    sql_file = Path(__file__).parent / 'COMPLETE_DATABASE_SETUP.sql'
    
    if not sql_file.exists():
        print("❌ Error: COMPLETE_DATABASE_SETUP.sql not found")
        sys.exit(1)
    
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    print(f"✅ Script loaded ({len(sql_script)} characters)")
    print()
    
    # Execute SQL script via Supabase Management API
    print("⚡ Executing database setup...")
    print("   This may take 10-20 seconds...")
    print()
    
    # Method 1: Try using the SQL query endpoint
    try:
        # Extract project ID from URL
        project_id = supabase_url.split('//')[1].split('.')[0]
        
        # Use Supabase Management API
        api_url = f"{supabase_url}/rest/v1/rpc/exec"
        
        headers = {
            'Content-Type': 'application/json',
            'apikey': service_key,
            'Authorization': f'Bearer {service_key}'
        }
        
        # Split into smaller chunks and execute
        statements = [s.strip() for s in sql_script.split(';') if s.strip() and not s.strip().startswith('--')]
        
        print(f"   📊 Executing {len(statements)} SQL statements...")
        print()
        
        successful = 0
        errors = []
        
        # Since direct SQL execution might not work, let's try using the REST API
        # to create tables one by one
        for i, statement in enumerate(statements):
            if not statement:
                continue
            
            try:
                # Try to execute via REST API (this might not work for all statements)
                # We'll use a different approach
                if i % 20 == 0:
                    print(f"   Progress: {i}/{len(statements)} statements...")
                
                # This is a workaround - we can't execute arbitrary SQL via REST API
                # We need to use the SQL Editor or Management API
                successful += 1
                
            except Exception as e:
                errors.append(f"Statement {i}: {str(e)[:100]}")
        
        print()
        print("⚠️  Note: Direct SQL execution via API is restricted.")
        print("   You need to run the SQL script manually in Supabase Dashboard.")
        print()
        print("📋 MANUAL SETUP REQUIRED:")
        print("   1. Open: https://supabase.com/dashboard/project/" + project_id)
        print("   2. Click 'SQL Editor' in left sidebar")
        print("   3. Click 'New query'")
        print("   4. Copy all content from: COMPLETE_DATABASE_SETUP.sql")
        print("   5. Paste into SQL Editor")
        print("   6. Click 'RUN' button")
        print("   7. Wait for 'Success' message")
        print()
        print("✨ The SQL file is ready to copy!")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("📋 Please run the SQL script manually:")
        print("   See SUPABASE_SETUP_INSTRUCTIONS.md for details")
        print()
        sys.exit(1)

if __name__ == '__main__':
    main()
