import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { BookOpen } from 'lucide-react';

interface RouteGuardProps {
  requiredRole?: 'admin' | 'parent' | 'child';
  children: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ requiredRole, children }) => {
  const { authStatus, sessionRole, user, activeChild } = useAuth();
  const location = useLocation();

  // 1. Loading State: Never redirect while checking session!
  if (authStatus === 'loading') {
    return (
      <div className="min-h-[calc(100vh-68px)] flex flex-col items-center justify-center bg-brand-bg px-4 select-none">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-turquoise to-[#2FD1C6] flex items-center justify-center text-white shadow-xl shadow-brand-turquoise/20 mb-6 animate-pulse">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="w-10 h-10 border-4 border-brand-turquoise border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-bold text-gray-500 text-sm">جاري استرجاع الجلسة بأمان...</p>
      </div>
    );
  }

  // 2. Unauthenticated State: Redirect to appropriate login portal
  if (authStatus === 'unauthenticated') {
    if (requiredRole === 'child') {
      return <Navigate to="/child-login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Authenticated State: Role validation
  if (requiredRole === 'admin') {
    if (!user || user.role !== 'admin') {
      return <Navigate to="/parent" replace />;
    }
  } else if (requiredRole === 'parent') {
    if (sessionRole === 'child' || !user) {
      return <Navigate to="/child-home" replace />;
    }
  } else if (requiredRole === 'child') {
    if (sessionRole !== 'child' || !activeChild) {
      return <Navigate to="/parent" replace />;
    }
  }

  return <>{children}</>;
};
