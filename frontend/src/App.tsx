
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import ImageUpload from "./pages/ImageUpload";
import ImageTagging from "./pages/ImageTagging";
import ImageSearch from "./pages/ImageSearch";
import AuthorManagement from "./pages/AuthorManagement";
import AccountManagement from "./pages/AccountManagement";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import { isAuthenticated } from "./utils/api";
import ProtectedRoute from '@/components/ProtectedRoute';
import RequireSuperuser from '@/components/RequireSuperuser';

const queryClient = new QueryClient();



// ScrollToTop component to ensure page scrolls to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" closeButton />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={<Navigate to="/upload" replace />} 
          />
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <ImageUpload />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tagging" 
            element={
              <ProtectedRoute>
                <ImageTagging />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/search" 
            element={
              <ProtectedRoute>
                <ImageSearch />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/authors" 
            element={
              <ProtectedRoute>
                <AuthorManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/account" 
            element={
              <ProtectedRoute>
                <AccountManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <RequireSuperuser>
                  <UserManagement />
                </RequireSuperuser>
              </ProtectedRoute>
            } 
          />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
