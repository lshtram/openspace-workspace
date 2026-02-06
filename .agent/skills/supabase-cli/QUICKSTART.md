# Supabase CLI Skill - Quick Start Guide

## ✅ Status: READY TO USE

The Supabase CLI skill has been created and tested. The CLI is available via `npx` (no global installation needed).

**OpenSpace Note**: The OpenSpace client does not use Supabase. This skill should remain idle unless a Supabase-backed service is explicitly in scope.

## 📁 Skill Location

**File**: `.agent/skills/supabase-cli/SKILL.md`

## 🔐 Authentication Required

Before using the CLI, you need to authenticate once:

### Step 1: Login to Supabase
```bash
npx supabase login
```
This will open a browser window for OAuth authentication.

### Step 2: Link to Your Project
```bash
npx supabase link --project-ref mtpbgmyrtucfdmzligxv
```

## 🚀 How to Use

### Option 1: Direct Commands (You Run)
You can run Supabase CLI commands directly in your terminal:

```bash
# Apply SQL file
npx supabase sql --file app/supabase/collections_import_policies.sql

# Check if policies exist
npx supabase sql --command "SELECT policyname FROM pg_policies WHERE tablename = 'practice_items';"

# List collections
npx supabase sql --command "SELECT id, title FROM collections;"
```

### Option 2: Via Skill (I Run With Your Approval)
Tell me: "Use the supabase-cli skill to apply the import policies"

I'll:
1. Show you the SQL to be executed
2. Wait for your explicit approval
3. Execute via `npx supabase sql`
4. Verify the results

## 🎯 Immediate Use Case: Fix Import Issue

To apply the missing RLS policies for collection import:

```bash
npx supabase sql --file app/supabase/collections_import_policies.sql
```

Then verify:
```bash
npx supabase sql --command "SELECT policyname, tablename FROM pg_policies WHERE policyname LIKE '%collection%';"
```

## 📋 Common Commands

| Task | Command |
|------|---------|
| **Apply SQL file** | `npx supabase sql --file <path>` |
| **Execute SQL** | `npx supabase sql --command "SELECT * FROM collections;"` |
| **List tables** | `npx supabase sql --command "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"` |
| **Check RLS policies** | `npx supabase sql --command "SELECT * FROM pg_policies;"` |
| **List projects** | `npx supabase projects list` |
| **Check status** | `npx supabase status` |

## 🔒 Security

- **Never executes destructive commands without your approval**
- **Always shows SQL before executing**
- **Waits for explicit "yes" confirmation**
- **Dry-run available**: `npx supabase db push --dry-run`

## 🆘 Troubleshooting

### "Not authenticated" error
```bash
npx supabase login
```

### "Project not linked" error
```bash
npx supabase link --project-ref mtpbgmyrtucfdmzligxv
```

### SQL fails to execute
1. Check syntax: `cat app/supabase/collections_import_policies.sql`
2. Verify table exists
3. Check error message details

## 📚 Full Documentation

See `.agent/skills/supabase-cli/SKILL.md` for complete documentation including:
- All available commands
- Security protocols
- Workflow examples
- Troubleshooting guide

## 🎉 Next Steps

1. **Authenticate**: Run `npx supabase login`
2. **Link project**: Run `npx supabase link --project-ref mtpbgmyrtucfdmzligxv`
3. **Apply SQL**: Run `npx supabase sql --file app/supabase/collections_import_policies.sql`
4. **Test import**: Try importing Jazz Standards collection again

**Or tell me**: "Grant supabase-cli access and apply the import policies" and I'll handle it with your approval at each step!
