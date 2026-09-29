/**
 * =============================================================================
 * Module: Login Page
 * Authorship: Full-Stack Web Team (agrimind-main) — Redesigned for Unified Platform
 * Component: /app/frontend/src/components/LoginPage.jsx
 * Description: Premium dark-themed login with bilingual support, mobile input,
 *              password field, and smooth micro-animations.
 * =============================================================================
 */

import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  Feather,
  Smartphone,
  Lock,
  LogIn,
  UserPlus,
  AlertCircle,
  Globe,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

const LoginPage = ({ onNavigateToRegister, onSkip }) => {
  const { login, language, toggleLanguage } = useContext(AuthContext);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = {
    brandTitle: language === 'bn' ? 'সহজ উপায়ে মুরগি খামার পরিচালনা করুন' : 'Manage your poultry farm the smart way',
    brandDesc: language === 'bn'
      ? 'খামারের খাবার, ওষুধ এবং ডিমের হিসাব রাখুন খুব সহজে। AI-চালিত রোগ নির্ণয় ও লাভ পূর্বাভাস।'
      : 'AI-powered disease diagnostics, automated profit forecasting, and a marketplace — all in one platform.',
    loginTitle: language === 'bn' ? 'লগইন করুন' : 'Welcome Back',
    loginSubtitle: language === 'bn'
      ? 'আপনার অ্যাকাউন্টে প্রবেশ করতে মোবাইল নম্বর ও পাসওয়ার্ড দিন।'
      : 'Sign in with your mobile number and password.',
    mobileLabel: language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number',
    mobilePlaceholder: language === 'bn' ? '০১৭১২৩৪৫৬৭৮' : '01712345678',
    passwordLabel: language === 'bn' ? 'পাসওয়ার্ড' : 'Password',
    passwordPlaceholder: language === 'bn' ? 'আপনার পাসওয়ার্ড দিন' : 'Enter your password',
    loginBtn: language === 'bn' ? 'প্রবেশ করুন' : 'Sign In',
    noAccountText: language === 'bn' ? 'নতুন খামারী?' : "Don't have an account?",
    registerBtn: language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account',
    demoAccess: language === 'bn' ? 'লগইন ছাড়া সরাসরি প্রবেশ করুন →' : 'Instant Guest Access (No Login) →',
    demoFarmerBtn: language === 'bn' ? '🧑‍🌾 খামারী' : '🧑‍🌾 Farmer',
    demoStaffBtn: language === 'bn' ? '💼 স্টাফ' : '💼 Staff',
    demoAdminBtn: language === 'bn' ? '🛡️ অ্যাডমিন' : '🛡️ Admin',
    invalidMobileErr: language === 'bn'
      ? 'মোবাইল নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে এবং ০১ দিয়ে শুরু হতে হবে।'
      : 'Mobile number must be 11 digits and start with 01.',
    emptyPassErr: language === 'bn' ? 'পাসওয়ার্ড দিন।' : 'Please enter your password.',
    features: language === 'bn'
      ? ['AI রোগ নির্ণয়', 'ML লাভ পূর্বাভাস', 'খামার মার্কেটপ্লেস']
      : ['AI Disease Detection', 'ML Profit Forecasting', 'Farm Marketplace']
  };

  const handleQuickLogin = async (demoMobile, demoPassword) => {
    setMobile(demoMobile);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    const result = await login(demoMobile, demoPassword);
    setLoading(false);
    if (!result.success) {
      setError(result.message);
    }
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[100px] pointer-events-none" />

      {/* Language toggle (top-right, always visible) */}
      <button
        onClick={toggleLanguage}
        className="absolute top-5 right-5 z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-xs font-bold text-slate-300 transition-all backdrop-blur-md"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-400" />
        <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
      </button>

      {/* Left Branding Panel */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center lg:items-start p-8 sm:p-12 lg:p-16 relative">
        {/* Logo */}
        <div className="flex items-center gap-3.5 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-900/40">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Feather className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">AgriMind</h1>
            <span className="text-[11px] font-semibold text-emerald-400/70 uppercase tracking-widest">
              {language === 'bn' ? 'স্মার্ট পোল্ট্রি' : 'Smart Poultry'}
            </span>
          </div>
        </div>

        {/* Big headline */}
        <div className="max-w-md text-center lg:text-left mb-8">
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold leading-tight text-slate-100 mb-4">
            {t.brandTitle}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
            {t.brandDesc}
          </p>
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start">
          {t.features.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs font-semibold text-emerald-300"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* Bottom credit (desktop only) */}
        <div className="hidden lg:block mt-auto pt-12 text-xs text-slate-600 font-medium">
          © {new Date().getFullYear()} AgriMind — Unified Poultry Intelligence Platform
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-[420px] space-y-7">

          {/* Glass card */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-8 sm:p-10 shadow-2xl shadow-slate-950/50 space-y-6">

            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">{t.loginTitle}</h2>
              <p className="text-sm text-slate-400 mt-1.5 font-medium">{t.loginSubtitle}</p>
            </div>

            {/* Error alert */}
            {error && (
              <div className="flex items-start gap-3 p-3.5 text-sm bg-rose-500/10 border border-rose-500/25 rounded-xl animate-fade-in">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-400" />
                <span className="text-rose-300 font-semibold text-xs leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Mobile Number */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  {t.mobileLabel}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 font-bold text-sm select-none pointer-events-none">
                    +88
                  </span>
                  <input
                    id="login-mobile"
                    type="tel"
                    inputMode="numeric"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder={t.mobilePlaceholder}
                    className="w-full pl-14 pr-4 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none text-slate-100 text-base font-semibold tracking-wider placeholder-slate-600 transition-all"
                    autoComplete="tel"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  {t.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full px-4 pr-12 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none text-slate-100 text-base font-medium placeholder-slate-600 transition-all"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-xl active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/30 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4.5 h-4.5" />
                    <span>{t.loginBtn}</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Logins & Instant Guest Access */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>⚡ {language === 'bn' ? 'দ্রুত প্রবেশ:' : 'Quick Sign In:'}</span>
                <span className="text-[10px] text-slate-500 font-mono">pass: password123</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('01712345678', 'password123')}
                  disabled={loading}
                  className="px-2 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-500/50 text-[11px] font-bold text-emerald-300 transition-all text-center flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Login as Mohammad Rahman (01712345678 / password123)"
                >
                  <span>{t.demoFarmerBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('01800000000', 'password123')}
                  disabled={loading}
                  className="px-2 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 hover:border-teal-500/50 text-[11px] font-bold text-teal-300 transition-all text-center flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Login as Staff Officer (01800000000 / password123)"
                >
                  <span>{t.demoStaffBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('01999999999', 'password123')}
                  disabled={loading}
                  className="px-2 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 hover:border-amber-400 text-[11px] font-bold text-amber-300 transition-all text-center flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                  title="Login as Admin (01999999999 / password123)"
                >
                  <span>{t.demoAdminBtn}</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-400 bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 font-mono flex flex-wrap items-center justify-between gap-1">
                <span>🛡️ Admin: <strong className="text-amber-400">01999999999</strong></span>
                <span>Pass: <strong className="text-emerald-400">password123</strong></span>
              </div>

              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.demoAccess}</span>
                </button>
              )}
            </div>

          </div>

          {/* Register navigation */}
          <div className="text-center space-y-3 pt-2">
            <p className="text-sm text-slate-500 font-medium">{t.noAccountText}</p>
            <button
              onClick={onNavigateToRegister}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-700 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 font-bold text-xs transition-all hover:bg-emerald-500/5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.registerBtn}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
