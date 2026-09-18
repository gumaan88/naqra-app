import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPages';
import { ChildLoginPage } from './pages/ChildLoginPage';
import { ChildDashboard } from './pages/ChildDashboard';
import { WordLettersGame } from './pages/WordLettersGame';
import { WordImageGame } from './pages/WordImageGame';
import { GameSummary } from './pages/GameSummary';
import { ParentDashboard } from './pages/ParentDashboard';
import { AdminStudio } from './pages/AdminStudio';
import { RouteGuard } from './components/RouteGuard';

export const App: React.FC = () => {
  const location = useLocation();
  const isGameRoute = location.pathname.startsWith('/game/');

  return (
    <div className={`bg-brand-bg ${isGameRoute ? 'h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none select-none' : 'min-h-screen flex flex-col'}`}>
      {!isGameRoute && <Navbar />}
      <main className={isGameRoute ? 'h-full w-full overflow-hidden' : 'flex-1'}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/child-login" element={<ChildLoginPage />} />
          <Route path="/child-select" element={<Navigate to="/child-login" replace />} />
          <Route
            path="/child-home"
            element={
              <RouteGuard requiredRole="child">
                <ChildDashboard />
              </RouteGuard>
            }
          />
          <Route
            path="/game/word-letters"
            element={
              <RouteGuard requiredRole="child">
                <WordLettersGame />
              </RouteGuard>
            }
          />
          <Route
            path="/game/word-image"
            element={
              <RouteGuard requiredRole="child">
                <WordImageGame />
              </RouteGuard>
            }
          />
          <Route
            path="/summary"
            element={
              <RouteGuard requiredRole="child">
                <GameSummary />
              </RouteGuard>
            }
          />
          <Route
            path="/parent"
            element={
              <RouteGuard requiredRole="parent">
                <ParentDashboard />
              </RouteGuard>
            }
          />
          <Route
            path="/admin"
            element={
              <RouteGuard requiredRole="admin">
                <AdminStudio />
              </RouteGuard>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};
