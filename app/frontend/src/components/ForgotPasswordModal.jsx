/**
 * =============================================================================
 * Module: Forgot Password Modal
 * Authorship: Full-Stack Web Team (agrimind-main)
 * Component: /app/frontend/src/components/ForgotPasswordModal.jsx
 * Description: Password recovery modal featuring mobile submission and 6-digit
 *              verification code entry with real-time dev notice.
 * =============================================================================
 */

import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { X, Smartphone, ShieldCheck, Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

const ForgotPasswordModal = ({ isOpen, onClose, initialStep = 1, initialMobile = '' }) => {
  const { forgotPassword, resetPassword, language } = useContext(AuthContext);
  const [mobile, setMobile] = useState(initialMobile || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(initialStep); // 1: enter mobile, 2: enter 6-digit code & new pass
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialStep) {
      setStep(initialStep);
    }
    if (initialMobile) {
      setMobile(initialMobile);
    }
  }, [initialStep, initialMobile, isOpen]);

  if (!isOpen) return null;

  const t = {
    title: language === 'bn' ? 'পাসওয়ার্ড রিসেট করুন' : 'Reset Password',
    mobileLabel: language === 'bn' ? 'নিবন্ধিত মোবাইল নম্বর' : 'Registered Mobile Number',
    mobileHelp: language === 'bn' ? 'উদাহরণঃ ০১৭১২৩৪৫৬৭৮ (১১ ডিজিট)' : 'Example: 01712345678 (11 digits)',
    requestBtn: language === 'bn' ? 'কোড পাঠান' : 'Send Code',
    resetBtn: language === 'bn' ? 'রিসেট সম্পন্ন করুন' : 'Complete Reset',
    reenterMobile: language === 'bn' ? 'মোবাইল নম্বর আবার লিখুন' : 'Re-enter Mobile Number',
    codeLabel: language === 'bn' ? '৬-সংখ্যার সিকিউরিটি কোড' : '6-Digit Security Code',
    codePlaceholder: language === 'bn' ? '৬-সংখ্যার কোড লিখুন' : 'Enter 6-digit code',
    newPasswordLabel: language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password',
    newPasswordPlaceholder: language === 'bn' ? 'কমপক্ষে ৬টি অক্ষর' : 'At least 6 characters',
    step1Info: language === 'bn'
      ? 'আপনার নিবন্ধিত মোবাইল নম্বর দিন। পাসওয়ার্ড পুনরুদ্ধারের জন্য একটি ৬-সংখ্যার যাচাইকরণ কোড পাঠানো হবে।'
      : 'Enter your registered mobile number. A 6-digit verification code will be sent for account recovery.',
    devNotice: language === 'bn'
      ? '🔒 ডেভলপার নোট: ৬-সংখ্যার কোডটি ব্যাকএন্ড কনসোলে লগ করা হয়েছে।'
      : '🔒 Developer Note: The 6-digit verification code is logged in the backend server console.',
    invalidMobileErr: language === 'bn'
      ? 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01811223344)।'
      : 'Please enter a valid 11-digit mobile number starting with 01.',
    emptyCodeErr: language === 'bn'
      ? 'অনুগ্রহ করে ৬-সংখ্যার সিকিউরিটি কোড দিন।'
      : 'Please enter the 6-digit security code.',
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
      setError(result.message || 'Error sending code.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.length < 6) {
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
        setMobile('');
        setOtp('');
        setNewPassword('');
        setStep(1);
        setSuccess('');
      }, 2000);
    } else {
      setError(result.message || 'Password reset failed.');
    }
  };

  return (
    <div
      id="forgot-password-modal-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="forgot-password-modal-content"
        className="relative w-full max-w-md overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          id="btn-close-forgot-modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 tracking-tight">{t.title}</h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-medium">
            {step === 1 ? t.step1Info : (language === 'bn' ? `মোবাইল নম্বর: +৮৮ ${mobile || '০১৮XXXXXXXX'}` : `Mobile: +88 ${mobile || '018XXXXXXXX'}`)}
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span className="font-semibold leading-relaxed">{success}</span>
          </div>
        )}

        {step === 1 ? (
          /* STEP 1: Enter mobile number */
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                {t.mobileLabel}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold select-none text-sm">
                  +৮৮
                </span>
                <input
                  id="forgot-mobile-input"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="01811223344"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none text-slate-100 font-bold tracking-wider placeholder-slate-600 transition-all text-sm"
                  required
                  disabled={submitting}
                />
              </div>
              <p className="text-[11px] text-slate-500">{t.mobileHelp}</p>
            </div>

            <button
              id="btn-send-code"
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-xl active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-lg shadow-emerald-950/30 cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{t.requestBtn}</span>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: Enter 6-digit code and new password */
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center text-xs text-amber-300 font-medium leading-relaxed">
              {t.devNotice}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                {t.codeLabel}
              </label>
              <input
                id="input-otp-code"
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder={t.codePlaceholder}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 outline-none text-slate-100 font-bold text-center text-xl tracking-widest placeholder-slate-600 transition-all"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                {t.newPasswordLabel}
              </label>
              <input
                id="input-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.newPasswordPlaceholder}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none text-slate-100 font-medium placeholder-slate-600 transition-all text-sm"
                required
                disabled={submitting}
              />
            </div>

            <button
              id="btn-complete-reset"
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-sm rounded-xl active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-lg shadow-amber-950/30 cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{t.resetBtn}</span>
              )}
            </button>

            <button
              type="button"
              id="btn-reenter-mobile"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1 pt-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.reenterMobile}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
