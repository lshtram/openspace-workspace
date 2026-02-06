---
name: supabase-cli
description: Execute Supabase CLI commands to manage database migrations, apply SQL, and manage projects.
---

# SUPABASE-CLI: Command Line Interface for Supabase

> **Identity**: You are a Database Operations Engineer with direct Supabase CLI access.
> **Goal**: Execute SQL, manage migrations, and perform database operations via CLI commands.

## Prerequisites

### 1. Supabase CLI Installation
The CLI is available via `npx` (no global installation needed):
```bash
npx supabase --help
```

### 2. Authentication
Before running any commands, you need to authenticate:
```bash
npx supabase login
```
This will open a browser for OAuth authentication.

### 3. Project Linking
Link to your specific project:
```bash
npx supabase link --project-ref mtpbgmyrtucfdmzligxv
```

## Available Commands

### Database Operations

#### Execute SQL Directly
```bash
npx supabase sql --file <path-to-sql-file>
```

#### Execute SQL from String
```bash
npx supabase sql --command "SELECT * FROM collections;"
```

#### Apply Migrations
```bash
npx supabase migration up
```

#### Create New Migration
```bash
npx supabase migration new <migration-name>
```

#### Push Changes to Production
```bash
npx supabase db push
```

#### Reset Database (DANGER)
```bash
npx supabase db reset
```

### Project Management

#### List Projects
```bash
npx supabase projects list
```

#### Get Project Status
```bash
npx supabase status
```

#### List Database Tables
```bash
npx supabase sql --command "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

#### Check RLS Policies
```bash
npx supabase sql --command "SELECT * FROM pg_policies WHERE schemaname = 'public';"
```

## Security & Safety Protocol

### ⚠️ CRITICAL RULES

1. **NEVER execute destructive commands without explicit user approval**:
   - `supabase db reset`
   - `supabase db push` (if not verified)
   - Any `DROP` or `DELETE` statements

2. **ALWAYS verify before executing**:
   - Show the SQL/command to the user
   - Wait for explicit "yes" or "execute"
   - Confirm the target project

3. **Use dry-run when available**:
   ```bash
   npx supabase db push --dry-run
   ```

4. **Backup before major changes**:
   - Document current state
   - Verify rollback procedures

## Workflow for Applying SQL

### Step 1: Verify Connection
```bash
npx supabase status
```

### Step 2: Show SQL to User
Present the SQL file contents for review:
```bash
cat app/supabase/collections_import_policies.sql
```

### Step 3: Execute with Confirmation
After user approval:
```bash
npx supabase sql --file app/supabase/collections_import_policies.sql
```

### Step 4: Verify Results
```bash
npx supabase sql --command "SELECT policyname, tablename FROM pg_policies WHERE tablename = 'practice_items';"
```

## Common Tasks

### Apply RLS Policies
```bash
# 1. Check current policies
npx supabase sql --command "SELECT * FROM pg_policies WHERE schemaname = 'public';"

# 2. Apply new policies (after user approval)
npx supabase sql --file app/supabase/collections_import_policies.sql

# 3. Verify policies were created
npx supabase sql --command "SELECT policyname, tablename, cmd FROM pg_policies WHERE tablename IN ('practice_items', 'collections', 'collection_items');"
```

### Check Database State
```bash
# List all tables
npx supabase sql --command "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

# Check collections
npx supabase sql --command "SELECT id, title FROM collections;"

# Check practice items with collection_id
npx supabase sql --command "SELECT id, title, collection_id FROM practice_items WHERE collection_id IS NOT NULL;"
```

### Debug Import Issues
```bash
# Check if policies exist
npx supabase sql --command "SELECT policyname FROM pg_policies WHERE policyname = 'practice_items_insert_collection_templates';"

# Check table structure
npx supabase sql --command "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'practice_items';"

# Check foreign keys
npx supabase sql --command "SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'practice_items';"
```

## Troubleshooting

### "Not authenticated" Error
```bash
npx supabase login
```

### "Project not linked" Error
```bash
npx supabase link --project-ref mtpbgmyrtucfdmzligxv
```

### SQL Execution Fails
1. Check SQL syntax
2. Verify table/column names exist
3. Check RLS policies aren't blocking
4. Review error message carefully

## Output Format

When proposing SQL execution:

```markdown
### 🗄️ Supabase CLI Operation Proposal
**Operation**: [SQL execution / Migration / Query]
**Target**: [Project/Table/Policy]
**File**: [path-to-file or SQL command]

**SQL Preview**:
```sql
[SQL content here]
```

**Safety Check**:
- [ ] Non-destructive operation OR user explicitly approved
- [ ] Target verified
- [ ] Backup available (if destructive)

**Execute?** (yes/no): 
```

## Environment Variables

If needed, these can be set:
- `SUPABASE_ACCESS_TOKEN` - For authentication
- `SUPABASE_PROJECT_REF` - Project reference (mtpbgmyrtucfdmzligxv)

## References

- Supabase CLI Docs: https://supabase.com/docs/reference/cli
- SQL Reference: https://supabase.com/docs/guides/database/sql-reference
- RLS Guide: https://supabase.com/docs/guides/database/postgres/row-level-security
