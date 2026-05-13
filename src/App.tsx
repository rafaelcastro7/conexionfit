import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import ClientPortal from "./pages/ClientPortal";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import CheckIn from "./pages/CheckIn";
import Scanner from "./pages/Scanner";
import StagingImportsPage from "./pages/StagingImportsPage";
import StagingImportDetailPage from "./pages/StagingImportDetailPage";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
}

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/portal" element={<ClientPortal />} />
      <Route path="/about" element={<About />} />
      <Route path="/checkin/:token" element={<CheckIn />} />
      <Route path="/scanner" element={<Scanner />} />
      <Route path="/" element={
        <ProtectedRoute allowedRoles={['admin', 'instructor']}>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/imports" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <StagingImportsPage />
        </ProtectedRoute>
      } />
      <Route path="/imports/:batchId" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <StagingImportDetailPage />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
