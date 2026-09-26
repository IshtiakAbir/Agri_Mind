/**
 * =============================================================================
 * Module: Farm Summary Dashboard (Per-Farm Overview)
 * Component: /app/frontend/src/components/FarmSummary.jsx
 * Description: Dashboard of cards for a specific farm: profit estimation,
 *              flock health donut, farm analytics, weather, quick diagnostic
 *              upload, and recent activity. Each card loads independently.
 * =============================================================================
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  TrendingUp, TrendingDown, Bird, Activity, Cloud,
  Camera, Clock, AlertCircle, RefreshCw, DollarSign,
  Shield, Thermometer, Droplets, Upload, CheckCircle2,
  BarChart3, Heart, Zap, FileText, ArrowRight, ChevronRight
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import WeatherWidget from './WeatherWidget';

export default function FarmSummary({ farm, batches, onNavigateToBatch, onNavigateToDiagnosis }) {
  const { user } = useContext(AuthContext);
  const [recentDiagnosis, setRecentDiagnosis] = useState(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(true);

  const activeBatches = batches.filter(b => b.status === 'Active');
  const totalLiveBirds = activeBatches.reduce((sum, b) => sum + (b.liveBirdsEstimate || b.initialChickens || 0), 0);
  const totalMortality = activeBatches.reduce((sum, b) => sum + (b.cumulativeMortality || 0), 0);
  const totalInitial = activeBatches.reduce((sum, b) => sum + (b.initialChickens || 0), 0);

  // Profit from latest batch forecast
  const latestActiveBatch = activeBatches[0];
  const forecast = latestActiveBatch?.latestForecast || null;

  useEffect(() => {
    fetchRecentDiagnosis();
  }, [farm?._id]);

  const fetchRecentDiagnosis = async () => {
    try {
      const res = await fetch(`/api/history?farmId=${farm?._id}&type=disease&limit=1`);
      const data = await res.json();
      if (data.success && data.history?.length > 0) {
        setRecentDiagnosis(data.history[0]);
      }
    } catch {}
    finally { setLoadingDiagnosis(false); }
  };

  // Health status distribution
  const healthyBirds = Math.max(0, totalLiveBirds - totalMortality);
  const mortalityRate = totalInitial > 0 ? ((totalMortality / totalInitial) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Farm Header */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-emerald-950/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              {farm?.farmName || 'Farm Summary'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {farm?.city}, {farm?.country} • {farm?.chickenType} • {activeBatches.length} active batch{activeBatches.length !== 1 ? 'es' : ''}
            </p>
          </div>
          {activeBatches.length > 0 && (
            <button
              onClick={() => onNavigateToBatch && onNavigateToBatch(activeBatches[0]._id)}
              className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
            >
              Open Batch Dashboard <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid: Row 1 has 3 cards (2 cols each), Row 2 has 2 cards (3 cols each) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">

        {/* ── Card 1: Profit Estimation ── */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Profit Estimation</h4>
              <p className="text-[10px] text-slate-400">End-of-cycle ML forecast</p>
            </div>
          </div>

          {forecast ? (
            <div className="space-y-3">
              <div className={`text-3xl font-extrabold ${forecast.predictedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ৳ {Math.round(forecast.predictedProfit).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                {forecast.predictedProfit >= 0 ? (
                  <span className="flex items-center gap-1 text-emerald-400"><TrendingUp className="w-3 h-3" /> Profitable</span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400"><TrendingDown className="w-3 h-3" /> Loss Expected</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500">
                Range: ৳{Math.round(forecast.low || 0).toLocaleString()} – ৳{Math.round(forecast.high || 0).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 py-4">No active batch forecast available.</div>
          )}
        </div>

        {/* ── Card 2: Flock Health Overview ── */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Flock Health</h4>
              <p className="text-[10px] text-slate-400">{activeBatches.length} active batches</p>
            </div>
          </div>

          {activeBatches.length > 0 ? (
            <div className="space-y-3">
              {/* Simple donut visualization */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3"
                      strokeDasharray={`${100 - parseFloat(mortalityRate)} ${parseFloat(mortalityRate)}`}
                      strokeDashoffset="25" strokeLinecap="round" />
                    {parseFloat(mortalityRate) > 0 && (
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f43f5e" strokeWidth="3"
                        strokeDasharray={`${parseFloat(mortalityRate)} ${100 - parseFloat(mortalityRate)}`}
                        strokeDashoffset={`${25 - (100 - parseFloat(mortalityRate))}`} strokeLinecap="round" />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-300">{totalLiveBirds}</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-300">Healthy: <strong className="text-emerald-400">{totalLiveBirds.toLocaleString()}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-slate-300">Mortality: <strong className="text-rose-400">{totalMortality}</strong> ({mortalityRate}%)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 py-4">No active batches.</div>
          )}
        </div>

        {/* ── Card 3: Weather / Environment ── */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Cloud className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Weather & Environment</h4>
              <p className="text-[10px] text-slate-400">{farm?.city || 'Dhaka'}, {farm?.country || 'Bangladesh'}</p>
            </div>
          </div>
          <WeatherWidget city={farm?.city || 'Dhaka'} country={farm?.country || 'Bangladesh'} />
        </div>

        {/* ── Card 4: Farm Analytics (Last 30 Days) ── */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 lg:col-span-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Farm Analytics</h4>
              <p className="text-[10px] text-slate-400">Key metrics at a glance</p>
            </div>
          </div>

          <div className="space-y-2">
            {activeBatches.length > 0 ? (
              <>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/60 text-[11px]">
                  <span className="text-slate-400">Feed Conversion Ratio</span>
                  <span className="text-slate-200 font-bold">
                    {latestActiveBatch?.cumulativeFeedKg && totalLiveBirds > 0
                      ? (latestActiveBatch.cumulativeFeedKg / (totalLiveBirds * (latestActiveBatch.targetHarvestWeightKg || 2.0))).toFixed(2)
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/60 text-[11px]">
                  <span className="text-slate-400">Mortality Rate</span>
                  <span className={`font-bold ${parseFloat(mortalityRate) > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {mortalityRate}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/60 text-[11px]">
                  <span className="text-slate-400">Current Age</span>
                  <span className="text-slate-200 font-bold">{latestActiveBatch?.currentAgeDays || 0} days</span>
                </div>
                <div className="flex justify-between items-center py-2 text-[11px]">
                  <span className="text-slate-400">Cycle Length</span>
                  <span className="text-slate-200 font-bold">{latestActiveBatch?.cycleLengthDays || 35} days</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500 py-4">Start a batch to see analytics.</div>
            )}
          </div>
        </div>

        {/* ── Card 5: Recent Diagnosis Activity ── */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 lg:col-span-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Recent Activity</h4>
              <p className="text-[10px] text-slate-400">Last diagnosis result</p>
            </div>
          </div>

          {loadingDiagnosis ? (
            <div className="flex items-center gap-2 text-slate-500 text-xs py-4">
              <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
            </div>
          ) : recentDiagnosis ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  recentDiagnosis.result?.success
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  {recentDiagnosis.result?.prediction || 'Unknown'}
                </span>
                {recentDiagnosis.result?.confidence && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {(recentDiagnosis.result.confidence * 100).toFixed(0)}% confidence
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(recentDiagnosis.timestamp).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="text-sm text-slate-500 py-4">No diagnoses run yet for this farm.</div>
          )}

          <button
            onClick={() => onNavigateToDiagnosis && onNavigateToDiagnosis()}
            className="w-full py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" /> Open Disease Classifier
          </button>
        </div>
      </div>
    </div>
  );
}
