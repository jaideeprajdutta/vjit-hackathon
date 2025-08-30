-- =====================================================
-- Grievance Management System - Supabase Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. INSTITUTIONS TABLE
-- =====================================================
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    short_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('student', 'faculty', 'admin', 'super_admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. DEPARTMENTS TABLE
-- =====================================================
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. GRIEVANCE CATEGORIES TABLE
-- =====================================================
CREATE TABLE grievance_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. GRIEVANCES TABLE
-- =====================================================
CREATE TABLE grievances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_progress', 'closed', 'breached')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES grievance_categories(id) ON DELETE RESTRICT,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. GRIEVANCE UPDATES TABLE
-- =====================================================
CREATE TABLE grievance_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status_change TEXT,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. FILE ATTACHMENTS TABLE
-- =====================================================
CREATE TABLE file_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    grievance_id UUID REFERENCES grievances(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. SYSTEM LOGS TABLE
-- =====================================================
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('user_login', 'data_update', 'breach_alert')),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_users_role ON users(role);

-- Departments indexes
CREATE INDEX idx_departments_institution ON departments(institution_id);

-- Grievances indexes
CREATE INDEX idx_grievances_created_by ON grievances(created_by);
CREATE INDEX idx_grievances_assigned_to ON grievances(assigned_to);
CREATE INDEX idx_grievances_institution ON grievances(institution_id);
CREATE INDEX idx_grievances_status ON grievances(status);
CREATE INDEX idx_grievances_priority ON grievances(priority);
CREATE INDEX idx_grievances_category ON grievances(category_id);
CREATE INDEX idx_grievances_created_at ON grievances(created_at);

-- Grievance updates indexes
CREATE INDEX idx_grievance_updates_grievance ON grievance_updates(grievance_id);
CREATE INDEX idx_grievance_updates_updated_by ON grievance_updates(updated_by);

-- File attachments indexes
CREATE INDEX idx_file_attachments_grievance ON file_attachments(grievance_id);
CREATE INDEX idx_file_attachments_uploaded_by ON file_attachments(uploaded_by);

-- Notifications indexes
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_grievance ON notifications(grievance_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- System logs indexes
CREATE INDEX idx_system_logs_user ON system_logs(user_id);
CREATE INDEX idx_system_logs_event_type ON system_logs(event_type);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update last_updated_at timestamp
CREATE OR REPLACE FUNCTION update_last_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for grievances table
CREATE TRIGGER update_grievances_last_updated
    BEFORE UPDATE ON grievances
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own data and users from their institution
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view institution users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.institution_id = users.institution_id
        )
    );

-- Grievances policies
CREATE POLICY "Users can view own grievances" ON grievances
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can view institution grievances" ON grievances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.institution_id = grievances.institution_id
        )
    );

CREATE POLICY "Users can create grievances" ON grievances
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Assigned users can update grievances" ON grievances
    FOR UPDATE USING (assigned_to = auth.uid() OR created_by = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (recipient_id = auth.uid());

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample institutions
INSERT INTO institutions (name, short_name) VALUES
('University of Technology', 'UoT'),
('City Medical College', 'CMC'),
('Regional Engineering Institute', 'REI');

-- Insert sample grievance categories
INSERT INTO grievance_categories (name, description) VALUES
('Academic Issues', 'Problems related to courses, exams, and academic procedures'),
('Infrastructure', 'Issues with buildings, facilities, and equipment'),
('Administrative', 'Problems with administrative processes and procedures'),
('Hostel/Accommodation', 'Issues with student housing and accommodation'),
('Harassment/Discrimination', 'Complaints about harassment or discrimination'),
('Financial', 'Problems related to fees, payments, and financial aid'),
('Library Services', 'Issues with library access and services'),
('Transportation', 'Problems with campus transportation'),
('Food Services', 'Issues with canteen and food services'),
('Other', 'Other miscellaneous issues');

-- Insert sample departments
INSERT INTO departments (name, institution_id) VALUES
('Computer Science', (SELECT id FROM institutions WHERE short_name = 'UoT')),
('Electrical Engineering', (SELECT id FROM institutions WHERE short_name = 'UoT')),
('Mechanical Engineering', (SELECT id FROM institutions WHERE short_name = 'UoT')),
('Medicine', (SELECT id FROM institutions WHERE short_name = 'CMC')),
('Surgery', (SELECT id FROM institutions WHERE short_name = 'CMC'));

-- =====================================================
-- STORAGE BUCKET CREATION
-- =====================================================

-- Create storage bucket for file attachments
INSERT INTO storage.buckets (id, name, public) VALUES
('grievance-attachments', 'grievance-attachments', false);

-- Storage policies
CREATE POLICY "Users can upload files for their grievances" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'grievance-attachments' AND
        EXISTS (
            SELECT 1 FROM grievances g
            WHERE g.id::text = (storage.foldername(name))[1]
            AND g.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can view files for their institution grievances" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'grievance-attachments' AND
        EXISTS (
            SELECT 1 FROM grievances g
            JOIN users u ON u.id = auth.uid()
            WHERE g.id::text = (storage.foldername(name))[1]
            AND g.institution_id = u.institution_id
        )
    );
