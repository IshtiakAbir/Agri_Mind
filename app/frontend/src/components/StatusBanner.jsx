/**
 * =============================================================================
 * Module: Status Banner with Reasons Expansion & Weather Alert Strip
 * Component: /app/frontend/src/components/StatusBanner.jsx
 * Description: Renders the global status of the flock ('Looks Good' vs
 *              'Attention Required') with auto-polling every 5 minutes, expandable
 *              breakdowns for all 7 reason codes, and integrated microclimate alert strips.
 * =============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Wind,
  Sun,
  Droplets,
  Thermometer,
  Clock,
  RotateCw,
  Info
} from 'lucide-react';

const REASON_EXPLANATIONS = {
  MORNING_MISSED: {
    title: 'Morning Routine Missed',
    detail: 'Morning feeder check and drinker refill was not logged prior to the 11:00 AM cutoff.',
    action: 'Complete the morning check-in immediately to verify flock hydration and morning feed supply.'
  },
  EVENING_MISSED: {
    title: 'Evening Census Missed',
    detail: 'Evening head count and daily feed consumption log was missed prior to the 8:00 PM cutoff.',
    action: 'Log the evening routine now to maintain accurate bird population and feed inventory records.'
  },
  NO_LOG_YESTERDAY: {
    title: 'Missing Yesterday Check-In',
    detail: 'No check-in or mortality logs were recorded for yesterday.',
    action: 'Submit yesterday’s historical data to avoid gaps in growth rate and health analytics.'
  },
  MORTALITY_HIGH: {
    title: 'High Mortality Rate Detected',
    detail: 'Daily mortality exceeded the 1.0% safety threshold or jumped to double the previous day rate.',
    action: 'Isolate sick birds immediately, inspect drinker lines, and consult an authorized veterinarian.'
  },
  CRITICAL_TASK_OVERDUE: {
    title: 'Critical Task Overdue',
    detail: 'A critical biosecurity vaccination or flock transition milestone has passed its due date.',
    action: 'Review pending lifecycle milestones and mark administered vaccines as complete.'
  },
  RED_FLAG_SYMPTOM: {
    title: 'Red-Flag Symptom Reported',
    detail: 'Flock log reported respiratory distress, bloody droppings, or sudden mortality clusters.',
    action: 'Activate emergency farm biosecurity protocols and submit droppings/birds for disease diagnostics.'
  },
  WEATHER_ALERT: {
    title: 'Active Microclimate Hazard',
    detail: 'Excessive heat index, dangerous humidity, or cold snap detected at shed location.',
    action: 'Deploy environmental mitigation measures (ventilation, foggers, electrolyte water).'
  }
};

export default function StatusBanner({ batchId, initialEvaluation = null, weatherAlerts = [] }) {
  const [evaluation, setEvaluation] = useState(
    initialEvaluation || { status: 'Looks Good', reasons: [], evaluatedAt: new Date().toISOString() }
  );
  const [expanded, setExpanded] = useState(false);
  const [polling, setPolling] = useState(false);

  // Poll status endpoint: GET /api/batches/:id/status
  const fetchStatus = useCallback(async () => {
    if (!batchId) return;
    try {
      setPolling(true);
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const res = await fetch(`/api/batches/${batchId}/status`, { headers });
      const data = await res.json();
      if (data.success) {
        // Backend returns { success, status, reasons, evaluatedAt } at top level
        const eval_ = data.evaluation || {
          status: data.status || 'Looks Good',
          reasons: data.reasons || [],
          evaluatedAt: data.evaluatedAt || new Date().toISOString(),
        };
        setEvaluation(eval_);
      }
    } catch (err) {
      console.warn('Status poll note:', err.message);
    } finally {
      setPolling(false);
    }
  }, [batchId]);

  // Sync when initialEvaluation prop updates
  useEffect(() => {
    if (initialEvaluation) {
      setEvaluation(initialEvaluation);
    }
  }, [initialEvaluation]);

  // 5-minute Auto-Polling Interval (300,000 ms)
  useEffect(() => {
    if (!batchId) return;

    // Fetch immediately if no initial evaluation provided
    if (!initialEvaluation) {
      fetchStatus();
    }

    const intervalId = setInterval(() => {
      fetchStatus();
    }, 300000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [batchId, fetchStatus, initialEvaluation]);

  const isAttentionRequired = evaluation.status === 'Attention Required';
  const reasons = Array.isArray(evaluation.reasons) ? evaluation.reasons : [];

  return (
    <div className="space-y-3">
      {/* ─── Main Status Banner ─── */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          isAttentionRequired
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isAttentionRequired
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {isAttentionRequired ? (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-100">
                  {isAttentionRequired ? 'Attention Required' : 'Looks Good — All Routines Complete'}
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isAttentionRequired
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isAttentionRequired ? `${reasons.length} Flags` : 'Optimal'}
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1">
                {isAttentionRequired
                  ? 'Active operational flags detected. Tap below to see specific reasons and recommended actions.'
                  : 'Daily feed logs, drinker checks, and ambient biosecurity parameters are currently within normal thresholds.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={fetchStatus}
              title="Refresh status evaluation"
              className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCw className={`w-3.5 h-3.5 ${polling ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            {isAttentionRequired && reasons.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span className="hidden sm:inline">{expanded ? 'Hide Details' : 'View Reasons'}</span>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* ─── Expandable Reasons Breakdown ─── */}
        {isAttentionRequired && expanded && reasons.length > 0 && (
          <div className="mt-4 pt-4 border-t border-amber-500/20 space-y-2.5 animate-fadeIn">
            {reasons.map((reasonItem, idx) => {
              // Safely extract code, message, and severity whether reasonItem is a string or an object
              const code = typeof reasonItem === 'string'
                ? reasonItem
                : (reasonItem?.code || reasonItem?.reason || `FLAG_${idx + 1}`);

              const customMessage = typeof reasonItem === 'object' && reasonItem?.message
                ? reasonItem.message
                : null;

              const severity = typeof reasonItem === 'object' && reasonItem?.severity
                ? reasonItem.severity
                : 'Warning';

              const info = REASON_EXPLANATIONS[code] || {
                title: typeof code === 'string' ? code.replace(/_/g, ' ') : 'Attention Required',
                detail: customMessage || 'Standard flock evaluation threshold triggered.',
                action: 'Review routine logs and flock conditions.'
              };

              return (
                <div
                  key={typeof code === 'string' ? `${code}-${idx}` : idx}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-amber-500/30 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      {info.title}
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {typeof code === 'string' ? code : severity}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {customMessage || info.detail}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    ⚡ <strong>Recommended Action:</strong> {info.action}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Weather Alert Strip ─── */}
      {weatherAlerts && weatherAlerts.length > 0 && (
        <div className="space-y-2">
          {weatherAlerts.map((alert, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300">
                    {typeof alert === 'string' ? alert : (alert?.message || alert?.title || 'Weather Advisory')}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {alert?.severity || 'Warning'}
                  </span>
                </div>
                {(alert?.advice || alert?.description) && (
                  <p className="text-slate-300 text-[11px] mt-1">
                    💡 <strong>Advisory:</strong> {alert.advice || alert.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
