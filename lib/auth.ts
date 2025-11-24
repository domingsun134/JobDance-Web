'use client';

import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  onboardingCompleted: boolean;
  profile?: UserProfile;
}

export interface UserProfile {
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  languages: Language[];
  availability: Availability;
  expectedSalary: Salary;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

export interface Language {
  name: string;
  proficiency: "basic" | "intermediate" | "advanced" | "native";
}

export interface Availability {
  startDate: string;
  duration: string;
}

export interface Salary {
  amount: number;
  currency: string;
  period: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
}

// Register a new user
export async function registerUser(email: string, password: string): Promise<User> {
  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    throw new Error(authError.message || "Registration failed");
  }

  if (!authData.user) {
    throw new Error("Failed to create user");
  }

  // User profile is automatically created by database trigger
  // Wait a moment for the trigger to execute, then verify profile exists
  // Retry a few times in case the trigger takes longer
  let profile = null;
  let profileError = null;
  const maxRetries = 3;
  
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', authData.user.id)
      .single();
    
    if (data && !error) {
      profile = data;
      break;
    }
    
    profileError = error;
    
    // If it's not a "not found" error, break early
    if (error && error.code !== 'PGRST116') {
      break;
    }
  }

  // If profile doesn't exist after retries, try to create it manually (fallback)
  if (!profile && profileError) {
    if (profileError.code === 'PGRST116') {
      // Profile doesn't exist, try to create it
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: email,
          onboarding_completed: false,
        });

      if (insertError) {
        // If insert fails due to RLS, the trigger will create it eventually
        // Log the error but don't block registration - user can proceed
        console.warn('Profile creation failed, but user account is created:', insertError.message);
        // Don't throw - allow user to proceed, profile will be created by trigger or on next login
      }
    } else {
      // Other error - log but don't block
      console.warn('Profile verification error:', profileError.message);
    }
  }

  return {
    id: authData.user.id,
    email: email,
    onboardingCompleted: false,
  };
}

// Login user
export async function loginUser(email: string, password: string): Promise<User> {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    throw new Error(authError.message || "Invalid email or password");
  }

  if (!authData.user) {
    throw new Error("Login failed");
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('id', authData.user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    throw new Error(profileError.message || "Failed to fetch user profile");
  }

  return {
    id: authData.user.id,
    email: authData.user.email || email,
    onboardingCompleted: profile?.onboarding_completed || false,
  };
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('id', authUser.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    return null;
  }

  return {
    id: authUser.id,
    email: authUser.email || '',
    onboardingCompleted: profile?.onboarding_completed || false,
  };
}

// Update user profile
export async function updateUserProfile(profile: UserProfile): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not logged in");
  }

  // Ensure user profile exists first
  const { data: existingProfile, error: checkError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (checkError && checkError.code === 'PGRST116') {
    // Profile doesn't exist, create it
    const { error: createError } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        onboarding_completed: true,
      });

    if (createError) {
      throw new Error(createError.message || "Failed to create user profile");
    }
  } else if (checkError) {
    throw new Error(checkError.message || "Failed to check user profile");
  } else {
    // Profile exists, update onboarding status
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id);

    if (profileError) {
      throw new Error(profileError.message || "Failed to update profile");
    }
  }

  // Delete existing data
  await supabase.from('work_experience').delete().eq('user_id', user.id);
  await supabase.from('education').delete().eq('user_id', user.id);
  await supabase.from('skills').delete().eq('user_id', user.id);
  await supabase.from('languages').delete().eq('user_id', user.id);
  await supabase.from('availability').delete().eq('user_id', user.id);
  await supabase.from('expected_salary').delete().eq('user_id', user.id);

  // Insert work experience
  if (profile.workExperience.length > 0) {
    const workExpData = profile.workExperience.map(exp => {
      // Convert month format (YYYY-MM) to date format (YYYY-MM-DD)
      const formatDate = (dateStr: string) => {
        if (!dateStr) return null;
        // If already in YYYY-MM-DD format, return as is
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
        // If in YYYY-MM format, append -01
        if (dateStr.match(/^\d{4}-\d{2}$/)) return `${dateStr}-01`;
        return dateStr;
      };

      return {
        user_id: user.id,
        company: exp.company,
        position: exp.position,
        start_date: formatDate(exp.startDate),
        end_date: exp.endDate ? formatDate(exp.endDate) : null,
        current: exp.current,
        description: exp.description || null,
      };
    });

    const { error: workExpError } = await supabase
      .from('work_experience')
      .insert(workExpData);

    if (workExpError) {
      throw new Error(workExpError.message || "Failed to save work experience");
    }
  }

  // Insert education
  if (profile.education.length > 0) {
    const educationData = profile.education.map(edu => {
      // Convert month format (YYYY-MM) to date format (YYYY-MM-DD)
      const formatDate = (dateStr: string) => {
        if (!dateStr) return null;
        // If already in YYYY-MM-DD format, return as is
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
        // If in YYYY-MM format, append -01
        if (dateStr.match(/^\d{4}-\d{2}$/)) return `${dateStr}-01`;
        return dateStr;
      };

      return {
        user_id: user.id,
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        start_date: formatDate(edu.startDate),
        end_date: edu.endDate ? formatDate(edu.endDate) : null,
        current: edu.current,
      };
    });

    const { error: educationError } = await supabase
      .from('education')
      .insert(educationData);

    if (educationError) {
      throw new Error(educationError.message || "Failed to save education");
    }
  }

  // Insert skills
  if (profile.skills.length > 0) {
    const skillsData = profile.skills.map(skill => ({
      user_id: user.id,
      skill: skill,
    }));

    const { error: skillsError } = await supabase
      .from('skills')
      .insert(skillsData);

    if (skillsError) {
      throw new Error(skillsError.message || "Failed to save skills");
    }
  }

  // Insert languages
  if (profile.languages.length > 0) {
    const languagesData = profile.languages.map(lang => ({
      user_id: user.id,
      name: lang.name,
      proficiency: lang.proficiency,
    }));

    const { error: languagesError } = await supabase
      .from('languages')
      .insert(languagesData);

    if (languagesError) {
      throw new Error(languagesError.message || "Failed to save languages");
    }
  }

  // Insert/Update availability
  if (profile.availability.startDate || profile.availability.duration) {
    // Format date if needed (YYYY-MM-DD format expected)
    const formatDate = (dateStr: string) => {
      if (!dateStr) return null;
      // If already in YYYY-MM-DD format, return as is
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
      // If in YYYY-MM format, append -01
      if (dateStr.match(/^\d{4}-\d{2}$/)) return `${dateStr}-01`;
      return dateStr;
    };

    const { error: availabilityError } = await supabase
      .from('availability')
      .upsert({
        user_id: user.id,
        start_date: profile.availability.startDate ? formatDate(profile.availability.startDate) : null,
        duration: profile.availability.duration || null,
      });

    if (availabilityError) {
      throw new Error(availabilityError.message || "Failed to save availability");
    }
  }

  // Insert/Update expected salary
  if (profile.expectedSalary.amount > 0) {
    const { error: salaryError } = await supabase
      .from('expected_salary')
      .upsert({
        user_id: user.id,
        amount: profile.expectedSalary.amount,
        currency: profile.expectedSalary.currency,
        period: profile.expectedSalary.period,
      });

    if (salaryError) {
      throw new Error(salaryError.message || "Failed to save expected salary");
    }
  }
}

