import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context-supabase";

// Public pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import EmailConfirmation from "./pages/EmailConfirmation";
import RoleSelect from "./pages/RoleSelect";
import OnboardingStudent from "./pages/OnboardingStudent";
import OnboardingTeacher from "./pages/OnboardingTeacher";

// Protected pages
import Dashboard from "./pages/Dashboard";
import Repertoire from "./pages/Repertoire";
import PracticePlan from "./pages/PracticePlan";
import Memorization from "./pages/Memorization";
import Marketplace from "./pages/Marketplace";
import TeacherSearch from "./pages/TeacherSearch";
import StudentSearch from "./pages/StudentSearch";
import RequestsCenter from "./pages/RequestsCenter";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import AudioCheck from "./pages/AudioCheck";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDetail from "./pages/StudentDetail";
import Assign from "./pages/Assign";
import MusicSearch from "./pages/MusicSearch";
import StudentSubmissions from "./pages/StudentSubmissions";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/email-confirmation" element={<EmailConfirmation />} />
            <Route path="/role-select" element={<RoleSelect />} />
            <Route path="/onboarding/student" element={<OnboardingStudent />} />
            <Route path="/onboarding/teacher" element={<OnboardingTeacher />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/student/:studentId" element={<StudentDetail />} />
            <Route path="/repertoire" element={<Repertoire />} />
            <Route path="/practice-plan" element={<PracticePlan />} />
            <Route path="/memorization" element={<Memorization />} />
            <Route path="/audio-check" element={<AudioCheck />} />
            <Route path="/submissions" element={<TeacherDashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/teacher-search" element={<TeacherSearch />} />
            <Route path="/student-search" element={<StudentSearch />} />
            <Route path="/requests" element={<RequestsCenter />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/assign" element={<Assign />} />
            <Route path="/student-submissions" element={<StudentSubmissions />} />
<Route path="/music-search" element={<MusicSearch />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
