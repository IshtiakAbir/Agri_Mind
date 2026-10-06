/**
 * =============================================================================
 * Module: Farmer Profile Management Modal
 * Authorship: Full-Stack Web Team (agrimind-main)
 * Component: /app/frontend/src/components/ProfileModal.jsx
 * Description: Profile screen showing farmer's permanent registered name (read-only)
 *              and editable mobile number and password fields.
 * =============================================================================
 */

import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  X,
  User,
  Phone,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  FileCheck2,
  Edit3
} from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, language } = useContext(AuthContext);

  const [mobile, setMobile] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setMobile(user.mobile || '');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const t = {
    title: language === 'bn' ? 'প্রোফাইল পরিচালনা' : 'Profile Management',
    subtitle: language === 'bn'
      ? 'আপনার অ্যাকাউন্টের নিরাপত্তা এবং তথ্য পরিচালনা করুন'
      : 'Manage your farmer account credentials & security',
    nameLabel: language === 'bn' ? 'খামারীর পূর্ণ নাম' : 'Farmer Full Name',
    nameReadOnlyBadge: language === 'bn' ? 'অপরিবর্তনযোগ্য (স্থায়ী রেকর্ড)' : 'Read-Only (Permanent Record)',
    nameNote: language === 'bn'
      ? 'নিবন্ধন ও ভেরিফিকেশন অনুযায়ী নাম অপরিবর্তনযোগ্য রাখা হয়েছে।'
      : 'Name is permanently locked to match registered verification records.',
    mobileLabel: language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number',
    mobileEditableBadge: language === 'bn' ? 'সম্পাদনযোগ্য' : 'Editable',
    mobileHelp: language === 'bn'
      ? 'এসএমএস অ্যালার্ট ও অ্যাকাউন্টে লগইনের জন্য ব্যবহৃত নম্বর।'
      : 'Used for SMS alerts and account login credentials.',
    securityHeader: language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password',
    currentPassLabel: language === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password',
    currentPassPlaceholder: language === 'bn' ? 'বর্তমান পাসওয়ার্ড দিন' : 'Enter current password',
    newPassLabel: language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password',
    newPassPlaceholder: language === 'bn' ? 'কমপক্ষে ৬ ডিজিটের নতুন পাসওয়ার্ড' : 'At least 6 characters',
    saveBtn: language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes',
    cancelBtn: language === 'bn' ? 'বাতিল' : 'Cancel',
    roleLabel: language === 'bn' ? 'অ্যাকাউন্ট টাইপ' : 'Account Type',
    farmerRole: language === 'bn' ? 'নিবন্ধিত খামারী' : 'Registered Farmer'
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mobile && (!/^01\d{9}$/.test(mobile))) {
      setError(language === 'bn'
        ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01811223344)।'
        : 'Please enter a valid 11-digit mobile number.'
      );
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError(language === 'bn'
        ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
        : 'New password must be at least 6 characters.'
      );
      return;
    }

    if (newPassword && !currentPassword) {
      setError(language === 'bn'
        ? 'পাসওয়ার্ড পরিবর্তনের জন্য বর্তমান পাসওয়ার্ড দিন।'
        : 'Current password is required to set a new password.'
      );
      return;
    }

    setSaving(true);
    const payload = {};
    if (mobile && mobile !== user?.mobile) payload.mobile = mobile;
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    if (Object.keys(payload).length === 0) {
      setSaving(false);
      setSuccess(language === 'bn' ? 'কোনো পরিবর্তন করা হয়নি।' : 'No changes were made.');
      return;
    }

    const res = await updateProfile(payload);
    setSaving(false);

    if (res.success) {
      setSuccess(language === 'bn'
        ? 'প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!'
        : 'Profile updated successfully!'
      );
      setCurrentPassword('');
      setNewPassword('');
    } else {
      setError(res.message || 'Profile update failed.');
    }
  };

  return (
    <div
      id="profile-modal-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="profile-modal-content"
        className="relative w-full max-w-lg overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

        {/* Close Button */}
        <button
          id="btn-close-profile-modal"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-800/80 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl shadow-inner">
            {user?.name ? user.name[0] : <User className="w-7 h-7" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>{t.title}</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {t.farmerRole}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{t.subtitle}</p>
          </div>
        </div>

        {/* Feedback alerts */}
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

        <form onSubmit={handleSave} className="space-y-5">
          {/* FIELD 1: Permanent Name (Read-Only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {t.nameLabel}
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-amber-300/90 border border-amber-500/20 font-semibold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                {t.nameReadOnlyBadge}
              </span>
            </div>
            <div className="relative">
              <input
                id="profile-name-readonly"
                type="text"
                value={user?.name || 'কামাল হোসেন'}
                readOnly
                disabled
                className="w-full px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-300 font-bold text-sm cursor-not-allowed select-none opacity-90"
              />
              <FileCheck2 className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">{t.nameNote}</p>
          </div>

          {/* FIELD 2: Mobile Number (Editable) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                {t.mobileLabel}
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                <Edit3 className="w-2.5 h-2.5" />
                {t.mobileEditableBadge}
              </span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold select-none text-sm">
                +৮৮
              </span>
              <input
                id="profile-mobile-editable"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="01811223344"
                className="w-full pl-12 pr-10 py-3 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none text-slate-100 font-bold tracking-wider placeholder-slate-600 transition-all text-sm"
                required
              />
              <Edit3 className="w-4 h-4 text-emerald-400/70 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">{t.mobileHelp}</p>
          </div>

          {/* FIELD 3: Password Update Section (Editable) */}
          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-teal-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {t.securityHeader}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">
                  {t.currentPassLabel}
                </label>
                <input
                  id="profile-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t.currentPassPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 outline-none text-slate-100 text-xs placeholder-slate-600 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">
                  {t.newPassLabel}
                </label>
                <input
                  id="profile-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.newPassPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 outline-none text-slate-100 text-xs placeholder-slate-600 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              id="btn-cancel-profile"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors border border-slate-700 cursor-pointer"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              id="btn-save-profile"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/30 cursor-pointer transition-all disabled:opacity-60"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>{t.saveBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
