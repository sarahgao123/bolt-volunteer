import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';

// Lazy load components for better performance
const Hero = React.lazy(() => import('./components/Hero').then(m => ({ default: m.Hero })));
const EventManager = React.lazy(() => import('./components/events/EventManager').then(m => ({ default: m.EventManager })));
const PositionsPage = React.lazy(() => import('./pages/PositionsPage').then(m => ({ default: m.PositionsPage })));
const CheckInPage = React.lazy(() => import('./pages/CheckInPage').then(m => ({ default: m.CheckInPage })));
const AuthForm = React.lazy(() => import('./components/auth/AuthForm').then(m => ({ default: m.AuthForm })));

// Protected route wrapper component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <AuthForm />;
  }
  
  return <>{children}</>;
}

function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    
    // Initialize auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <>
                    <Hero />
                    <EventManager />
                  </>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/:eventId/positions" 
              element={
                <ProtectedRoute>
                  <PositionsPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/checkin/:positionId" element={<CheckInPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;