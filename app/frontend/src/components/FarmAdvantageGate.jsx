import React from 'react';
import {
  Bird,
  Warehouse,
  ClipboardCheck,
  TrendingUp,
  CloudSun,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  LogIn,
  ShoppingBag
} from 'lucide-react';

export default function FarmAdvantageGate({ onSignIn, onSignUp, onExploreMarketplace }) {
  const advantages = [
    {
      icon: Warehouse,
      title: 'Multi-Shed & Flock Tracking',
      desc: 'Register and manage multiple broiler, layer, or sonali sheds with automatic flock age, batch lifecycle, and capacity telemetry.',
      tag: 'Flock Telemetry'
    },
    {
      icon: ClipboardCheck,
      title: 'Daily Smart Health Check-Ins',
      desc: 'Log morning and evening feed intake, water consumption, and mortality with instant flock health scoring and mortality alerts.',
      tag: 'Daily Logs'
    },
    {
      icon: TrendingUp,
      title: 'ML Profit & Harvest Forecasting',
      desc: 'Machine learning algorithms calculate Feed Conversion Ratio (FCR), predicted harvest weight, and expected market revenue.',
      tag: 'AI Forecast'
    },
    {
      icon: CloudSun,
      title: 'Shed Microclimate Telemetry',
      desc: 'Monitor real-time ambient temperature, humidity levels, and heat-stress alerts customized to your farm’s district.',
      tag: 'Weather Alerts'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-10 animate-fade-in">
      {/* Top Header Card */}
      <div className="relative glass-panel rounded-3xl p-8 sm:p-12 border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 shadow-2xl overflow-hidden text-center">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-400/30 text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            MEMBER ADVANTAGE • SMART POULTRY
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Create Your Farm &amp; Scale Your Flock
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Marketplace browsing is open to everyone. To register a farm shed, record daily health check-ins, track bird mortality, and predict harvest profits, create your free AgriMind account.
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
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-slate-100 font-bold text-sm border border-slate-700 hover:border-emerald-500/50 flex items-center justify-center gap-2.5 shadow-lg hover:scale-105 active:scale-100 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>Sign In to Your Farm</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 pt-2">
            No credit card or payment required. Free for poultry farmers in Bangladesh.
          </p>
        </div>
      </div>

      {/* Advantage Features Grid */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-slate-200">
            Advantages You Unlock by Creating an Account
          </h3>
          <p className="text-xs text-slate-400">
            Professional digital telemetry built specifically for commercial and household poultry farms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {advantages.map((adv, idx) => (
            <div
              key={idx}
              className="glass-panel p-6 rounded-2xl border border-slate-800/90 hover:border-emerald-500/40 transition-all bg-slate-900/60 flex gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <adv.icon className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-100">{adv.title}</h4>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
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
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">Looking to purchase poultry feed or supplies?</p>
            <p className="text-[11px] text-slate-400">The AgriShop marketplace is open for everyone to explore.</p>
          </div>
        </div>
        <button
          onClick={onExploreMarketplace}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span>Explore Marketplace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
