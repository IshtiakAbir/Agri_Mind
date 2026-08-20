import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { X, Smartphone, ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const { forgotPassword, resetPassword, language } = useContext(AuthContext);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: request, 2: reset
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Translation dictionary
  const t = {
    title: language === 'bn' ? 'পাসওয়ার্ড রিসেট করুন' : 'Reset Password',
    mobileLabel: language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number',
    mobileHelp: language === 'bn' ? 'উদাহরণঃ ০১৭১২৩৪৫৬৭৮ (১১ ডিজিট)' : 'Example: 01712345678 (11 digits)',
    requestBtn: language === 'bn' ? 'কোড পাঠান' : 'Send Code',
    resetBtn: language === 'bn' ? 'রিসেট করুন' : 'Reset Password',
    reenterMobile: language === 'bn' ? 'মোবাইল নম্বর আবার লিখুন' : 'Re-enter Mobile Number',
    codeLabel: language === 'bn' ? 'সিকিউরিটি কোড' : 'Security Code',
    codePlaceholder: language === 'bn' ? '৬-সংখ্যার কোড লিখুন' : 'Enter 6-digit code',
    newPasswordLabel: language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password',
    newPasswordPlaceholder: language === 'bn' ? 'কমপক্ষে ৬টি অক্ষর' : 'At least 6 characters',
    step1Info: language === 'bn' 
      ? 'নিবন্ধিত মোবাইল নম্বরটি লিখুন। আপনার ফোনে একটি ৬-সংখ্যার কোড পাঠানো হবে।' 
      : 'Enter your registered mobile number. We will send a 6-digit verification code.',
    devNotice: language === 'bn'
      ? '🔒 ডেভলপার নোট: কোডটি আপনার ব্যাকএন্ড কনসোলে লগ করা হয়েছে।'
      : '🔒 Developer Note: The code is logged in the backend server console.',
    invalidMobileErr: language === 'bn'
      ? 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)।'
      : 'Please enter a valid 11-digit mobile number starting with 01.',
    emptyCodeErr: language === 'bn'
      ? 'কোড নম্বরটি দিন।'
      : 'Please enter the security code.',
    shortPassErr: language === 'bn'
      ? 'পাসওয়ার্ড কমপক্ষে ৬ ডিজিটের হতে হবে।'
      : 'Password must be at least 6 characters.'
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!/^01\d{9}$/.test(mobile)) {
      setError(t.invalidMobileErr);
      return;
    }

    setSubmitting(true);
    const result = await forgotPassword(mobile);
    setSubmitting(false);

    if (result.success) {
      setSuccess(language === 'bn' 
        ? 'কোড পাঠানো হয়েছে। ব্যাকএন্ড কনসোল চেক করুন।' 
        : 'Security code sent. Check backend server console.'
      );
      setStep(2);
    } else {
      setError(result.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp) {
      setError(t.emptyCodeErr);
      return;
    }
    if (newPassword.length < 6) {
      setError(t.shortPassErr);
      return;
    }

    setSubmitting(true);
    const result = await resetPassword(mobile, otp, newPassword);
    setSubmitting(false);

    if (result.success) {
      setSuccess(language === 'bn' 
        ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! লগইন করুন।' 
        : 'Password reset successful! Redirecting to login...'
      );
      setTimeout(() => {
        onClose();
        // Reset modal state
        setMobile('');
        setOtp('');
        setNewPassword('');
        setStep(1);
        setSuccess('');
      }, 3000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl shadow-2xl border border-slate-100 animate-check">
        
        {/* Top Header Graphic */}
        <div className="h-2 bg-gradient-to-r from-farm-green to-farm-warm"></div>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header Title with Lock Icon */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="p-3 bg-amber-50 rounded-full text-farm-warm mb-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              {t.title}
            </h3>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 mb-4 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="font-semibold whitespace-pre-line leading-relaxed">{error}</div>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 p-3.5 mb-4 text-sm text-emerald-700 bg-emerald-50 border-l-4 border-farm-green rounded-r-xl">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-farm-green" />
              <div className="font-semibold whitespace-pre-line leading-relaxed">{success}</div>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Enter mobile to request SMS Code */
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="text-center text-sm text-slate-600 leading-relaxed mb-2 font-medium">
                {t.step1Info}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-farm-green" />
                  {t.mobileLabel}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold select-none text-base">
                    +৮৮
                  </span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="01712345678"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-farm-green focus:ring-0 focus:outline-none font-bold text-lg tracking-wider placeholder-slate-350 transition-colors"
                    required
                    disabled={submitting}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-400 font-medium">
                  {t.mobileHelp}
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-farm-green to-farm-darkGreen hover:from-farm-darkGreen hover:to-farm-green text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-700/10 hover:shadow-emerald-700/20 active:scale-98 transition-all flex justify-center items-center gap-2"
              >
                {submitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>{t.requestBtn}</span>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: Enter code (OTP) and new password */
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center text-xs text-amber-800 font-semibold leading-relaxed">
                {t.devNotice}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-farm-warm" />
                  {t.codeLabel}
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder={t.codePlaceholder}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-farm-warm focus:ring-0 focus:outline-none font-bold text-center text-xl tracking-widest placeholder-slate-300 transition-colors"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-farm-green" />
                  {t.newPasswordLabel}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.newPasswordPlaceholder}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-farm-green focus:ring-0 focus:outline-none font-semibold placeholder-slate-300 transition-colors"
                  required
                  disabled={submitting}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-farm-warm to-farm-poultry hover:from-farm-poultry hover:to-farm-warm text-white font-extrabold rounded-2xl shadow-lg shadow-amber-600/10 hover:shadow-amber-600/20 active:scale-98 transition-all flex justify-center items-center gap-2"
              >
                {submitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>{t.resetBtn}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-700 underline transition-colors"
              >
                {t.reenterMobile}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