// Get user profile with all data
export async function getUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  // Fetch all profile data in parallel
  const [workExpResult, educationResult, skillsResult, languagesResult, availabilityResult, salaryResult] = await Promise.all([
    supabase.from('work_experience').select('*').eq('user_id', user.id),
    supabase.from('education').select('*').eq('user_id', user.id),
    supabase.from('skills').select('*').eq('user_id', user.id),
    supabase.from('languages').select('*').eq('user_id', user.id),
    supabase.from('availability').select('*').eq('user_id', user.id).single(),
    supabase.from('expected_salary').select('*').eq('user_id', user.id).single(),
  ]);

  return {
    workExperience: (workExpResult.data || []).map(exp => ({
      id: exp.id,
      company: exp.company,
      position: exp.position,
      startDate: exp.start_date,
      endDate: exp.end_date || '',
      current: exp.current,
      description: exp.description || '',
    })),
    education: (educationResult.data || []).map(edu => ({
      id: edu.id,
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      startDate: edu.start_date,
      endDate: edu.end_date || '',
      current: edu.current,
    })),
    skills: (skillsResult.data || []).map(s => s.skill),
    languages: (languagesResult.data || []).map(lang => ({
      name: lang.name,
      proficiency: lang.proficiency as Language['proficiency'],
    })),
    availability: {
      startDate: availabilityResult.data?.start_date || '',
      duration: availabilityResult.data?.duration || '',
    },
    expectedSalary: salaryResult.data ? {
      amount: parseFloat(salaryResult.data.amount.toString()),
      currency: salaryResult.data.currency,
      period: salaryResult.data.period as Salary['period'],
    } : {
      amount: 0,
      currency: 'USD',
      period: 'monthly',
    },
  };
}

// Logout user
export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
}

// Sign in with LinkedIn OAuth
export async function signInWithLinkedIn(): Promise<void> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('LinkedIn OAuth error:', error);
      // Provide more specific error messages
      if (error.message?.includes('not enabled') || error.message?.includes('Unsupported provider')) {
        throw new Error('LinkedIn provider is not enabled in Supabase. Please enable it in Authentication → Providers → LinkedIn.');
      }
      throw new Error(error.message || 'Failed to initiate LinkedIn login');
    }

    // The redirect will happen automatically
    if (data.url) {
      console.log('Redirecting to LinkedIn OAuth:', data.url);
      window.location.href = data.url;
    } else {
      throw new Error('No redirect URL received from Supabase. Please check your Supabase configuration.');
    }
  } catch (err: any) {
    console.error('LinkedIn sign-in error:', err);
    throw err;
  }
}
