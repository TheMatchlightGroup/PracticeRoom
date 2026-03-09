import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole, StudentProfile, TeacherProfile } from "@/types";

interface AuthContextType {
  user: User | null;
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

  // Initialize from localStorage (mock persistence)
  useEffect(() => {
    const stored = localStorage.getItem("practiceroom_user");
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);

        const storedStudent = localStorage.getItem("practiceroom_student");
        if (storedStudent) {
          setStudentProfile(JSON.parse(storedStudent));
        }

        const storedTeacher = localStorage.getItem("practiceroom_teacher");
        if (storedTeacher) {
          setTeacherProfile(JSON.parse(storedTeacher));
        }
      } catch (e) {
        console.error("Failed to parse stored auth data", e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - in real app, call Supabase
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: email.split("@")[0],
        role: "student", // Default, will be updated in role selection
        createdAt: new Date().toISOString(),
      };

      setUser(newUser);
      localStorage.setItem("practiceroom_user", JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    // Mock signup
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name,
        role: "student",
        createdAt: new Date().toISOString(),
      };

      setUser(newUser);
      localStorage.setItem("practiceroom_user", JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUser(null);
      setStudentProfile(null);
      setTeacherProfile(null);
      localStorage.removeItem("practiceroom_user");
      localStorage.removeItem("practiceroom_student");
      localStorage.removeItem("practiceroom_teacher");
    } finally {
      setIsLoading(false);
    }
  };

  const selectRole = async (role: UserRole) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem("practiceroom_user", JSON.stringify(updatedUser));
    } finally {
      setIsLoading(false);
    }
  };

  const completeStudentOnboarding = async (profile: StudentProfile) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStudentProfile(profile);
      localStorage.setItem("practiceroom_student", JSON.stringify(profile));
    } finally {
      setIsLoading(false);
    }
  };

  const completeTeacherOnboarding = async (profile: TeacherProfile) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTeacherProfile(profile);
      localStorage.setItem("practiceroom_teacher", JSON.stringify(profile));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
