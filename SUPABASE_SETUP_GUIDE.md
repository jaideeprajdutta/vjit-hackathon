# 🚀 Supabase Setup Guide for Grievance Management System

This guide will help you set up the complete Supabase backend for your Grievance Management System.

## 📋 Prerequisites

- A Supabase account (free tier available)
- Node.js and npm installed
- Basic knowledge of SQL and React

## 🗄️ Step 1: Create Supabase Project

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Click "New Project"**
3. **Fill in project details:**
   - Name: `grievance-management-system`
   - Database Password: Choose a strong password
   - Region: Select closest to your users
4. **Click "Create new project"**
5. **Wait for project to be ready (2-3 minutes)**

## 🔧 Step 2: Configure Environment Variables

1. **Get your Supabase credentials:**
   - Go to Project Settings → API
   - Copy the following values:
     - Project URL
     - Anon (public) key

2. **Create `.env` file in your project root:**
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Backend API URL (if using separate backend)
REACT_APP_API_URL=http://localhost:5001/api
```

## 🗃️ Step 3: Set Up Database Schema

1. **Go to SQL Editor in Supabase Dashboard**
2. **Copy and paste the entire content from `supabase-schema.sql`**
3. **Click "Run" to execute the schema**

This will create:
- ✅ All 9 tables with proper relationships
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Storage bucket for file uploads
- ✅ Sample data for testing

## 🔐 Step 4: Configure Authentication

1. **Go to Authentication → Settings**
2. **Configure email templates (optional):**
   - Welcome email
   - Password reset email
   - Email confirmation

3. **Set up email provider (optional):**
   - Go to Authentication → Providers
   - Configure SMTP settings for custom email domain

## 📁 Step 5: Configure Storage

1. **Go to Storage in Supabase Dashboard**
2. **Verify the `grievance-attachments` bucket was created**
3. **Check that storage policies are in place**

## 🚀 Step 6: Install Dependencies

```bash
# Install Supabase client
npm install @supabase/supabase-js

# Install additional dependencies if needed
npm install lucide-react
```

## 🧪 Step 7: Test the Setup

1. **Start your React application:**
```bash
npm start
```

2. **Test user registration:**
   - Navigate to `/register`
   - Create a test user account
   - Verify user appears in Supabase Auth and users table

3. **Test grievance creation:**
   - Login with test user
   - Create a new grievance
   - Upload test files
   - Verify data appears in database

## 📊 Step 8: Monitor and Debug

### Database Monitoring
- **Go to Database → Tables** to view your data
- **Go to Database → Logs** to see query performance
- **Go to Database → API** to test queries directly

### Authentication Monitoring
- **Go to Authentication → Users** to see registered users
- **Go to Authentication → Logs** to see auth events

### Storage Monitoring
- **Go to Storage → Files** to see uploaded files
- **Go to Storage → Logs** to see storage events

## 🔧 Advanced Configuration

### Custom RLS Policies

You can modify Row Level Security policies in the SQL Editor:

```sql
-- Example: Allow admins to see all grievances
CREATE POLICY "Admins can view all grievances" ON grievances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );
```

### Custom Functions

Create database functions for complex operations:

```sql
-- Example: Function to get grievance statistics
CREATE OR REPLACE FUNCTION get_grievance_stats(institution_id UUID)
RETURNS TABLE (
    total_grievances BIGINT,
    open_grievances BIGINT,
    closed_grievances BIGINT,
    avg_resolution_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_grievances,
        COUNT(*) FILTER (WHERE status != 'closed') as open_grievances,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_grievances,
        AVG(
            CASE 
                WHEN status = 'closed' 
                THEN last_updated_at - created_at 
                ELSE NULL 
            END
        ) as avg_resolution_time
    FROM grievances 
    WHERE grievances.institution_id = $1;
END;
$$ LANGUAGE plpgsql;
```

### Real-time Subscriptions

Enable real-time updates in your React components:

```javascript
// Subscribe to grievance updates
const subscription = supabase
  .channel('grievance_updates')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'grievances' },
    (payload) => {
      console.log('Grievance updated:', payload)
      // Update your UI
    }
  )
  .subscribe()
```

## 🛠️ Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check your `.env` file exists
   - Verify variable names start with `REACT_APP_`
   - Restart your development server

2. **"Row Level Security policy violation"**
   - Check RLS policies in SQL Editor
   - Verify user authentication
   - Check user role and permissions

3. **"File upload failed"**
   - Verify storage bucket exists
   - Check storage policies
   - Verify file size and type restrictions

4. **"Database connection error"**
   - Check Supabase project status
   - Verify project URL and API key
   - Check network connectivity

### Debug Queries

Test your database directly in Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check user data
SELECT * FROM users LIMIT 5;

-- Check grievances
SELECT * FROM grievances LIMIT 5;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 📈 Performance Optimization

### Database Indexes
The schema includes optimized indexes, but you can add more:

```sql
-- Add composite index for common queries
CREATE INDEX idx_grievances_status_priority 
ON grievances(status, priority);

-- Add full-text search index
CREATE INDEX idx_grievances_title_description 
ON grievances USING gin(to_tsvector('english', title || ' ' || description));
```

### Query Optimization
Use efficient queries in your React components:

```javascript
// Good: Select only needed fields
const { data } = await supabase
  .from('grievances')
  .select('id, title, status, created_at')
  .eq('institution_id', institutionId);

// Better: Use pagination
const { data } = await supabase
  .from('grievances')
  .select('*', { count: 'exact' })
  .range(0, 9);
```

## 🔒 Security Best Practices

1. **Never expose service role key in frontend**
2. **Use RLS policies for data access control**
3. **Validate all user inputs**
4. **Implement proper error handling**
5. **Use HTTPS in production**
6. **Regular security audits**

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage API Reference](https://supabase.com/docs/reference/javascript/storage-createbucket)

## 🎉 You're Ready!

Your Supabase backend is now fully configured and ready to use with your Grievance Management System. The provided services and components will handle all CRUD operations, file uploads, authentication, and real-time updates.

Happy coding! 🚀
