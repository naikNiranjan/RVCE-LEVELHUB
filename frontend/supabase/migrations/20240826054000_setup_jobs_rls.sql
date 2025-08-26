-- Migration: Setup RLS policies for jobs, applications, and other tables
-- This migration sets up proper Row Level Security policies for all application tables

-- Enable RLS on all tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- ================================
-- JOBS TABLE POLICIES
-- ================================

-- Anyone can view active jobs (for job listings)
CREATE POLICY "Anyone can view active jobs" ON public.jobs
  FOR SELECT USING (status = 'active');

-- Only admins can create jobs
CREATE POLICY "Admins can create jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update jobs
CREATE POLICY "Admins can update jobs" ON public.jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete jobs
CREATE POLICY "Admins can delete jobs" ON public.jobs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ================================
-- APPLICATIONS TABLE POLICIES
-- ================================

-- Students can view their own applications
CREATE POLICY "Students can view own applications" ON public.applications
  FOR SELECT USING (auth.uid() = student_id);

-- Students can create applications for themselves
CREATE POLICY "Students can create applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Students can update their own applications (limited fields)
CREATE POLICY "Students can update own applications" ON public.applications
  FOR UPDATE USING (auth.uid() = student_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications" ON public.applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update application status
CREATE POLICY "Admins can update applications" ON public.applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ================================
-- ADDITIONAL PROFILE POLICIES
-- ================================

-- Enable users to insert their own profile (for registration)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow profile updates during registration/signup
CREATE POLICY "Allow profile creation on signup" ON public.profiles
  FOR INSERT WITH CHECK (true);