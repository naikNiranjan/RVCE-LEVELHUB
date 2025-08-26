import { createClient } from '@supabase/supabase-js';
import { Database } from './types'; // Assuming you have a types.ts file for your db schema

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env file');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Migration function to apply RLS policies (run once)
export const applyRLSMigration = async () => {
  try {
    console.log('🔧 Applying RLS migration...');

    // Note: This would require service role key for DDL operations
    // For now, this is a placeholder - you'll need to apply the migration manually in Supabase dashboard

    console.log('⚠️  Please apply the RLS migration manually in Supabase dashboard');
    console.log('📁 Migration file: frontend/supabase/migrations/20240826054000_setup_jobs_rls.sql');

    return { success: false, message: 'Manual migration required' };
  } catch (error) {
    console.error('❌ Error applying RLS migration:', error);
    throw error;
  }
};

export const signUpUser = async (email, password, userData) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: userData.usn,
        usn: userData.usn,
        branch: userData.branch,
        cgpa: userData.cgpa,
        tenth: userData.tenth,
        twelfth: userData.twelfth,
        date_of_birth: userData.dateOfBirth,
        graduation_year: userData.graduationYear,
        active_backlog: userData.activeBacklog,
        aadhar_card: userData.aadharCard,
      }
    }
  });

  if (error) throw error;
  return data;
};

export const signInStudent = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profileError) throw profileError;

  if (!profile || profile.role !== 'student') {
    await supabase.auth.signOut();
    throw new Error('Not a student account');
  }

  return { ...data, role: profile.role };
};

export const signInAdmin = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profileError) throw profileError;

  if (!profile || profile.role !== 'admin') {
    await supabase.auth.signOut();
    throw new Error('Not an admin account');
  }

  return { ...data, role: profile.role };
};

// Check if student is eligible for a job
export const checkJobEligibility = async (studentProfile, job) => {
  // Check CGPA
  if (studentProfile.cgpa < job.min_cgpa) {
    return { eligible: false, reason: `CGPA ${studentProfile.cgpa} is below required ${job.min_cgpa}` };
  }

  // Check branch
  if (job.eligible_branches && job.eligible_branches.length > 0) {
    if (!job.eligible_branches.includes(studentProfile.branch)) {
      return { eligible: false, reason: `${studentProfile.branch} branch is not eligible` };
    }
  }

  // Check active backlogs
  if (studentProfile.active_backlog && studentProfile.active_backlog > job.max_active_backlogs) {
    return { eligible: false, reason: `Active backlogs (${studentProfile.active_backlog}) exceed limit (${job.max_active_backlogs})` };
  }

  // Check gender preference
  if (job.gender_preference && job.gender_preference !== 'No preference') {
    // Note: Gender field not captured in signup, so skip this check for now
  }

  return { eligible: true };
};

// Get eligible jobs for a student using backend API
export const getEligibleJobs = async (studentId: string) => {
  try {
    console.log('🔍 Getting eligible jobs from backend for student:', studentId);

    const response = await fetch(`http://localhost:8001/api/jobs/eligible/${studentId}`);

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to get eligible jobs');
    }

    console.log('✅ Backend returned eligible jobs:', result.data);
    return result.data || [];
  } catch (error) {
    console.error('❌ Error getting eligible jobs from backend:', error);
    // Fallback to frontend filtering if backend fails
    console.log('🔄 Falling back to frontend filtering...');
    return getEligibleJobsFrontend(studentId);
  }
};

// Fallback function for frontend filtering (if backend is down)
const getEligibleJobsFrontend = async (studentId: string) => {
  try {
    console.log('🔍 Frontend fallback: Getting eligible jobs for student:', studentId);

    // Get student profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (profileError) throw profileError;

    console.log('👤 Student profile:', profile);

    // Get all active jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .gte('deadline', new Date().toISOString());

    if (jobsError) throw jobsError;

    console.log('💼 All active jobs:', jobs);

    // Filter eligible jobs
    const eligibleJobs = [];
    for (const job of jobs) {
      const eligibility = await checkJobEligibility(profile, job);
      console.log(`🔍 Job: ${job.company_name} - ${job.role}, Eligible: ${eligibility.eligible}`, eligibility.reason);
      if (eligibility.eligible) {
        eligibleJobs.push(job);
      }
    }

    console.log('✅ Final eligible jobs (frontend):', eligibleJobs);
    return eligibleJobs;
  } catch (error) {
    console.error('❌ Error in frontend fallback:', error);
    throw error;
  }
};

// Apply to a job (simplified for now)
export const applyToJob = async (jobId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('applications')
      .insert([{
        job_id: jobId,
        student_id: user.id,
        status: 'applied'
      }])
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error applying to job:', error);
    throw error;
  }
};

// Get student's applications
export const getStudentApplications = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (
          id,
          company_name,
          role,
          location,
          ctc,
          deadline
        )
      `)
      .eq('student_id', studentId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting applications:', error);
    throw error;
  }
};

// Get all applications for admin
export const getAllApplications = async () => {
  try {
    // Get applications with job details first
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (
          id,
          company_name,
          role,
          location,
          ctc
        )
      `)
      .order('applied_at', { ascending: false });

    if (appsError) throw appsError;

    if (!applications || applications.length === 0) {
      return [];
    }

    // Get student IDs from applications
    const studentIds = [...new Set(applications.map(app => app.student_id))];

    // Get student profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, usn, branch, cgpa, email')
      .in('id', studentIds);

    if (profilesError) {
      console.warn('Error getting profiles:', profilesError);
      // Continue without profiles if there's an error
    }

    // Merge the data
    const applicationsWithProfiles = applications.map(app => ({
      ...app,
      profiles: profiles?.find(profile => profile.id === app.student_id) || null
    }));

    return applicationsWithProfiles;
  } catch (error) {
    console.error('Error getting all applications:', error);
    throw error;
  }
};
