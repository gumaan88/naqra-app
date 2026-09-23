import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { Volume2, VolumeX, BookOpen, Star, UserCheck, LogOut, Settings, ShieldCheck, Gamepad2, Zap } from 'lucide-react';
import { DirectPlayModal } from './DirectPlayModal';

export const Navbar: React.FC = () => {
  const { user, activeChild, sessionRole, isGuest, isMuted, toggleSound, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDirectPlayOpen, setIsDirectPlayOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isGuestActive = isGuest || (activeChild as any)?.is_guest;

  return (
    <>
      <DirectPlayModal isOpen={isDirectPlayOpen} onClose={() => setIsDirectPlayOpen(false)} />
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
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-yellow/30 text-amber-950 font-bold">تجريبي</span>
              </span>
            </div>
          </Link>

          {/* Right side tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Child Mode Active Profile */}
            {sessionRole === 'child' && activeChild && (
              <div className="flex items-center gap-2 bg-brand-bg px-3 py-1.5 rounded-2xl border border-brand-turquoise/30">
                <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center font-black text-amber-950 text-sm shadow-inner overflow-hidden">
                  {activeChild.photo_url ? (
                    <img src={activeChild.photo_url} alt={activeChild.display_name} className="w-full h-full object-cover" />
                  ) : (
                    activeChild.display_name[0]
                  )}
                </div>
                <div className="flex flex-col text-right">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sm text-brand-text leading-tight">
                      {activeChild.display_name}
                    </span>
                    {isGuestActive && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 font-extrabold border border-amber-300">
                        ضيف
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">
                    مستوى {activeChild.current_level}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-xl text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{activeChild.total_points}</span>
                </div>
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

            {/* Role-Specific Actions */}
            {sessionRole === 'child' ? (
              <button
                onClick={handleLogout}
                title={isGuestActive ? 'إنهاء جلسة الضيف' : 'خروج الطفل'}
                className="btn-child !min-h-[42px] px-3.5 !rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-bold flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{isGuestActive ? 'إنهاء اللعب' : 'خروج'}</span>
              </button>
            ) : user ? (
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
                  onClick={handleLogout}
                  title="تسجيل الخروج"
                  className="btn-child !min-h-[42px] !min-w-[42px] w-10 h-10 !rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDirectPlayOpen(true)}
                  className="btn-child !min-h-[42px] px-3.5 !rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-black text-xs shadow-sm flex items-center gap-1 border border-amber-300"
                >
                  <Zap className="w-4 h-4 fill-amber-950 text-amber-950" />
                  <span>لعب مباشر</span>
                </button>
                <Link
                  to="/child-login"
                  className="btn-child !min-h-[42px] px-3.5 !rounded-xl bg-brand-turquoise text-white text-xs font-bold hover:bg-opacity-95 shadow-sm flex items-center gap-1"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span className="hidden sm:inline">دخول مسجل</span>
                </Link>
                <Link
                  to="/login"
                  className="btn-child !min-h-[42px] px-3 !rounded-xl bg-brand-purple text-white text-xs font-bold hover:bg-opacity-95 shadow-sm flex items-center gap-1"
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">ولي الأمر</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

