/**
 * Supabase Client
 * Uses ANON_KEY for frontend authentication
 * Handles user sessions and client-side queries
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase client environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
}

/**
 * Supabase client for frontend use
 * Restricted to authenticated users via RLS policies
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sign up new user with email/password
 */
export async function signUp(email: string, password: string, name: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) throw error;
    return { success: true, user: data.user };
  } catch (error) {
    console.error("Sign up error:", error);
    return { success: false, error };
  }
}

/**
 * Sign in user with email/password
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { success: true, user: data.user, session: data.session };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error };
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: false, error };
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (error) {
    console.error("Failed to get user:", error);
    return null;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (user: any) => void
) {
  const { data } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        callback(session.user);
      } else {
        callback(null);
      }
    }
  );

  return data?.subscription;
}
