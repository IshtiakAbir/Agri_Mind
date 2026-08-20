/**
 * =============================================================================
 * Module: Employee Farmer Support & Account Management Component
 * Authorship: Full-Stack Web Team (agrimind-main)
 * Component: /app/frontend/src/components/EmployeeSupport.jsx
 * Description: Employee dashboard for farmer search, account verification, and assistance.
 * =============================================================================
 */

import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Search, UserCheck, ShieldCheck, Phone, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function EmployeeSupport() {
  const { searchFarmer, language } = useContext(AuthContext);
  const [searchMobile, setSearchMobile] = useState('');
  const [farmer, setFarmer] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const t = {
    title: language === 'bn' ? 'কৃষক অনুসন্ধান ও সহায়তা' : 'Farmer Support & Account Lookup',
    subtitle: language === 'bn' ? 'কৃষকের মোবাইল নম্বর দিয়ে অ্যাকাউন্ট খুঁজুন' : 'Search farmer accounts by registered mobile number',
    searchPlaceholder: language === 'bn' ? '১১ ডিজিটের মোবাইল নম্বর (যেমন: 017...)' : '11-digit mobile number (e.g. 017...)',
    searchBtn: language === 'bn' ? 'অনুসন্ধান করুন' : 'Search Account',
    foundTitle: language === 'bn' ? 'খামারীর তথ্য পাওয়া গেছে' : 'Farmer Profile Found',
    name: language === 'bn' ? 'খামারীর নাম' : 'Farmer Name',
    mobile: language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number',
    role: language === 'bn' ? 'অ্যাকাউন্ট টাইপ' : 'Role',
    status: language === 'bn' ? 'স্ট্যাটাস' : 'Status',
    verified: language === 'bn' ? 'যাচাইকৃত খামারী' : 'Verified Farmer'
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchMobile || searchMobile.length !== 11) {
      setSearchError(language === 'bn' ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।' : 'Please enter a valid 11-digit mobile number.');
      return;
    }

    setSearching(true);
    setSearchError('');
    setFarmer(null);

    const res = await searchFarmer(searchMobile);
    if (res.success && res.farmer) {
      setFarmer(res.farmer);
    } else {
      setSearchError(res.message || (language === 'bn' ? 'কোন খামারী পাওয়া যায়নি।' : 'No farmer found with this number.'));
    }
    setSearching(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-2 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">{t.title}</h3>
            <p className="text-xs text-slate-400">{t.subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="pt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={searchMobile}
              onChange={(e) => setSearchMobile(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{t.searchBtn}</span>
          </button>
        </form>

        {searchError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 mt-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {farmer && (
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/40 space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t.foundTitle}
            </h4>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              {t.verified}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] font-semibold">{t.name}</span>
              <p className="text-base font-bold text-slate-100">{farmer.name}</p>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] font-semibold">{t.mobile}</span>
              <p className="text-base font-bold text-cyan-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {farmer.mobile}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
