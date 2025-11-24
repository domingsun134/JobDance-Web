// Server-side authentication utilities for API routes
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Get authenticated Supabase client with Bearer token
export function getAuthenticatedSupabaseClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// Get server-side Supabase client with user session
export async function getServerSupabaseClient() {
  const cookieStore = await cookies();
  
  // Log available cookies for debugging
  const allCookies = cookieStore.getAll();
  const supabaseCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'));
  if (supabaseCookies.length > 0) {
    console.log('Found Supabase cookies:', supabaseCookies.map(c => c.name).join(', '));
  } else {
    console.warn('No Supabase cookies found in request');
  }
  
  // Supabase uses cookies with pattern: sb-<project-ref>-auth-token
  // We need to provide get, set, and remove methods for proper cookie handling
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const value = cookieStore.get(name)?.value;
        if (name.includes('auth') && value) {
          console.log(`Found auth cookie: ${name.substring(0, 30)}...`);
        }
        return value;
      },
      set(name: string, value: string, options: any) {
        // In API routes, we can't set cookies directly
        // This is mainly for client-side usage
        try {
          cookieStore.set(name, value, options);
        } catch (error) {
          // Ignore errors in API routes
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.delete(name);
        } catch (error) {
          // Ignore errors in API routes
        }
      },
    },
    auth: {
      persistSession: false, // Don't persist session in server context
      autoRefreshToken: false, // Don't auto-refresh in server context
      detectSessionInUrl: false, // Don't detect session in URL for API routes
    },
  } as any); // Type assertion to bypass TypeScript check for cookies option
  
  return supabase;
}

// Get current user in server-side context (API routes)
export async function getServerUser(request?: Request) {
  try {
    // First, try to get user from Authorization header (Bearer token)
    if (request) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (token) {
        try {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          const { data: { user }, error } = await supabase.auth.getUser(token);
          
          if (!error && user) {
            console.log('User authenticated via Bearer token');
            return {
              id: user.id,
              email: user.email || '',
            };
          } else if (error) {
            console.warn('Error validating Bearer token:', error.message);
          }
        } catch (tokenError: any) {
          console.warn('Error processing Bearer token:', tokenError.message);
        }
      } else {
        console.warn('No Authorization header found in request');
      }
    }
    
    // Fallback: try to get from cookies
    try {
      const supabase = await getServerSupabaseClient();
      
      // First try to get the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!sessionError && session?.user) {
        return {
          id: session.user.id,
          email: session.user.email || '',
        };
      }
      
      // Fallback: try getUser() directly
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        return {
          id: user.id,
          email: user.email || '',
        };
      }
    } catch (cookieError: any) {
      console.warn('Error reading user from cookies:', cookieError.message);
    }
    
    return null;
  } catch (error: any) {
    console.error('Error getting server user:', error.message || error);
    return null;
  }
}

// Get user profile in server-side context (API routes)
export async function getServerUserProfile(userId: string) {
  try {
    const supabase = await getServerSupabaseClient();
    
    // Fetch all profile data in parallel
    const [workExpResult, educationResult, skillsResult, languagesResult, availabilityResult, salaryResult] = await Promise.all([
      supabase.from('work_experience').select('*').eq('user_id', userId),
      supabase.from('education').select('*').eq('user_id', userId),
      supabase.from('skills').select('*').eq('user_id', userId),
      supabase.from('languages').select('*').eq('user_id', userId),
      supabase.from('availability').select('*').eq('user_id', userId).single(),
      supabase.from('expected_salary').select('*').eq('user_id', userId).single(),
    ]);

    return {
      workExperience: (workExpResult.data || []).map((exp: any) => ({
        id: exp.id,
        company: exp.company,
        position: exp.position,
        startDate: exp.start_date,
        endDate: exp.end_date || '',
        current: exp.current,
        description: exp.description || '',
      })),
      education: (educationResult.data || []).map((edu: any) => ({
        id: edu.id,
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        startDate: edu.start_date,
        endDate: edu.end_date || '',
        current: edu.current,
      })),
      skills: (skillsResult.data || []).map((s: any) => s.skill),
      languages: (languagesResult.data || []).map((lang: any) => ({
        name: lang.name,
        proficiency: lang.proficiency,
      })),
      availability: {
        startDate: availabilityResult.data?.start_date || '',
        duration: availabilityResult.data?.duration || '',
      },
      expectedSalary: salaryResult.data ? {
        amount: parseFloat(salaryResult.data.amount.toString()),
        currency: salaryResult.data.currency,
        period: salaryResult.data.period,
      } : {
        amount: 0,
        currency: 'USD',
        period: 'monthly',
      },
    };
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

