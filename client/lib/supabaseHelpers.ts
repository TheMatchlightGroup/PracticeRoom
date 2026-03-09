/**
 * Supabase Helper Functions
 * Robust profile bootstrap and management utilities
 */

import { supabase } from "./supabaseClient";
import { User as AuthUser } from "@supabase/supabase-js";

/**
 * Ensure a user profile exists in public.users
 * Creates one if it doesn't exist yet
 * Safe to call multiple times - idempotent
 */
export async function ensureUserProfile(sessionUser: AuthUser) {
  try {
    console.log("🔐 Profile: Checking if profile exists for user:", sessionUser.id);

    // Check if profile already exists
    const { data: existing, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("id", sessionUser.id)
      .maybeSingle();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 is "no rows found" which is expected
      console.warn("🔐 Profile: Error checking for existing profile:", selectError.message);
    }

    if (existing) {
      console.log("🔐 Profile: Profile already exists for:", sessionUser.email);
      return existing;
    }

    // Profile doesn't exist - create it
    console.log("🔐 Profile: Creating new profile for:", sessionUser.email);

    const { data, error } = await supabase
      .from("users")
      .insert({
        id: sessionUser.id,
        email: sessionUser.email || "",
        name: sessionUser.user_metadata?.name || "",
        role: null,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("🔐 Profile: Error creating profile:", error.message);
      throw error;
    }

    console.log("🔐 Profile: Profile created successfully for:", sessionUser.email);
    return data;
  } catch (error) {
    console.error("🔐 Profile: ensureUserProfile failed:", error);
    throw error;
  }
}

/**
 * Update user role and mark onboarding as complete
 * Uses upsert so it works whether row exists or not
 */
export async function updateUserRoleAndOnboarding(
  userId: string,
  userEmail: string,
  role: string,
  userName?: string
) {
  try {
    console.log("🔐 Profile: Updating role for user:", userId, "role:", role);

    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          id: userId,
          email: userEmail,
          name: userName || "",
          role: role,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.error("🔐 Profile: Error updating role:", error.message);
      throw error;
    }

    console.log("🔐 Profile: Role updated to:", role);
    return data;
  } catch (error) {
    console.error("🔐 Profile: updateUserRoleAndOnboarding failed:", error);
    throw error;
  }
}

/**
 * Safely fetch user profile with recovery
 * If profile is missing, attempts to create it
 */
export async function fetchOrCreateUserProfile(sessionUser: AuthUser) {
  try {
    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", sessionUser.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.warn("🔐 Profile: Error fetching profile:", error.message);
    }

    if (profile) {
      console.log("🔐 Profile: Profile fetched for:", sessionUser.email);
      return profile;
    }

    // Profile missing - ensure it exists
    console.log("🔐 Profile: Profile missing, creating...");
    return await ensureUserProfile(sessionUser);
  } catch (error) {
    console.error("🔐 Profile: fetchOrCreateUserProfile failed:", error);
    throw error;
  }
}
