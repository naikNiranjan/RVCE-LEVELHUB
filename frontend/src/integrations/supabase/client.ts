import { createClient } from '@supabase/supabase-js';
import { Database } from './types'; // Assuming you have a types.ts file for your db schema

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env file');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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

// Get eligible jobs for a student
export const getEligibleJobs = async (studentId) => {
  try {
    // Get student profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (profileError) throw profileError;

    // Get all active jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .gte('deadline', new Date().toISOString());

    if (jobsError) throw jobsError;

    // Filter eligible jobs
    const eligibleJobs = [];
    for (const job of jobs) {
      const eligibility = await checkJobEligibility(profile, job);
      if (eligibility.eligible) {
        eligibleJobs.push(job);
      }
    }

    return eligibleJobs;
  } catch (error) {
    console.error('Error getting eligible jobs:', error);
    throw error;
  }
};

// Apply to a job with resume upload
export const applyToJob = async (jobId: string, coverLetter = '', resumeFile?: File) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // If no resume file, use traditional Supabase approach
    if (!resumeFile) {
      const { data, error } = await supabase
        .from('applications')
        .insert([{
          job_id: jobId,
          student_id: user.id,
          cover_letter: coverLetter,
          resume_url: ''
        }])
        .select();

      if (error) throw error;
      return data;
    }

    // Use FastAPI backend for file upload
    const formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('student_id', user.id);
    if (coverLetter) {
      formData.append('cover_letter', coverLetter);
    }
    formData.append('resume', resumeFile);

    const response = await fetch('http://localhost:8000/api/applications', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to submit application');
    }

    const result = await response.json();

    // Also save to Supabase for consistency
    const { data, error } = await supabase
      .from('applications')
      .insert([{
        job_id: jobId,
        student_id: user.id,
        cover_letter: coverLetter,
        resume_url: result.data.resume_url,
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
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (
          id,
          company_name,
          role,
          location,
          ctc
        ),
        profiles (
          id,
          full_name,
          usn,
          branch,
          cgpa
        )
      `)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting all applications:', error);
    throw error;
  }
};
