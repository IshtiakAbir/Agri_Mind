/**
 * =============================================================================
 * Module: AgriMind Landing Dashboard (Hero + Marketplace + Farm Entry)
 * Component: /app/frontend/src/components/Dashboard.jsx
 * Description: Landing page with hero section, marketplace product grid,
 *              farm entry point, how-it-works section, and footer links.
 *              No farm-creation form embedded — user goes to Smart Poultry.
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles, Warehouse, ShoppingBag, Bird, ArrowRight, Activity,
  CheckCircle2, DollarSign, ChevronRight, RefreshCw, Shield,
  BarChart3, Stethoscope, ClipboardCheck, TrendingUp, Zap,
  Star, Tag, Phone
} from 'lucide-react';

export default function Dashboard({ setActiveTab, setActiveFarmId, onFarmRegistered }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [farms, setFarms] = useState([]);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [stats, setStats] = useState({ totalFarms: 0, totalBirds: 0, totalDiagnoses: 0 });

  useEffect(() => {
    fetchFeaturedProducts();
    fetchFarms();
    fetchStats();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && data.products) {
        setFeaturedProducts(data.products.slice(0, 6));
      }
    } catch { setFeaturedProducts([]); }
    finally { setLoadingProducts(false); }
  };

  const fetchFarms = async () => {
    try {
      const res = await fetch('/api/farms');
      const data = await res.json();
      if (data.success && data.farms) {
        setFarms(data.farms);
        // Calculate aggregate stats
        let totalBirds = 0;
        data.farms.forEach(f => {
          totalBirds += (f.initialChickens || f.totalChickens || 0);
        });
        setStats(prev => ({ ...prev, totalFarms: data.farms.length, totalBirds }));
      }
    } catch { setFarms([]); }
    finally { setLoadingFarms(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/history?limit=1000');
      const data = await res.json();
      if (data.success) {
        setStats(prev => ({ ...prev, totalDiagnoses: data.count || 0 }));
      }
    } catch {}
  };

  const hasFarms = farms.length > 0;

  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-fade-in pb-8">
      {/* ── Hero Section ── */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-emerald-950/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" /> Smart Poultry Intelligence Platform
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-emerald-200 to-teal-400 tracking-tight leading-tight">
              Manage Your Poultry Farm with Data-Driven Intelligence
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track daily flock health, get automated vaccination reminders, predict profits with machine learning, diagnose diseases from droppings photos using EfficientNetB3, and buy or sell farming supplies — all in one platform built for Bangladesh poultry farmers.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => setActiveTab('flocks')}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/40"
              >
                <Bird className="w-4 h-4" />
                <span>{hasFarms ? 'Go to Smart Poultry' : 'Create Your First Farm'}</span>
              </button>
              <button
                onClick={() => setActiveTab('market')}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all shadow-md"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Browse Marketplace</span>
              </button>
              <button
                onClick={() => setActiveTab('doctors')}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all shadow-md"
              >
                <Stethoscope className="w-4 h-4 text-blue-400" />
                <span>Find a Vet</span>
              </button>
            </div>
          </div>

          {/* Illustration / Stats Side */}
          <div className="shrink-0 w-full lg:w-72 space-y-3">
            <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/20 text-center">
              <Bird className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-extrabold text-emerald-300">{stats.totalBirds.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400">Birds Monitored</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <p className="text-lg font-bold text-cyan-400">{stats.totalFarms}</p>
                <p className="text-[10px] text-slate-400">Farms</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <p className="text-lg font-bold text-amber-400">{stats.totalDiagnoses}</p>
                <p className="text-[10px] text-slate-400">Diagnoses</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Farm Entry Point ── */}
      {!loadingFarms && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl">
          {hasFarms ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Warehouse className="w-5 h-5 text-emerald-400" />
                  Your Farms ({farms.length})
                </h3>
                <button
                  onClick={() => setActiveTab('flocks')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                >
                  Open Smart Poultry <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {farms.slice(0, 3).map(f => (
                  <button
                    key={f._id}
                    onClick={() => {
                      setActiveFarmId(f._id);
                      localStorage.setItem('farmId', f._id);
                      setActiveTab('flocks');
                    }}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-950/60 border border-slate-800 text-emerald-400">
                        {f.chickenType}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 truncate">{f.farmName}</h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{f.city}, {f.country}</span>
                      <span className="font-semibold text-slate-300">{(f.initialChickens || 0).toLocaleString()} birds</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center">
                <Bird className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Start Your Smart Poultry Journey</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Create your first farm to unlock batch management, daily check-ins, AI-powered diagnostics, and ML profit forecasting.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('flocks')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-sm font-bold hover:opacity-90 transition-all shadow-lg mx-auto flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Create Your First Farm
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── How It Works ── */}
      <div className="space-y-5">
        <h3 className="text-lg font-bold text-slate-100 text-center">How It Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Warehouse,
              step: '1',
              title: 'Create a Farm',
              desc: 'Register your poultry farm with flock details, location, and breed type. Start a new batch to begin tracking.',
              color: 'emerald'
            },
            {
              icon: ClipboardCheck,
              step: '2',
              title: 'Log Daily Check-Ins',
              desc: 'Record morning and evening routines — feed, water, mortality, and upload droppings photos for AI analysis.',
              color: 'cyan'
            },
            {
              icon: TrendingUp,
              step: '3',
              title: 'Get Alerts & Guidance',
              desc: 'Receive age-based vaccination reminders, weather alerts, flock health status, and ML-predicted profit estimates.',
              color: 'amber'
            }
          ].map(item => (
            <div key={item.step} className="glass-panel rounded-2xl p-6 border border-slate-800 text-center space-y-3 hover:border-slate-700 transition-colors">
              <div className={`w-12 h-12 rounded-xl bg-${item.color}-500/10 border border-${item.color}-500/20 mx-auto flex items-center justify-center`}>
                <item.icon className={`w-6 h-6 text-${item.color}-400`} />
              </div>
              <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 w-6 h-6 rounded-full flex items-center justify-center mx-auto">
                {item.step}
              </div>
              <h4 className="text-sm font-bold text-slate-100">{item.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Marketplace Section ── */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
              <ShoppingBag className="w-6 h-6 text-emerald-400" />
              AgriShop — Poultry Supplies & Marketplace
            </h3>
            <p className="text-xs text-slate-400">
              Instruments, vaccines, medicines, feed, and farmer produce available for immediate order.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('market')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <span>Explore All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loadingProducts ? (
          <div className="glass-panel p-12 rounded-2xl text-center space-y-2 border border-slate-800">
            <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading marketplace items...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredProducts.map(product => (
              <div
                key={product._id}
                onClick={() => setActiveTab('market')}
                className="glass-panel rounded-2xl border border-slate-800/90 hover:border-emerald-500/40 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer hover:scale-[1.01] shadow-xl"
              >
                <div className="relative h-40 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                      {product.category}
                    </span>
                  </div>
                  {product.badge && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-slate-950 shadow-md">
                        {product.badge}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-emerald-300 line-clamp-1">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold text-emerald-400">৳ {product.price?.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 ml-1">/{product.unit}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-300 group-hover:text-emerald-400 flex items-center gap-1">
                      Order Item →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Diagnostics Callout ── */}
      <button
        onClick={() => setActiveTab('disease')}
        className="w-full glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 hover:border-emerald-500/40 transition-all text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:scale-[1.005]"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 group-hover:bg-rose-500/20 transition-colors">
            <Activity className="w-7 h-7 text-rose-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              AI Disease Diagnostics Classifier
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </h4>
            <p className="text-xs text-slate-400">
              Upload poultry fecal images to detect Coccidiosis, Salmonella, or Newcastle disease using our EfficientNetB3 deep learning model.
            </p>
          </div>
        </div>
        <span className="shrink-0 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          Open Classifier →
        </span>
      </button>
    </div>
  );
}
