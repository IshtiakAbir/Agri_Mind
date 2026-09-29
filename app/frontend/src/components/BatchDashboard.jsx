/**
 * =============================================================================
 * Module: Unified Batch Dashboard (Full Flock Operations Hub)
 * Component: /app/frontend/src/components/BatchDashboard.jsx
 * Description: Combines Farm & Batch selection, real-time StatusBanner,
 *              AgeEnvironmentCard, DailyCheckInCard, GuidanceBox,
 *              MilestoneTimeline, Rolling Profit Forecast, and Batch Closeout.
 * =============================================================================
 */

import React, { useState, useContext } from 'react';
import {
  Bird,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Plus,
  ChevronDown,
  Archive,
  Sparkles,
  Layers,
  Clock,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { BatchContext } from '../context/BatchContext';
import { AuthContext } from '../context/AuthContext';
import StatusBanner from './StatusBanner';
import AgeEnvironmentCard from './AgeEnvironmentCard';
import GuidanceBox from './GuidanceBox';
import MilestoneTimeline from './MilestoneTimeline';
import DailyCheckInCard from './DailyCheckInCard';
import BatchWizard from './BatchWizard';
import BatchCloseModal from './BatchCloseModal';
import ErrorBoundary from './ErrorBoundary';

export default function BatchDashboard({ activeFarmId, setActiveFarmId }) {
  const {
    batches,
    activeBatchId,
    activeBatch,
    dashboardData,
    loading,
    selectBatch,
    refreshActiveBatch
  } = useContext(BatchContext);

  const { language } = useContext(AuthContext);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  // If no batches exist for farmer
  if (!loading && batches.length === 0) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/40">
            <Bird className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
              No Active Poultry Flocks
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Start tracking flock growth, microclimate alerts, vaccination schedules,
              and rolling profit forecasts from day 0 to harvest.
            </p>
          </div>
          <div>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm inline-flex items-center gap-2 shadow-xl shadow-emerald-950/60 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              Onboard First Flock Batch
            </button>
          </div>
        </div>

        <BatchWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          defaultFarmId={activeFarmId}
        />
      </div>
    );
  }

  const currentBatch = activeBatch || batches[0];
  const evaluation = dashboardData?.evaluation || {
    status: dashboardData?.status || 'Looks Good',
    reasons: dashboardData?.reasons || []
  };
  const weather = dashboardData?.weather || null;
  const metrics = dashboardData?.metrics || {};
  const stage = dashboardData?.stage || {};
  const tasksDue = dashboardData?.tasksDue || [];
  const alerts = dashboardData?.alerts || [];
  const latestForecast = currentBatch?.latestForecast || null;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ─── Header & Top Control Bar ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Bird className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active Flock Batch
            </span>
            <div className="relative mt-0.5">
              <select
                value={activeBatchId || ''}
                onChange={(e) => selectBatch(e.target.value)}
                className="appearance-none bg-slate-950 border border-slate-800 text-slate-100 font-bold text-xs sm:text-sm rounded-xl py-1.5 pl-3 pr-8 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.batchName} ({b.chickenType} • Day {b.currentAgeDays || 0} • {b.status})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshActiveBatch()}
            title="Refresh flock telemetry"
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
          </button>
          
          {currentBatch?.status === 'Active' && (
            <button
              onClick={() => setIsCloseModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              Close Batch
            </button>
          )}

          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Flock
          </button>
        </div>
      </div>

      {/* ─── Real-time Status Banner ─── */}
      <ErrorBoundary fallbackTitle="Status Banner Unavailable">
        <StatusBanner
          batchId={currentBatch?._id}
          initialEvaluation={evaluation}
          weatherAlerts={alerts}
        />
      </ErrorBoundary>

      {/* ─── Row 1: Age & Environment Card + Rolling Profit Forecast Card ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ErrorBoundary fallbackTitle="Flock Environment Card Unavailable">
            <AgeEnvironmentCard
              batch={currentBatch}
              dashboardData={dashboardData}
              weather={weather}
            />
          </ErrorBoundary>
        </div>

        {/* Rolling Profit Forecast Card */}
        <ErrorBoundary fallbackTitle="Profit Forecast Unavailable">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 h-full">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                      Profit Forecast
                      {latestForecast?.isStale && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-normal">
                          Stale
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-400">End-of-cycle ML estimate</p>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-emerald-400 opacity-60" />
              </div>

              <div className="mt-5 space-y-2">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                  {latestForecast?.predictedProfit != null
                    ? `৳ ${Math.round(latestForecast.predictedProfit).toLocaleString()}`
                    : `৳ ${Math.round(((currentBatch?.initialChickens || 1000) * (currentBatch?.targetHarvestWeightKg || 1.8) * (currentBatch?.expectedSalePricePerKg || 165)) * 0.22).toLocaleString()}`}
                </div>
                <p className="text-[11px] text-slate-400">
                  Projected Range:{' '}
                  <span className="text-slate-200 font-semibold">
                    {latestForecast?.low != null && latestForecast?.high != null
                      ? `৳ ${Math.round(latestForecast.low).toLocaleString()} – ৳ ${Math.round(latestForecast.high).toLocaleString()}`
                      : '±15% based on standard feed conversion'}
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Expected Bird Price</span>
                <span className="text-slate-200 font-medium">৳{currentBatch?.expectedSalePricePerKg || 165}/kg</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Feed Cost Rate</span>
                <span className="text-slate-200 font-medium">৳{currentBatch?.feedCostPerKg || 65}/kg</span>
              </div>
              {latestForecast?.computedAt && (
                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>Updated</span>
                  <span>{new Date(latestForecast.computedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </ErrorBoundary>
      </div>

      {/* ─── Row 2: Daily Check-In Workflow & Guidance Box ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary fallbackTitle="Daily Check-In Card Unavailable">
          <DailyCheckInCard
            batch={currentBatch}
            todayLog={dashboardData?.todayLog}
            onLogSubmitted={() => {
              refreshActiveBatch();
            }}
          />
        </ErrorBoundary>

        <ErrorBoundary fallbackTitle="Lifecycle Guidance Unavailable">
          <GuidanceBox
            stage={stage}
            batch={currentBatch}
            tasksDue={tasksDue}
          />
        </ErrorBoundary>
      </div>

      {/* ─── Row 3: Milestone Timeline ─── */}
      <div>
        <ErrorBoundary fallbackTitle="Milestone Timeline Unavailable">
          <MilestoneTimeline
            tasks={tasksDue}
            batchId={currentBatch?._id}
          />
        </ErrorBoundary>
      </div>

      {/* ─── Modals ─── */}
      <BatchWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        defaultFarmId={activeFarmId}
        onBatchCreated={() => refreshActiveBatch()}
      />

      <BatchCloseModal
        batch={currentBatch}
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onBatchClosed={() => refreshActiveBatch()}
      />
    </div>
  );
}
