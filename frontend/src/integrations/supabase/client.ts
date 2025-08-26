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
