import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />
      <main className="flex-1">
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
