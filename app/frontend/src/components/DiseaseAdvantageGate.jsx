import React from 'react';
import {
  Activity,
  ShieldAlert,
  Microscope,
  FileText,
  Stethoscope,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  LogIn,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

export default function DiseaseAdvantageGate({ onSignIn, onSignUp, onExploreMarketplace }) {
  const advantages = [
    {
      icon: Microscope,
      title: 'Instant 4-Class CNN Analysis',
      desc: 'Trained on thousands of clinical samples to accurately classify Coccidiosis, Salmonella, Newcastle Disease, or verify a Healthy flock in seconds.',
      tag: 'CNN Model'
    },
    {
      icon: Activity,
      title: 'Confidence & Severity Classification',
      desc: 'Receive exact model prediction confidence percentages and clinical severity indicators to assess treatment urgency immediately.',
      tag: 'Precision AI'
    },
    {
      icon: ShieldAlert,
      title: 'Actionable Veterinary Treatment Plans',
      desc: 'Instant access to recommended medications, dosage schedules, water sanitation steps, and biosecurity isolation protocols.',
      tag: 'Prescriptions'
    },
    {
      icon: FileText,
      title: 'Permanent Farm Health Audit Trail',
      desc: 'All diagnoses are automatically logged to your farm’s health records, allowing you and consulting veterinarians to trace flock trends.',
      tag: 'Audit Logs'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-10 animate-fade-in">
      {/* Top Header Card */}
      <div className="relative glass-panel rounded-3xl p-8 sm:p-12 border border-rose-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-rose-950/30 shadow-2xl overflow-hidden text-center">
        {/* Decorative glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-rose-500/15 border border-rose-400/30 text-rose-300">
            <Sparkles className="w-4 h-4 text-rose-400" />
            MEMBER ADVANTAGE • AI POULTRY DIAGNOSTICS
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            AI-Powered Disease Detection from Droppings
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Marketplace browsing is open to everyone. To analyze poultry health from dropping photos, view disease confidence ratings, and save diagnosis logs to your farm, create your free account.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onSignUp}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/50 hover:scale-105 active:scale-100 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Free Account</span>
            </button>
            <button
              onClick={onSignIn}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-slate-100 font-bold text-sm border border-slate-700 hover:border-rose-500/50 flex items-center justify-center gap-2.5 shadow-lg hover:scale-105 active:scale-100 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-rose-400" />
              <span>Sign In to AgriMind</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 pt-2">
            Accounts are free for all poultry farmers, veterinarians, and farm managers in Bangladesh.
          </p>
        </div>
      </div>

      {/* Advantage Features Grid */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-slate-200">
            Advantages of AgriMind Member Diagnostics
          </h3>
          <p className="text-xs text-slate-400">
            Backed by a customized Convolutional Neural Network trained on validated avian pathology datasets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {advantages.map((adv, idx) => (
            <div
              key={idx}
              className="glass-panel p-6 rounded-2xl border border-slate-800/90 hover:border-rose-500/40 transition-all bg-slate-900/60 flex gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                <adv.icon className="w-6 h-6 text-rose-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-100">{adv.title}</h4>
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    {adv.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{adv.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explore Marketplace Callout */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">Looking to purchase medicines or vaccines?</p>
            <p className="text-[11px] text-slate-400">The AgriShop marketplace is open for everyone to explore.</p>
          </div>
        </div>
        <button
          onClick={onExploreMarketplace}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span>Explore Marketplace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
