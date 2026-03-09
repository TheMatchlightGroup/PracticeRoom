import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole, StudentProfile, TeacherProfile } from "@/types";
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  onAuthStateChange,
} from "@/lib/supabaseClient";
import { supabase } from "@/lib/supabaseClient";
import {
  ensureUserProfile,
  fetchOrCreateUserProfile,
  updateUserRoleAndOnboarding,
} from "@/lib/supabaseHelpers";

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  studentProfile: StudentProfile | null;
  teacherProfile: TeacherProfile | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  selectRole: (role: UserRole) => Promise<void>;
  completeStudentOnboarding: (profile: StudentProfile) => Promise<void>;
  completeTeacherOnboarding: (profile: TeacherProfile) => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null
  );
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Supabase auth state
  useEffect(() => {
    let mounted = true;

    console.log("🔐 Auth: useEffect triggered, initializing auth state listener");

    // Set up the auth state listener (only once per mount)
    // This will handle session restoration from URL hashes (email confirmations)
    const subscription = onAuthStateChange(async (authUser) => {
      if (!mounted) return;

      try {
        if (authUser) {
          console.log("🔐 Auth: Auth user detected:", authUser.id, authUser.email);

          // STEP 3: Ensure user profile exists in public.users
          // This bootstrap guarantees every auth user has an app profile row
          await ensureUserProfile(authUser);

          // STEP 5: Fetch or create profile (resilient)
          const profileData = await fetchOrCreateUserProfile(authUser);

          if (profileData) {
            console.log("🔐 Auth: Profile loaded successfully for:", profileData.email);
            setUser({
              id: profileData.id,
              email: profileData.email,
              name: profileData.name,
              role: profileData.role,
              profilePhoto: profileData.profile_photo,
              createdAt: profileData.created_at,
              teacher_id: profileData.teacher_id,
              onboardingCompleted: profileData.onboarding_completed || false,
            });

            // Fetch role-specific profile if user has completed onboarding
            if (profileData.role === "student") {
              const { data: studentData } = await supabase
                .from("student_profiles")
                .select("*")
                .eq("user_id", profileData.id)
                .maybeSingle();

              if (studentData) {
                setStudentProfile({
                  userId: studentData.user_id,
                  vocalRangeLow: studentData.vocal_range_low,
                  vocalRangeHigh: studentData.vocal_range_high,
                  experienceLevel: studentData.experience_level,
                  goals: studentData.goals,
                  primaryInstrument: studentData.primary_instrument,
                });
              }
            } else if (profileData.role === "teacher") {
              const { data: teacherData } = await supabase
                .from("teacher_profiles")
                .select("*")
                .eq("user_id", profileData.id)
                .maybeSingle();

              if (teacherData) {
                setTeacherProfile({
                  userId: teacherData.user_id,
                  bio: teacherData.bio,
                  methodsUsed: teacherData.methods_used,
                  instrumentsTaught: teacherData.instruments_taught,
                  yearsExperience: teacherData.years_experience,
                  hourlyRate: teacherData.hourly_rate,
                });
              }
            }
          }
        } else {
          // User logged out
          console.log("🔐 Auth: User logged out");
          setUser(null);
          setStudentProfile(null);
          setTeacherProfile(null);
        }
      } catch (error) {
        console.error("🔐 Auth: Error during auth state change:", error);
        // Don't fail - auth is still valid even if profile loading failed
        if (authUser) {
          setUser({
            id: authUser.id,
            email: authUser.email || "",
            name: authUser.user_metadata?.name || "",
            role: null,
            profilePhoto: null,
            createdAt: new Date().toISOString(),
            teacher_id: null,
            onboardingCompleted: false,
          });
        }
      } finally {
        // Mark auth as loaded after first state change
        if (mounted) {
          console.log("🔐 Auth: Initialization complete, isLoading=false");
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("🔐 Auth: Login attempt started");
      const result = await signIn(email, password);
      if (!result.success) {
        throw new Error(
          result.error instanceof Error ? result.error.message : "Login failed"
        );
      }

      console.log("🔐 Auth: Login successful, auth state change will be handled by listener");
      // Don't manually set user state - let the onAuthStateChange listener handle it
      // This ensures consistency and avoids race conditions
    } catch (error) {
      console.error("🔐 Auth: Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const result = await signUp(email, password, name);
      if (!result.success) {
        throw new Error(
          result.error instanceof Error ? result.error.message : "Signup failed"
        );
      }

      // Don't create user record yet - wait for email confirmation
      // The user record will be created when they confirm email and go through role selection
      console.log("🔐 Auth: Signup successful, user needs to confirm email");
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const result = await signOut();
      if (!result.success) {
        throw new Error("Logout failed");
      }
      setUser(null);
      setStudentProfile(null);
      setTeacherProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const selectRole = async (role: UserRole) => {
    if (!user) return;

    try {
      console.log("🔐 Auth: Role selection started for role:", role);

      // Use upsert helper to ensure row exists and update role
      // Pass user's name to preserve it in the database
      const data = await updateUserRoleAndOnboarding(user.id, user.email, role, user.name);

      console.log("🔐 Auth: Role selected successfully:", role);

      setUser({
        ...user,
        role: data.role,
        onboardingCompleted: data.onboarding_completed || false,
      });
    } catch (error) {
      console.error("🔐 Auth: Role selection error:", error);
      throw error;
    }
  };

  const completeStudentOnboarding = async (profile: StudentProfile) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("student_profiles")
        .upsert({
          user_id: user.id,
          vocal_range_low: profile.vocalRangeLow,
          vocal_range_high: profile.vocalRangeHigh,
          experience_level: profile.experienceLevel,
          goals: profile.goals,
          primary_instrument: profile.primaryInstrument,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setStudentProfile({
          userId: data.user_id,
          vocalRangeLow: data.vocal_range_low,
          vocalRangeHigh: data.vocal_range_high,
          experienceLevel: data.experience_level,
          goals: data.goals,
          primaryInstrument: data.primary_instrument,
        });
      }

      // Mark onboarding as complete
      await markOnboardingComplete();
    } catch (error) {
      console.error("Student onboarding error:", error);
      throw error;
    }
  };

  const completeTeacherOnboarding = async (profile: TeacherProfile) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("teacher_profiles")
        .upsert({
          user_id: user.id,
          bio: profile.bio,
          methods_used: profile.methodsUsed,
          instruments_taught: profile.instrumentsTaught,
          years_experience: profile.yearsExperience,
          hourly_rate: profile.hourlyRate,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTeacherProfile({
          userId: data.user_id,
          bio: data.bio,
          methodsUsed: data.methods_used,
          instrumentsTaught: data.instruments_taught,
          yearsExperience: data.years_experience,
          hourlyRate: data.hourly_rate,
        });
      }

      // Mark onboarding as complete
      await markOnboardingComplete();
    } catch (error) {
      console.error("Teacher onboarding error:", error);
      throw error;
    }
  };

  const markOnboardingComplete = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .update({ onboarding_completed: true })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setUser({
          ...user,
          onboardingCompleted: true,
        });
      }
    } catch (error) {
      console.error("Failed to mark onboarding as complete:", error);
      throw error;
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole: user?.role ?? null,
        studentProfile,
        teacherProfile,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        selectRole,
        completeStudentOnboarding,
        completeTeacherOnboarding,
        markOnboardingComplete,
        getAuthToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
