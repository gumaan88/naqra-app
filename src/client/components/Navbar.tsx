import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { Volume2, VolumeX, BookOpen, Star, UserCheck, LogOut, Settings, ShieldCheck, Home } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, activeChild, isMuted, toggleSound, logout, setActiveChild } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isChildMode = location.pathname.startsWith('/game') || location.pathname === '/child-home';

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-brand-turquoise/20 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-turquoise to-[#2FD1C6] flex items-center justify-center text-white shadow-md shadow-brand-turquoise/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-brand-text tracking-tight flex items-center gap-1">
              نَقْرَأ
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-yellow/30 text-amber-900 font-bold">تجريبي</span>
            </span>
          </div>
        </Link>

        {/* Right side tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Child Indicator */}
          {activeChild && (
            <div className="flex items-center gap-2 bg-brand-bg px-3 py-1.5 rounded-2xl border border-brand-turquoise/30">
              <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center font-black text-amber-950 text-sm shadow-inner overflow-hidden">
                {activeChild.photo_url ? (
                  <img src={activeChild.photo_url} alt={activeChild.display_name} className="w-full h-full object-cover" />
                ) : (
                  activeChild.display_name[0]
                )}
              </div>
              <span className="font-bold text-sm hidden sm:inline text-brand-text">
                {activeChild.display_name}
              </span>
              <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-xl text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{activeChild.total_points}</span>
              </div>
              <button
                onClick={() => {
                  setActiveChild(null);
                  navigate('/child-select');
                }}
                title="تبديل الطفل"
                className="text-xs text-brand-turquoise hover:underline font-semibold pr-1"
              >
                تبديل
              </button>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`btn-child !min-h-[42px] !min-w-[42px] w-10 h-10 !rounded-xl border ${
              isMuted
                ? 'bg-gray-100 border-gray-300 text-gray-400'
                : 'bg-brand-yellow/20 border-brand-yellow/50 text-amber-800'
            }`}
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Navigation Links based on role */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/parent"
                className={`btn-child !min-h-[42px] px-3.5 !rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  location.pathname === '/parent'
                    ? 'bg-brand-purple text-white'
                    : 'bg-purple-50 text-brand-purple border border-brand-purple/30'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">لوحة ولي الأمر</span>
              </Link>

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`btn-child !min-h-[42px] px-3 !rounded-xl text-xs font-bold flex items-center gap-1 ${
                    location.pathname === '/admin'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">إدارة المحتوى</span>
                </Link>
              )}

              <button
                onClick={logout}
                title="تسجيل الخروج"
                className="btn-child !min-h-[42px] !min-w-[42px] w-10 h-10 !rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-child !min-h-[42px] px-4 !rounded-xl bg-brand-purple text-white text-xs font-bold hover:bg-opacity-95 shadow-sm"
            >
              <UserCheck className="w-4 h-4 ml-1" />
              <span>دخول ولي الأمر</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
