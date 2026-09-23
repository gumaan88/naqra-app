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
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-brand-turquoise/20 px-3 sm:px-4 py-2.5 sm:py-3 w-full max-w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between w-full gap-2">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-brand-turquoise to-[#2FD1C6] flex items-center justify-center text-white shadow-md shadow-brand-turquoise/20 group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-brand-text tracking-tight flex items-center gap-1">
                نَقْرَأ
                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-brand-yellow/30 text-amber-950 font-bold">تجريبي</span>
              </span>
            </div>
          </Link>

          {/* Right side tools */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Child Mode Active Profile */}
            {sessionRole === 'child' && activeChild && (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-brand-bg px-2 sm:px-3 py-1 sm:py-1.5 rounded-2xl border border-brand-turquoise/30 max-w-[170px] sm:max-w-none shrink-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-yellow flex items-center justify-center font-black text-amber-950 text-xs sm:text-sm shadow-inner overflow-hidden shrink-0">
                  {activeChild.photo_url ? (
                    <img src={activeChild.photo_url} alt={activeChild.display_name} className="w-full h-full object-cover" />
                  ) : (
                    activeChild.display_name[0]
                  )}
                </div>
                <div className="flex flex-col text-right min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs sm:text-sm text-brand-text leading-tight truncate max-w-[65px] sm:max-w-[120px]">
                      {activeChild.display_name}
                    </span>
                    {isGuestActive && (
                      <span className="text-[9px] px-1 rounded-md bg-amber-100 text-amber-900 font-extrabold border border-amber-300 shrink-0">
                        ضيف
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-gray-400">
                    مستوى {activeChild.current_level}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 bg-amber-100 text-amber-800 px-1.5 sm:px-2 py-0.5 rounded-xl text-[11px] font-bold shrink-0">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>{activeChild.total_points}</span>
                </div>
              </div>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`btn-child !min-h-[38px] !min-w-[38px] w-9 h-9 sm:w-10 sm:h-10 !rounded-xl border shrink-0 ${
                isMuted
                  ? 'bg-gray-100 border-gray-300 text-gray-400'
                  : 'bg-brand-yellow/20 border-brand-yellow/50 text-amber-800'
              }`}
              title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Role-Specific Actions */}
            {sessionRole === 'child' ? (
              <button
                onClick={handleLogout}
                title={isGuestActive ? 'إنهاء جلسة الضيف' : 'خروج الطفل'}
                className="btn-child !min-h-[38px] px-2.5 sm:px-3.5 !rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{isGuestActive ? 'إنهاء اللعب' : 'خروج'}</span>
              </button>
            ) : user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Link
                  to="/parent"
                  className={`btn-child !min-h-[38px] px-2.5 sm:px-3.5 !rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 ${
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
                    className={`btn-child !min-h-[38px] px-2.5 sm:px-3 !rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 ${
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
                  className="btn-child !min-h-[38px] !min-w-[38px] w-9 h-9 sm:w-10 sm:h-10 !rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  onClick={() => setIsDirectPlayOpen(true)}
                  className="btn-child !min-h-[38px] px-2.5 sm:px-3.5 !rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-black text-xs shadow-sm flex items-center gap-1 border border-amber-300 shrink-0"
                >
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-950 text-amber-950 shrink-0" />
                  <span className="whitespace-nowrap">لعب فوري</span>
                </button>
                <Link
                  to="/child-login"
                  className="btn-child !min-h-[38px] px-2.5 sm:px-3.5 !rounded-xl bg-brand-turquoise text-white text-xs font-bold hover:bg-opacity-95 shadow-sm flex items-center gap-1 shrink-0"
                  title="دخول الطفل المسجل"
                >
                  <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">دخول مسجل</span>
                </Link>
                <Link
                  to="/login"
                  className="btn-child !min-h-[38px] px-2 sm:px-3 !rounded-xl bg-brand-purple text-white text-xs font-bold hover:bg-opacity-95 shadow-sm flex items-center gap-1 shrink-0"
                  title="لوحة ولي الأمر"
                >
                  <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">ولي الأمر</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

