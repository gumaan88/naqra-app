import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPages';
import { ChildSelectPage } from './pages/ChildSelectPage';
import { ChildDashboard } from './pages/ChildDashboard';
import { WordLettersGame } from './pages/WordLettersGame';
import { WordImageGame } from './pages/WordImageGame';
import { GameSummary } from './pages/GameSummary';
import { ParentDashboard } from './pages/ParentDashboard';
import { AdminStudio } from './pages/AdminStudio';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/child-select" element={<ChildSelectPage />} />
          <Route path="/child-home" element={<ChildDashboard />} />
          <Route path="/game/word-letters" element={<WordLettersGame />} />
          <Route path="/game/word-image" element={<WordImageGame />} />
          <Route path="/summary" element={<GameSummary />} />
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/admin" element={<AdminStudio />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};
