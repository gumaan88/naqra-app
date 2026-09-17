import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Play, Shield, WifiOff, Award, ChevronLeft, BookOpen, Layers } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-68px)] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 px-4 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-yellow/40 text-amber-950 font-bold text-sm mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>منصة تعليم القراءة العربية الممتعة للأطفال</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-brand-text tracking-tight mb-6 leading-tight">
          نَقْرَأُ مَعاً.. <br />
          <span className="text-brand-turquoise">حَرْفاً بحَرْفٍ</span> وفِكْرَةً بِفِكْرَة!
        </h1>

        <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          رحلة بصرية وصوتية تفاعلية تساعد طفلك على قراءة الكلمات العربية، واكتشاف حروفها بالترتيب، وربطها بالصور الجميلة بكل ثقة ومرح.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <Link
            to="/child-login"
            className="btn-child w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-turquoise to-[#22B8AE] hover:from-[#1F9A92] hover:to-brand-turquoise text-white text-xl shadow-lg shadow-brand-turquoise/30 flex items-center justify-center gap-3"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>هَيّا نَلْعَبْ وَنَقْرَأ!</span>
          </Link>

          <Link
            to="/login"
            className="btn-child w-full sm:w-auto px-6 py-4 bg-white border-2 border-brand-purple/40 text-brand-purple hover:bg-purple-50 text-base shadow-md flex items-center justify-center gap-2"
          >
            <span>لوحة ولي الأمر</span>
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* Games Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
          {/* Game 1 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-brand-turquoise/30 shadow-md hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-24 h-24 bg-brand-turquoise/10 rounded-br-full -z-0" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-brand-turquoise/20 text-brand-turquoise flex items-center justify-center font-black text-2xl mb-4">
                أ ب
              </div>
              <h2 className="text-2xl font-extrabold text-brand-text mb-2">حروف الكلمة</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                يقرأ الطفل الكلمة كاملة، ثم يختار حروفها بالترتيب من بين بطاقات تفاعلية مميزة مع حروف مشتتة تعزز الانتباه.
              </p>
              <div className="flex items-center gap-2 text-sm font-bold text-brand-turquoise">
                <span>تدرج من حرفين إلى 6 أحرف</span>
                <span>•</span>
                <span>مساعدات ذكية بعد 3 أخطاء</span>
              </div>
            </div>
          </div>

          {/* Game 2 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-brand-coral/30 shadow-md hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-24 h-24 bg-brand-coral/10 rounded-br-full -z-0" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-brand-coral/20 text-brand-coral flex items-center justify-center font-black text-2xl mb-4">
                🖼️
              </div>
              <h2 className="text-2xl font-extrabold text-brand-text mb-2">الكلمة والصورة</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                يربط الطفل الكلمة المكتوبة بالصورة المعبرة عنها من بين خيارات بصرية واضحة وجذابة تلائم مرحلته العمرية.
              </p>
              <div className="flex items-center gap-2 text-sm font-bold text-brand-coral">
                <span>صور متجهة نظيفة وغير مشتتة</span>
                <span>•</span>
                <span>تعزيز الفهم القرائي</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Educational Principles Banner */}
      <section className="bg-white border-t border-brand-turquoise/20 py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-brand-text mb-1">خصوصية وأمان 100%</h3>
            <p className="text-sm text-gray-500">خالٍ تماماً من الإعلانات وأدوات التتبع، مصمم كبيئة عائلية نقية.</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-brand-turquoise flex items-center justify-center mb-3">
              <WifiOff className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-brand-text mb-1">يعمل دون انقطاع (Offline)</h3>
            <p className="text-sm text-gray-500">تحميل الحزمة مسبقاً يضمن استمرار لعب الطفل حتى لو ضعف أو انقطع الإنترنت.</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-brand-purple flex items-center justify-center mb-3">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-brand-text mb-1">تقارير نمو مستقلة</h3>
            <p className="text-sm text-gray-500">إحصاءات تفصيلية لولي الأمر تقيس تطور كل طفل بمفرده دون مقارنات تنافسية.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-500 bg-brand-bg">
        منصة نقرأ © 2026 — مصممة بكل عناية لتعلم القراءة العربية السليمة
      </footer>
    </div>
  );
};
