import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ForgotPasswordModal from './ForgotPasswordModal';
import { Smartphone, Lock, LogIn, UserPlus, AlertCircle, HelpCircle } from 'lucide-react';

const LoginPage = ({ onNavigateToRegister }) => {
  const { login, language, setLanguage } = useContext(AuthContext);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  // Translation dictionary
  const t = {
    brandTitle: language === 'bn' ? 'সহজ উপায়ে মুরগি খামার পরিচালনা করুন' : 'Manage your poultry farm the simple way',
    brandDesc: language === 'bn' 
      ? 'খামারের খাবার, ওষুধ এবং ডিমের হিসাব রাখুন খুব সহজে। ছবি ও চিহ্নের মাধ্যমে সহজে ব্যবহার করুন।' 
      : 'Keep track of farm feed, medicine, and egg logs effortlessly. Designed with clear signs and icons.',
    brandSubDesc: language === 'bn' 
      ? 'সহজ ভিজ্যুয়াল আইকন এবং চিহ্নের মাধ্যমে খামার পরিচালনা করুন।' 
      : 'Easily manage your poultry farm using simple visual icons.',
    loginTitle: language === 'bn' ? 'লগইন করুন' : 'Log In',
    loginSubtitle: language === 'bn' 
      ? 'আপনার অ্যাকাউন্টে প্রবেশ করতে মোবাইল নম্বর ও পাসওয়ার্ড দিন।' 
      : 'Enter your mobile number and password to access your account.',
    mobileLabel: language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number',
    mobilePlaceholder: language === 'bn' ? '০১৭১২৩৪৫৬৭৮' : '01712345678',
    mobileHelp: language === 'bn' ? 'নিবন্ধনকৃত ১১ ডিজিটের মোবাইল নম্বরটি লিখুন।' : 'Enter your registered 11-digit mobile number.',
    passwordLabel: language === 'bn' ? 'পাসওয়ার্ড' : 'Password',
    forgotPassLink: language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?',
    loginBtn: language === 'bn' ? 'প্রবেশ করুন' : 'Log In',
    noAccountText: language === 'bn' ? 'নতুন খামারী বা একাউন্ট নেই?' : 'New farmer or no account yet?',
    registerBtn: language === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create Account',
    invalidMobileErr: language === 'bn'
      ? 'মোবাইল নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে এবং ০১ দিয়ে শুরু হতে হবে।'
      : 'Mobile number must be 11 digits and start with 01.',
    emptyPassErr: language === 'bn'
      ? 'পাসওয়ার্ড দিন।'
      : 'Please enter your password.',
    footerText: language === 'bn' ? 'সকল অধিকার সংরক্ষিত।' : 'All rights reserved.'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^01\d{9}$/.test(mobile)) {
      setError(t.invalidMobileErr);
      return;
    }

    if (!password) {
      setError(t.emptyPassErr);
      return;
    }

    setLoading(true);
    const result = await login(mobile, password);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-gradient-to-br from-farm-neonTeal via-farm-green to-farm-deepBlue bg-[length:200%_200%] animate-gradient-x relative overflow-hidden">
      
      {/* Global Language Selector (floating in top right for all screens) */}
      <div className="absolute top-4 right-4 z-40 flex items-center glass-panel p-1 rounded-2xl">
        <button
          onClick={() => setLanguage('bn')}
          className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide transition-all ${
            language === 'bn' 
              ? 'bg-gradient-to-r from-farm-green to-farm-darkGreen text-white shadow-md shadow-emerald-700/10' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          বাংলা
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide transition-all ${
            language === 'en' 
              ? 'bg-gradient-to-r from-farm-green to-farm-darkGreen text-white shadow-md shadow-emerald-700/10' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          English
        </button>
      </div>

      {/* Visual branding banner left pane */}
      <div className="w-full md:w-1/2 text-white p-8 sm:p-12 md:p-16 flex flex-col justify-between items-center text-center md:text-left md:items-start relative overflow-hidden min-h-[350px] md:min-h-screen bg-black/10 backdrop-blur-md">
        
        {/* Animated background shapes */}
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-farm-vividAmber/30 blur-3xl animate-float-slow"></div>
        <div className="absolute top-10 right-10 w-80 h-80 rounded-full bg-farm-brightCoral/30 blur-3xl animate-pulse-ring"></div>

        {/* Top Header Logo */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-3xl animate-float select-none">
            🐔
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">AgriMind</h1>
            <span className="text-emerald-100 text-xs font-bold uppercase tracking-widest block">
              {language === 'bn' ? 'কৃষি ও খামার' : 'Smart Poultry'}
            </span>
          </div>
        </div>

        {/* Big poultry welcome illustration and headlines */}
        <div className="my-auto max-w-md py-6">
          <div className="text-5xl sm:text-6xl mb-6 select-none">🐣🌾</div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-4 text-white">
            {t.brandTitle}
          </h2>
          <p className="text-emerald-55 text-sm sm:text-base font-semibold leading-relaxed">
            {t.brandDesc}
          </p>
          <div className="mt-2.5 text-xs text-emerald-200 font-medium">
            {t.brandSubDesc}
          </div>
        </div>

        {/* Bottom footer credit */}
        <div className="text-xs text-emerald-205 font-bold mt-4">
          © {new Date().getFullYear()} AgriMind App. {t.footerText}
        </div>
      </div>

      {/* Login Form pane */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-12 relative z-10 min-h-[450px] md:min-h-screen">
        <div className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 rounded-3xl">
          
          {/* Header titles */}
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center md:justify-start gap-2">
              <span>{t.loginTitle}</span>
              <span className="text-farm-green">🔑</span>
            </h2>
            <p className="text-sm font-semibold text-slate-500 mt-2">
              {t.loginSubtitle}
            </p>
          </div>

          {/* Error notifications */}
          {error && (
            <div className="flex items-start gap-3 p-4 text-sm text-red-750 bg-red-50 border-l-4 border-red-500 rounded-r-2xl animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="font-bold whitespace-pre-line leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Phone Number Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Smartphone className="w-4.5 h-4.5 text-farm-green" />
                {t.mobileLabel}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-bold select-none text-base">
                  +৮৮
                </span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder={t.mobilePlaceholder}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-white/50 bg-white/60 focus:bg-white focus:border-farm-neonTeal focus:ring-0 focus:outline-none font-bold text-lg tracking-wider placeholder-slate-400 transition-all shadow-sm"
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-slate-400 font-medium">{t.mobileHelp}</p>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-4.5 h-4.5 text-farm-warm" />
                  {t.passwordLabel}
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-xs font-bold text-farm-poultry hover:text-farm-warm transition-colors flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {t.forgotPassLink}
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-white/50 bg-white/60 focus:bg-white focus:border-farm-neonTeal focus:ring-0 focus:outline-none font-medium text-lg tracking-widest placeholder-slate-400 transition-all shadow-sm"
                required
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-farm-neonTeal to-farm-deepBlue hover:scale-[1.02] hover:shadow-xl hover:shadow-farm-neonTeal/40 text-white font-extrabold text-lg rounded-2xl active:scale-95 transition-all duration-300 flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>{t.loginBtn}</span>
                </>
              )}
            </button>
          </form>

          {/* Registration Navigation */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-slate-500 font-semibold text-sm">
              {t.noAccountText}
            </p>
            <button
              onClick={onNavigateToRegister}
              className="mt-2.5 inline-flex items-center gap-2 px-6 py-2.5 border-2 border-farm-warm/40 hover:border-farm-warm text-farm-darkWarm font-bold text-sm rounded-xl hover:bg-amber-50/50 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.registerBtn}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Forgot Password Flow Modal */}
      <ForgotPasswordModal 
        isOpen={isForgotOpen} 
        onClose={() => setIsForgotOpen(false)} 
      />
    </div>
  );
};

export default LoginPage;
