/**
 * =============================================================================
 * Module: Registration Page
 * Authorship: Full-Stack Web Team (agrimind-main) — Redesigned for Unified Platform
 * Component: /app/frontend/src/components/RegisterPage.jsx
 * Description: Premium dark-themed registration with role selection (Farmer/Employee),
 *              bilingual support, validated inputs, and animated micro-interactions.
 * =============================================================================
 */

import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  Feather,
  User,
  Smartphone,
  Lock,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Globe,
  Eye,
  EyeOff,
  ShieldCheck,
  Tractor,
  Sparkles
} from 'lucide-react';

const RegisterPage = ({ onNavigateToLogin }) => {
  const { register, language, toggleLanguage } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('farmer');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const t = {
    title: language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account',
    subtitle: language === 'bn'
      ? 'আপনার সুরক্ষিত অ্যাকাউন্ট তৈরি করতে নিচের তথ্য দিন।'
      : 'Fill in the details below to get started.',
    nameLabel: language === 'bn' ? 'পূর্ণ নাম' : 'Full Name',
    namePlaceholder: language === 'bn' ? 'আপনার নাম লিখুন' : 'Enter your full name',
    nameWarning: language === 'bn'
      ? '⚠️ নাম পরে পরিবর্তন করা যাবে না'
      : '⚠️ Name cannot be changed later',
    mobileLabel: language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number',
    mobilePlaceholder: language === 'bn' ? '০১৭১২৩৪৫৬৭৮' : '01712345678',
    passwordLabel: language === 'bn' ? 'পাসওয়ার্ড' : 'Password',
    passwordPlaceholder: language === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'Minimum 6 characters',
    confirmLabel: language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password',
    confirmPlaceholder: language === 'bn' ? 'পাসওয়ার্ড আবার লিখুন' : 'Re-enter password',
    roleLabel: language === 'bn' ? 'আপনার ভূমিকা' : 'Your Role',
    roleFarmer: language === 'bn' ? '🧑‍🌾 খামারী' : '🧑‍🌾 Farmer',
    roleEmployee: language === 'bn' ? '💼 কর্মচারী' : '💼 Employee',
    registerBtn: language === 'bn' ? 'নিবন্ধন করুন' : 'Create Account',
    hasAccount: language === 'bn' ? 'ইতোমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?',
    loginBtn: language === 'bn' ? 'লগইন করুন' : 'Sign In',
    errName: language === 'bn' ? 'নাম লিখুন।' : 'Please enter your full name.',
    errMobile: language === 'bn'
      ? 'মোবাইল নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে এবং ০১ দিয়ে শুরু হতে হবে।'
      : 'Mobile number must be 11 digits and start with 01.',
    errPassword: language === 'bn'
      ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
      : 'Password must be at least 6 characters.',
    errConfirm: language === 'bn'
      ? 'পাসওয়ার্ড দুটি মেলেনি।'
      : 'Passwords do not match.',
    successMsg: language === 'bn'
      ? 'নিবন্ধন সফল! ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...'
      : 'Registration successful! Redirecting...'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError(t.errName);
      return;
    }
    if (!/^01\d{9}$/.test(mobile)) {
      setError(t.errMobile);
      return;
    }
    if (password.length < 6) {
      setError(t.errPassword);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.errConfirm);
      return;
    }

    setLoading(true);
    const result = await register(name.trim(), mobile, password, role);
    setLoading(false);

    if (result.success) {
      setSuccess(t.successMsg);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-150px] left-[-150px] w-[450px] h-[450px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

      {/* Language toggle */}
      <button
        onClick={toggleLanguage}
        className="absolute top-5 right-5 z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-xs font-bold text-slate-300 transition-all backdrop-blur-md"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-400" />
        <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
      </button>

      {/* Left Branding Panel */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center items-center lg:items-start p-8 sm:p-12 lg:p-16 relative">
        {/* Logo */}
        <div className="flex items-center gap-3.5 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-900/40">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Feather className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">AgriMind</h1>
            <span className="text-[11px] font-semibold text-emerald-400/70 uppercase tracking-widest">
              {language === 'bn' ? 'অ্যাকাউন্ট তৈরি' : 'Join Platform'}
            </span>
          </div>
        </div>

        <div className="max-w-sm text-center lg:text-left space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight text-slate-100">
            {language === 'bn' ? 'খামারের জন্য সঠিক হিসাব ও সমাধান' : 'Accurate logs & solutions for your farm'}
          </h2>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">
            {language === 'bn'
              ? 'খুব সহজে কয়েক ক্লিকে অ্যাকাউন্ট তৈরি করুন।'
              : 'Create your secure account in a few clicks and unlock the full platform.'}
          </p>
        </div>

        <div className="hidden lg:block mt-auto pt-12 text-xs text-slate-600 font-medium">
          © {new Date().getFullYear()} AgriMind — Unified Poultry Intelligence Platform
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-[460px]">

          {/* Glass card */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-7 sm:p-9 shadow-2xl shadow-slate-950/50 space-y-5">

            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">{t.title}</h2>
              <p className="text-sm text-slate-400 mt-1 font-medium">{t.subtitle}</p>
            </div>

            {/* Error alert */}
            {error && (
              <div className="flex items-start gap-3 p-3.5 text-xs bg-rose-500/10 border border-rose-500/25 rounded-xl animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="text-rose-300 font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            {/* Success alert */}
            {success && (
              <div className="flex items-start gap-3 p-3.5 text-xs bg-emerald-500/10 border border-emerald-500/25 rounded-xl animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold leading-relaxed">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Role Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t.roleLabel}</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('farmer')}
                    className={`py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border ${
                      role === 'farmer'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-900/20'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Tractor className="w-4 h-4" />
                    <span>{t.roleFarmer}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('employee')}
                    className={`py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border ${
                      role === 'employee'
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-900/20'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t.roleEmployee}</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-violet-400" />
                  {t.nameLabel}
                </label>
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none text-slate-100 text-base font-medium placeholder-slate-600 transition-all"
                  autoComplete="name"
                  required
                  disabled={loading}
                />
                <p className="text-[11px] text-amber-400/70 font-medium">{t.nameWarning}</p>
              </div>

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
                    id="register-mobile"
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
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full px-4 pr-12 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none text-slate-100 text-base font-medium placeholder-slate-600 transition-all"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  {t.confirmLabel}
                </label>
                <input
                  id="register-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.confirmPlaceholder}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none text-slate-100 text-base font-medium placeholder-slate-600 transition-all"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-xl active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/30 disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4.5 h-4.5" />
                    <span>{t.registerBtn}</span>
                  </>
                )}
              </button>
            </form>
          </div>

              {/* Login navigation */}
              <div className="text-center space-y-3 pt-5">
                <p className="text-sm text-slate-500 font-medium">{t.hasAccount}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    onClick={onNavigateToLogin}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-700 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 font-bold text-xs transition-all hover:bg-emerald-500/5 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t.loginBtn}</span>
                  </button>
                </div>
              </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
