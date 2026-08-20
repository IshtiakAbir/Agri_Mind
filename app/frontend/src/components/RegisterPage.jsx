import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Smartphone, Lock, UserPlus, LogIn, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

const RegisterPage = ({ onNavigateToLogin }) => {
  const { register, user: currentUser, language } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('farmer'); // 'farmer' or 'employee'
  const [accessCode, setAccessCode] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if register page is accessed by an Employee who is registering on behalf of someone else
  const isEmployeeRegistering = currentUser && currentUser.role === 'employee';

  // Translation dictionary
  const t = {
    brandTitle: language === 'bn' ? 'খামারের জন্য সঠিক হিসাব ও সমাধান' : 'Accurate logs & solutions for your farm',
    brandDesc: language === 'bn' 
      ? 'খুব সহজে কয়েক ক্লিকে অ্যাকাউন্ট তৈরি করুন। কর্মচারীরা খামারীদের হয়েও অ্যাকাউন্ট খুলে দিতে পারবেন।' 
      : 'Create an account in simple clicks. Employees can register on behalf of farmers.',
    brandSubDesc: language === 'bn' 
      ? 'কর্মচারীরা খামারীদের হয়েও অ্যাকাউন্ট খুলে দিতে পারবেন।' 
      : 'Employees can easily register accounts on behalf of farmers.',
    titleSelf: language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account',
    titleEmployee: language === 'bn' ? 'নতুন খামারী যোগ করুন' : 'Add New Farmer',
    subtitleSelf: language === 'bn' 
      ? 'আপনার সুরক্ষিত অ্যাকাউন্ট তৈরি করতে নিচের তথ্য দিন।' 
      : 'Enter details below to create your secure account.',
    subtitleEmployee: language === 'bn' 
      ? 'খামারীর জন্য নতুন খামারী অ্যাকাউন্ট যুক্ত করুন।' 
      : 'Register a new farmer account into the system.',
    nameLabel: language === 'bn' ? 'পূর্ণ নাম' : 'Full Name',
    namePlaceholder: language === 'bn' ? 'মোঃ রফিকুল ইসলাম' : 'Enter full name',
    nameLockWarning: language === 'bn' 
      ? '⚠️ নাম পরিবর্তন করা যাবে না (অফিশিয়াল ট্র্যাকিং এর জন্য)' 
      : '⚠️ Name cannot be changed (for official tracking)',
    mobileLabel: language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number',
    mobilePlaceholder: language === 'bn' ? '০১৭১২৩৪৫৬৭৮' : '01712345678',
    passwordLabel: language === 'bn' ? 'পাসওয়ার্ড' : 'Password',
    passwordPlaceholder: language === 'bn' ? 'কমপক্ষে ৬টি ডিজিট দিন' : 'Minimum 6 characters',
    accessCodeLabel: language === 'bn' ? 'কর্মচারী সিক্রেট কোড' : 'Employee Access Code',
    accessCodePlaceholder: language === 'bn' ? 'সিক্রেট কোডটি দিন' : 'Enter secret code',
    roleLabel: language === 'bn' ? 'আপনার ভূমিকা নির্বাচন করুন' : 'Select Your Role',
    roleFarmer: language === 'bn' ? 'খামারী' : 'Farmer',
    roleEmployee: language === 'bn' ? 'কর্মচারী' : 'Employee',
    employeeRegFarmerText: language === 'bn' ? 'খামারী অ্যাকাউন্ট সংযোজন' : 'Farmer Account Registration',
    employeeRegFarmerDesc: language === 'bn' 
      ? 'আপনি কর্মচারী হিসেবে এই খামারীর তথ্য নিবন্ধন করছেন।' 
      : 'You are registering this farmer as an authorized employee.',
    submitSelf: language === 'bn' ? 'নিবন্ধন করুন' : 'Register',
    submitEmployee: language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Farmer Account',
    hasAccountText: language === 'bn' ? 'ইতোমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?',
    loginBtn: language === 'bn' ? 'লগইন করুন' : 'Log In',
    errorEmptyName: language === 'bn' ? 'নাম লিখুন।' : 'Please enter full name.',
    errorInvalidMobile: language === 'bn' 
      ? 'মোবাইল নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে এবং ০১ দিয়ে শুরু হতে হবে।' 
      : 'Mobile number must be 11 digits and start with 01.',
    errorShortPassword: language === 'bn' 
      ? 'পাসওয়ার্ড কমপক্ষে ৬ ডিজিটের হতে হবে।' 
      : 'Password must be at least 6 characters.',
    errorEmptyAccessCode: language === 'bn' 
      ? 'কর্মচারী সিক্রেট কোডটি দিন।' 
      : 'Please enter the Employee Access Code.',
    successRegFarmer: language === 'bn' 
      ? 'খামারী অ্যাকাউন্ট সফলভাবে নিবন্ধিত হয়েছে!' 
      : 'Farmer account registered successfully!',
    successRegSelf: language === 'bn' 
      ? 'নিবন্ধন সফল হয়েছে! ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...' 
      : 'Registration successful! Redirecting to dashboard...',
    footerText: language === 'bn' ? 'সকল অধিকার সংরক্ষিত।' : 'All rights reserved.'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError(t.errorEmptyName);
      return;
    }

    if (!/^01\d{9}$/.test(mobile)) {
      setError(t.errorInvalidMobile);
      return;
    }

    if (password.length < 6) {
      setError(t.errorShortPassword);
      return;
    }

    if (role === 'employee' && !isEmployeeRegistering && !accessCode.trim()) {
      setError(t.errorEmptyAccessCode);
      return;
    }

    setLoading(true);
    const result = await register(name, mobile, password, role, accessCode);
    setLoading(false);

    if (result.success) {
      if (isEmployeeRegistering) {
        setSuccess(t.successRegFarmer);
        // Reset form
        setName('');
        setMobile('');
        setPassword('');
        setRole('farmer');
        setAccessCode('');
      } else {
        setSuccess(t.successRegSelf);
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row-reverse bg-gradient-to-br from-farm-neonTeal via-farm-vividAmber to-farm-deepBlue bg-[length:200%_200%] animate-gradient-x relative overflow-hidden">
      
      {/* Visual branding banner pane */}
      <div className="w-full md:w-1/2 text-white p-8 sm:p-12 md:p-16 flex flex-col justify-between items-center text-center md:text-left md:items-start relative overflow-hidden min-h-[350px] md:min-h-screen bg-black/10 backdrop-blur-md">
        
        {/* Decorative blur elements */}
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-farm-brightCoral/30 blur-3xl animate-float-slow"></div>
        <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-farm-neonTeal/30 blur-3xl animate-pulse-ring"></div>

        {/* Top Header Logo */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-3xl animate-float select-none">
            🐔
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">AgriMind</h1>
            <span className="text-amber-100 text-xs font-bold uppercase tracking-widest block">
              {language === 'bn' ? 'কৃষি ও খামার' : 'Smart Poultry'}
            </span>
          </div>
        </div>

        {/* Big visual tips */}
        <div className="my-auto max-w-md py-6">
          <div className="text-5xl sm:text-6xl mb-6 select-none">📝👩‍🌾</div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-4">
            {t.brandTitle}
          </h2>
          <p className="text-amber-55 text-sm sm:text-base font-semibold leading-relaxed">
            {t.brandDesc}
          </p>
          <div className="mt-2.5 text-xs text-amber-250 font-medium">
            {t.brandSubDesc}
          </div>
        </div>

        <div className="text-xs text-amber-200 font-bold mt-4">
          © {new Date().getFullYear()} AgriMind App. {t.footerText}
        </div>
      </div>

      {/* Register Form Pane */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-12 relative z-10 min-h-[450px] md:min-h-screen">
        <div className="w-full max-w-md space-y-7 glass-panel p-8 sm:p-10 rounded-3xl">
          
          {/* Header titles */}
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center md:justify-start gap-2">
              <span>{isEmployeeRegistering ? t.titleEmployee : t.titleSelf}</span>
              <span className="text-farm-warm">✨</span>
            </h2>
            <p className="text-sm font-semibold text-slate-500 mt-2">
              {isEmployeeRegistering ? t.subtitleEmployee : t.subtitleSelf}
            </p>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="flex items-start gap-3 p-4 text-sm text-red-750 bg-red-50 border-l-4 border-red-500 rounded-r-2xl animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="font-bold whitespace-pre-line leading-relaxed">{error}</div>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 p-4 text-sm text-emerald-700 bg-emerald-50 border-l-4 border-farm-green rounded-r-2xl animate-check">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-farm-green" />
              <div className="font-bold whitespace-pre-line leading-relaxed">{success}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-4.5 h-4.5 text-farm-green" />
                {t.nameLabel}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                className="w-full px-4 py-3 rounded-2xl border-2 border-white/50 bg-white/60 focus:bg-white focus:border-farm-neonTeal focus:ring-0 focus:outline-none font-semibold text-base placeholder-slate-400 transition-all shadow-sm"
                required
                disabled={loading}
              />
              
              {/* Important visual lock warning */}
              <div className="flex items-center gap-1.5 p-2.5 bg-amber-50 rounded-xl text-[11px] text-farm-darkWarm font-extrabold border border-amber-100/50">
                <ShieldAlert className="w-4 h-4 shrink-0 text-farm-poultry" />
                <span>{t.nameLockWarning}</span>
              </div>
            </div>

            {/* Mobile Number Field */}
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
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-white/50 bg-white/60 focus:bg-white focus:border-farm-neonTeal focus:ring-0 focus:outline-none font-bold text-lg tracking-wider placeholder-slate-400 transition-all shadow-sm"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-4.5 h-4.5 text-farm-warm" />
                {t.passwordLabel}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full px-4 py-3 rounded-2xl border-2 border-white/50 bg-white/60 focus:bg-white focus:border-farm-neonTeal focus:ring-0 focus:outline-none font-medium text-lg tracking-widest placeholder-slate-400 transition-all shadow-sm"
                required
                disabled={loading}
              />
            </div>

            {/* Employee Access Code Field (shown only for new employee signup) */}
            {role === 'employee' && !isEmployeeRegistering && (
              <div className="space-y-1.5 animate-check">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-4.5 h-4.5 text-farm-warm" />
                  {t.accessCodeLabel}
                </label>
                <input
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder={t.accessCodePlaceholder}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-white/50 bg-white/60 focus:bg-white focus:border-farm-neonTeal focus:ring-0 focus:outline-none font-semibold text-base placeholder-slate-400 transition-all shadow-sm"
                  required
                  disabled={loading}
                />
              </div>
            )}

            {/* Role Selection Visual Toggles (Farmer vs Employee) */}
            {!isEmployeeRegistering ? (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  {t.roleLabel}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Farmer Card */}
                  <div
                    onClick={() => !loading && setRole('farmer')}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center ${
                      role === 'farmer'
                        ? 'border-farm-neonTeal bg-white/80 shadow-lg shadow-farm-neonTeal/20 scale-105'
                        : 'border-white/50 hover:border-white hover:bg-white/50 bg-white/30 hover:scale-[1.02]'
                    }`}
                  >
                    <span className="text-4xl mb-2 filter drop-shadow select-none">🐔</span>
                    <span className="font-extrabold text-slate-800 text-sm">{t.roleFarmer}</span>
                  </div>

                  {/* Employee Card */}
                  <div
                    onClick={() => !loading && setRole('employee')}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center ${
                      role === 'employee'
                        ? 'border-farm-vividAmber bg-white/80 shadow-lg shadow-farm-vividAmber/20 scale-105'
                        : 'border-white/50 hover:border-white hover:bg-white/50 bg-white/30 hover:scale-[1.02]'
                    }`}
                  >
                    <span className="text-4xl mb-2 filter drop-shadow select-none">💼</span>
                    <span className="font-extrabold text-slate-800 text-sm">{t.roleEmployee}</span>
                  </div>

                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-3xl select-none">🧑‍🌾</span>
                <div>
                  <h4 className="font-extrabold text-farm-darkGreen text-sm">{t.employeeRegFarmerText}</h4>
                  <p className="text-xs font-semibold text-emerald-700">{t.employeeRegFarmerDesc}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-farm-neonTeal to-farm-deepBlue hover:scale-[1.02] hover:shadow-xl hover:shadow-farm-neonTeal/40 text-white font-extrabold text-lg rounded-2xl active:scale-95 transition-all duration-300 flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span>{isEmployeeRegistering ? t.submitEmployee : t.submitSelf}</span>
              )}
            </button>
          </form>

          {/* Navigation to Login */}
          {!isEmployeeRegistering && (
            <div className="pt-2 border-t border-slate-100 text-center">
              <p className="text-slate-500 font-semibold text-sm">
                {t.hasAccountText}
              </p>
              <button
                onClick={onNavigateToLogin}
                className="mt-2.5 inline-flex items-center gap-2 px-6 py-2.5 border-2 border-farm-green/40 hover:border-farm-green text-farm-darkGreen font-bold text-sm rounded-xl hover:bg-emerald-50/50 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>{t.loginBtn}</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
