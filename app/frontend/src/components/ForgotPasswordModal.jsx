/**
 * =============================================================================
 * Module: Forgot Password Modal
 * Authorship: Full-Stack Web Team (agrimind-main)
 * Component: /app/frontend/src/components/ForgotPasswordModal.jsx
 * Description: Simplified password recovery info modal (OTP not yet integrated).
 * =============================================================================
 */

import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { X, ShieldCheck, Phone } from 'lucide-react';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const { language } = useContext(AuthContext);

  if (!isOpen) return null;

  const t = {
    title: language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?',
    info: language === 'bn'
      ? 'আপনার পাসওয়ার্ড রিসেট করতে, নিকটস্থ AgriMind কর্মচারীকে কল করুন অথবা অফিসে যোগাযোগ করুন। কর্মচারী আপনার একাউন্ট আপডেট করে দিবেন।'
      : 'To reset your password, please contact your nearest AgriMind employee or visit the office. An employee will update your account.',
    phone: language === 'bn' ? 'সাপোর্ট ফোন' : 'Support Phone',
    close: language === 'bn' ? 'বন্ধ করুন' : 'Close'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-7 shadow-2xl animate-fade-in space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            {t.title}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed font-medium">{t.info}</p>

        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-sm">
          <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">{t.phone}</span>
            <span className="text-emerald-300 font-bold">+880 1712-000000</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors border border-slate-700"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
