/**
 * =============================================================================
 * Module: Daily Flock Check-In Card (Morning & Evening Routines)
 * Component: /app/frontend/src/components/DailyCheckInCard.jsx
 * Description: High-speed, mobile-optimized (360px+) daily flock check-in with
 *              morning/evening auto-detection, local draft recovery, offline queue
 *              and auto-retry, red-flag symptom warnings, and optimistic updates.
 * =============================================================================
 */

import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  Scale,
  WifiOff,
  Wifi,
  Save,
  RotateCw,
  RefreshCw,
  Send,
  Sparkles,
  HelpCircle,
  FileText,
  AlertCircle,
  Camera,
  Upload,
  X,
  ShieldCheck,
  ShieldAlert,
  Stethoscope,
  ShoppingBag,
  Phone,
  Calendar,
  Check
} from 'lucide-react';
import { BatchContext } from '../context/BatchContext';

export default function DailyCheckInCard({ batch, todayLog = null, onLogSubmitted = null }) {
  const { submitDailyLog } = useContext(BatchContext);

  const getLocalDateStr = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const currentHour = now.getHours();
  const defaultMode = currentHour < 12 ? 'morning' : 'evening';
  const todayDateStr = getLocalDateStr(now);

  const formattedDate = useMemo(() => {
    try {
      const [y, m, d] = todayDateStr.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return todayDateStr;
    }
  }, [todayDateStr]);

  const [mode, setMode] = useState(defaultMode);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [offlineQueued, setOfflineQueued] = useState(false);

  // Form Fields
  const [feedCompleted, setFeedCompleted] = useState(true);
  const [waterRefilled, setWaterRefilled] = useState(true);
  const [feedAmountKg, setFeedAmountKg] = useState('');
  const [mortalityCount, setMortalityCount] = useState(0);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingDiagnosis, setUploadingDiagnosis] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [symptomNotes, setSymptomNotes] = useState('');

  const batchId = batch?._id;
  const draftKey = `agrimind_checkin_${batchId}_${todayDateStr}_${mode}`;
  const offlineQueueKey = 'agrimind_pending_submissions';

  // Completion indicators for today's routines
  const isMorningComplete = Boolean(
    todayLog?.morning?.completedAt ||
    todayLog?.morning?.feedCompleted ||
    todayLog?.morningRoutine?.completed ||
    todayLog?.morningRoutine?.completedAt
  );

  const isEveningComplete = Boolean(
    todayLog?.evening?.completedAt ||
    todayLog?.evening?.feedCompleted ||
    todayLog?.eveningRoutine?.completed ||
    todayLog?.eveningRoutine?.completedAt
  );

  // 1. Calculate live birds for validation and display
  const liveBirds = useMemo(() => {
    if (!batch) return 0;
    return Math.max(0, (batch.initialChickens || 0) - (batch.cumulativeMortality || 0));
  }, [batch]);

  // 2. Draft Storage: Load draft or prepopulate todayLog on mount / mode switch
  useEffect(() => {
    if (!batchId) return;
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.feedCompleted !== undefined) setFeedCompleted(parsed.feedCompleted);
        if (parsed.waterRefilled !== undefined) setWaterRefilled(parsed.waterRefilled);
        if (parsed.feedAmountKg !== undefined) setFeedAmountKg(parsed.feedAmountKg);
        if (parsed.mortalityCount !== undefined) setMortalityCount(parsed.mortalityCount);
        if (parsed.diagnosisResult !== undefined) setDiagnosisResult(parsed.diagnosisResult);
        if (parsed.symptomNotes !== undefined) setSymptomNotes(parsed.symptomNotes);
      } else if (todayLog) {
        // Prepopulate with already recorded values
        if (mode === 'morning') {
          const morning = todayLog.morning || todayLog.morningRoutine;
          if (morning) {
            setFeedCompleted(morning.feedCompleted !== undefined ? morning.feedCompleted : (morning.feedProvided !== undefined ? morning.feedProvided : true));
            setWaterRefilled(morning.waterRefilled !== undefined ? morning.waterRefilled : true);
          }
        } else {
          const evening = todayLog.evening || todayLog.eveningRoutine;
          if (evening) {
            setFeedCompleted(evening.feedCompleted !== undefined ? evening.feedCompleted : (evening.feedProvided !== undefined ? evening.feedProvided : true));
            if (todayLog.feedAmountKg || evening.feedWeightKg) {
              setFeedAmountKg(String(todayLog.feedAmountKg || evening.feedWeightKg));
            }
          }
        }
        if (todayLog.mortalityCount !== undefined) {
          setMortalityCount(todayLog.mortalityCount);
        }
      } else {
        // Reset defaults if no draft
        setFeedCompleted(true);
        setWaterRefilled(true);
        setFeedAmountKg('');
        setMortalityCount(0);
        setPhotoFile(null);
        setPhotoPreview(null);
        setDiagnosisResult(null);
        setSymptomNotes('');
      }
    } catch (_) {}
  }, [draftKey, batchId, mode, todayLog]);

  // 3. Draft Storage: Save draft on any form field change
  const saveDraft = useCallback(() => {
    if (!batchId) return;
    try {
      const draftData = {
        feedCompleted,
        waterRefilled,
        feedAmountKg,
        mortalityCount,
        diagnosisResult,
        symptomNotes,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    } catch (_) {}
  }, [draftKey, batchId, feedCompleted, waterRefilled, feedAmountKg, mortalityCount, diagnosisResult, symptomNotes]);

  useEffect(() => {
    saveDraft();
  }, [saveDraft]);

  // 4. Offline Connection Listener & Auto-Retry Engine
  const flushOfflineQueue = useCallback(async () => {
    try {
      const rawQueue = localStorage.getItem(offlineQueueKey);
      if (!rawQueue) return;
      const queue = JSON.parse(rawQueue);
      if (!Array.isArray(queue) || queue.length === 0) return;

      console.log(`[OfflineEngine] Attempting to flush ${queue.length} pending logs...`);
      const remaining = [];

      for (const item of queue) {
        try {
          const res = await submitDailyLog(item.batchId, item.payload);
          if (res.success) {
            console.log(`[OfflineEngine] Log synced successfully for batch ${item.batchId}`);
            // Remove corresponding draft
            localStorage.removeItem(`agrimind_checkin_${item.batchId}_${item.logDay}_${item.mode}`);
          } else {
            remaining.push(item);
          }
        } catch {
          remaining.push(item);
        }
      }

      if (remaining.length > 0) {
        localStorage.setItem(offlineQueueKey, JSON.stringify(remaining));
        setOfflineQueued(true);
      } else {
        localStorage.removeItem(offlineQueueKey);
        setOfflineQueued(false);
        setStatusMessage({ type: 'success', text: 'All offline check-ins synchronized!' });
      }
    } catch (err) {
      console.warn('Queue flush error:', err.message);
    }
  }, [submitDailyLog]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for pending queue on mount
    if (navigator.onLine) {
      flushOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushOfflineQueue]);

  // Handle Droppings Photo Upload & Quick Diagnosis Inference
  const handleDiagnosisPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setUploadingDiagnosis(true);
    setDiagnosisResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      if (batch?.farmId) formData.append('farmId', batch.farmId);
      if (batchId) formData.append('batchId', batchId);

      const res = await fetch('/api/predict/disease', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setDiagnosisResult(data);
    } catch (err) {
      console.error('Diagnosis failed:', err);
      setDiagnosisResult({
        success: false,
        error: 'AI analysis connection issue. Please retry with a clear photo.',
      });
    } finally {
      setUploadingDiagnosis(false);
    }
  };

  const clearDiagnosisPhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      try { URL.revokeObjectURL(photoPreview); } catch (_) {}
    }
    setPhotoPreview(null);
    setDiagnosisResult(null);
  };

  const isDiseaseDetected = Boolean(
    diagnosisResult?.success &&
    diagnosisResult.prediction &&
    diagnosisResult.prediction !== 'Healthy' &&
    diagnosisResult.prediction !== 'unclear_result'
  );

  const hasRedFlag = isDiseaseDetected && (
    ['coccidiosis', 'newcastle', 'salmonella', 'blood'].some(d =>
      (diagnosisResult.prediction || '').toLowerCase().includes(d)
    )
  );

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setStatusMessage(null);

    if (!batchId) {
      setStatusMessage({ type: 'error', text: 'No active batch selected.' });
      return;
    }

    // Mortality safety validation
    const numMortality = Number(mortalityCount) || 0;
    if (numMortality < 0) {
      setStatusMessage({ type: 'error', text: 'Mortality cannot be negative.' });
      return;
    }
    if (numMortality > liveBirds) {
      setStatusMessage({
        type: 'error',
        text: `Mortality (${numMortality}) exceeds current live flock population (${liveBirds}).`
      });
      return;
    }

    // Symptoms from AI Diagnosis
    const observedSymptoms = isDiseaseDetected
      ? [diagnosisResult.prediction.toLowerCase().replace(/\s+/g, '_')]
      : [];

    // Notes derived exclusively from AI Droppings Diagnosis — no manual symptom text field
    const finalNotes = [
      diagnosisResult?.success && diagnosisResult?.prediction
        ? `[AI Droppings Scan: ${diagnosisResult.prediction}${diagnosisResult.confidence ? ` (${(diagnosisResult.confidence * 100).toFixed(0)}%)` : ''}]`
        : ''
    ].filter(Boolean).join(' | ');

    // Build payload according to DailyLog schema
    const payload = {
      logDay: todayDateStr,
      session: mode,
      mortalityCount: numMortality,
      observedSymptoms,
      symptomNotes: finalNotes || undefined,
    };

    if (mode === 'morning') {
      payload.feedCompleted = feedCompleted;
      payload.waterRefilled = waterRefilled;
    } else {
      payload.feedCompleted = feedCompleted;
      if (feedAmountKg !== '') {
        payload.feedAmountKg = Number(feedAmountKg);
      }
    }

    // If offline, store in offline queue
    if (!navigator.onLine) {
      try {
        const rawQueue = localStorage.getItem(offlineQueueKey);
        const queue = rawQueue ? JSON.parse(rawQueue) : [];
        queue.push({ batchId, logDay: todayDateStr, mode, payload, queuedAt: new Date().toISOString() });
        localStorage.setItem(offlineQueueKey, JSON.stringify(queue));
        setOfflineQueued(true);
        setStatusMessage({
          type: 'warning',
          text: 'Offline: Routine saved locally. Will auto-sync once internet reconnects.'
        });
        return;
      } catch (_) {}
    }

    setSubmitting(true);
    try {
      const res = await submitDailyLog(batchId, payload);
      if (res.success) {
        // Clear draft on successful write
        localStorage.removeItem(draftKey);
        clearDiagnosisPhoto();
        setSymptomNotes('');
        setStatusMessage({
          type: 'success',
          text: `${mode === 'morning' ? 'Morning' : 'Evening'} check-in recorded successfully!`
        });
        if (onLogSubmitted) onLogSubmitted(res);
      } else {
        // Network or API failure fallback to offline queue
        const rawQueue = localStorage.getItem(offlineQueueKey);
        const queue = rawQueue ? JSON.parse(rawQueue) : [];
        queue.push({ batchId, logDay: todayDateStr, mode, payload, queuedAt: new Date().toISOString() });
        localStorage.setItem(offlineQueueKey, JSON.stringify(queue));
        setOfflineQueued(true);
        setStatusMessage({
          type: 'warning',
          text: `Submission note: ${res.message}. Saved locally for auto-retry.`
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'warning',
        text: 'Network timeout: Saved in offline queue and will sync automatically.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
      {/* ─── Header & Routine Switcher ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-sm ${
              mode === 'morning'
                ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                : 'bg-indigo-500/10 border border-indigo-500/25 text-indigo-400'
            }`}
          >
            {mode === 'morning' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-slate-100 tracking-tight">
                Daily Flock Check-In
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/90 border border-slate-700/60 text-slate-300 whitespace-nowrap shadow-sm">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{formattedDate}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {mode === 'morning' ? 'Morning Inspection (Water & Feed Check)' : 'Evening Feed & Population Census'}
            </p>
          </div>
        </div>

        {/* Routine Mode Switcher & Telemetry Status */}
        <div className="flex items-center gap-2.5 self-start md:self-center">
          <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800/90 shadow-inner">
            <button
              type="button"
              onClick={() => setMode('morning')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mode === 'morning'
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Morning</span>
              {isMorningComplete && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  <span>Done</span>
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMode('evening')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mode === 'evening'
                  ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Evening</span>
              {isEveningComplete && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  <span>Done</span>
                </span>
              )}
            </button>
          </div>

          <div
            title={isOnline ? 'Online — Telemetry live & auto-syncing' : 'Offline — Changes safely stored locally'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-xs font-medium text-slate-300 shadow-inner"
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'} shrink-0`} />
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              {isOnline ? 'Live Sync' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Routine Completed Notice ─── */}
      {((mode === 'morning' && isMorningComplete) || (mode === 'evening' && isEveningComplete)) && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>{mode === 'morning' ? 'Morning' : 'Evening'} routine recorded.</strong> You can modify values below and save updates.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
            Recorded
          </span>
        </div>
      )}

      {/* ─── Feedback & Status Alerts ─── */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl flex items-center gap-3 text-xs border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : statusMessage.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="flex-1 font-medium">{statusMessage.text}</span>
        </div>
      )}

      {offlineQueued && (
        <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 text-[11px] text-amber-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
            Offline queue active: check-ins will automatically sync when network returns.
          </span>
          <button
            onClick={flushOfflineQueue}
            className="text-[10px] underline font-bold hover:text-amber-200 ml-2"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* ─── Form Body ─── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Morning Checklist */}
        {mode === 'morning' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                feedCompleted
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-100'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Scale className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold block">Feed Distributed</span>
                  <span className="text-[10px] text-slate-400">Morning ration supplied</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={feedCompleted}
                onChange={(e) => setFeedCompleted(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-500 bg-slate-950 border-slate-800 focus:ring-emerald-500"
              />
            </label>

            <label
              className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                waterRefilled
                  ? 'bg-teal-500/10 border-teal-500/40 text-slate-100'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Droplets className="w-4 h-4 text-teal-400" />
                <div>
                  <span className="text-xs font-bold block">Water Refilled</span>
                  <span className="text-[10px] text-slate-400">Clean drinking water checked</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={waterRefilled}
                onChange={(e) => setWaterRefilled(e.target.checked)}
                className="w-5 h-5 rounded text-teal-500 bg-slate-950 border-slate-800 focus:ring-teal-500"
              />
            </label>
          </div>
        ) : (
          /* Evening Checklist & Feed Weight */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                feedCompleted
                  ? 'bg-indigo-500/10 border-indigo-500/40 text-slate-100'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Scale className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-xs font-bold block">Evening Feeding Completed</span>
                  <span className="text-[10px] text-slate-400">Troughs cleaned and replenished</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={feedCompleted}
                onChange={(e) => setFeedCompleted(e.target.checked)}
                className="w-5 h-5 rounded text-indigo-500 bg-slate-950 border-slate-800 focus:ring-indigo-500"
              />
            </label>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <label className="block text-xs font-bold text-slate-200">
                Total Feed Used Today (kg)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="e.g. 45"
                value={feedAmountKg}
                onChange={(e) => setFeedAmountKg(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Mortality Count Input */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              Mortality Count (Birds Dead Today)
            </label>
            <span className="text-[11px] text-slate-400">
              Live Flock: <strong className="text-emerald-400">{liveBirds}</strong> birds
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max={liveBirds}
              value={mortalityCount}
              onChange={(e) => setMortalityCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-24 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-bold text-sm text-center focus:outline-none focus:border-rose-500 transition-colors"
            />
            {/* Quick increment buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMortalityCount(0)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300"
              >
                0 (Zero)
              </button>
              <button
                type="button"
                onClick={() => setMortalityCount(prev => Math.min(liveBirds, prev + 1))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-rose-300"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => setMortalityCount(prev => Math.min(liveBirds, prev + 5))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-rose-300"
              >
                +5
              </button>
            </div>
          </div>
        </div>

        {/* ─── Quick Diagnosis (Droppings Photo & AI Analysis) ─── */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Camera className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  Quick Health Diagnosis
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-rose-500/20 text-rose-300">
                    AI Droppings Scan
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Upload droppings photo to check for Coccidiosis, Salmonella, or Newcastle
                </p>
              </div>
            </div>
            {photoPreview && (
              <button
                type="button"
                onClick={clearDiagnosisPhoto}
                className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 font-semibold"
              >
                <X className="w-3.5 h-3.5" /> Remove Photo
              </button>
            )}
          </div>

          {!photoPreview ? (
            <label className={`block w-full p-4 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
              uploadingDiagnosis
                ? 'border-amber-500/50 bg-amber-500/5'
                : 'border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/5 bg-slate-900/40'
            }`}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleDiagnosisPhoto}
                disabled={uploadingDiagnosis}
                className="hidden"
              />
              {uploadingDiagnosis ? (
                <div className="flex items-center justify-center gap-2 text-amber-400 py-1">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-bold">Analyzing droppings pattern...</span>
                </div>
              ) : (
                <div className="space-y-1 py-1">
                  <div className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center mx-auto text-rose-400 mb-1.5">
                    <Upload className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-200">Tap to upload droppings photo</p>
                  <p className="text-[10px] text-slate-500">Take a photo with your camera or select from gallery (optional)</p>
                </div>
              )}
            </label>
          ) : (
            <div className="space-y-3">
              {/* Photo Preview & AI Inference Result */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 relative">
                <img
                  src={photoPreview}
                  alt="Droppings preview"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  {uploadingDiagnosis ? (
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold py-2">
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>Diagnosing with EfficientNet AI model...</span>
                    </div>
                  ) : diagnosisResult?.success ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          diagnosisResult.prediction === 'Healthy'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : diagnosisResult.prediction === 'unclear_result'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        }`}>
                          {String(diagnosisResult.prediction || 'Unknown')}
                        </span>
                        {diagnosisResult.confidence != null && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(Number(diagnosisResult.confidence) * 100).toFixed(1)}% confidence
                          </span>
                        )}
                        {diagnosisResult.model_source && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                            AI Model
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {diagnosisResult.advisory?.description || (
                          diagnosisResult.prediction === 'Healthy'
                            ? 'Flock droppings appear normal and healthy.'
                            : diagnosisResult.prediction === 'unclear_result'
                            ? 'Image was unclear. Retake a closer, well-lit photo if abnormalities persist.'
                            : 'Pathological symptoms detected. Flock status flagged for immediate attention.'
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-rose-400 py-1">
                      {diagnosisResult?.error || diagnosisResult?.message || 'Analysis failed. Tap Remove Photo to try again.'}
                    </div>
                  )}
                </div>

                {/* Remove photo button */}
                <button
                  type="button"
                  onClick={clearDiagnosisPhoto}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors shrink-0"
                  title="Remove droppings photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Probability Distribution if available */}
              {diagnosisResult?.probabilities && Object.keys(diagnosisResult.probabilities).length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Probability Distribution:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(diagnosisResult.probabilities).map(([cls, prob]) => {
                      const pct = (Number(prob) * 100).toFixed(0);
                      const isWinner = cls === diagnosisResult.prediction;
                      return (
                        <div key={cls} className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className={isWinner ? 'text-slate-100 font-bold' : 'text-slate-400'}>{cls}</span>
                            <span className={isWinner ? 'text-emerald-400 font-bold' : 'text-slate-500'}>{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isWinner ? 'bg-emerald-400' : 'bg-slate-600'}`}
                              style={{ width: `${Math.max(parseFloat(pct), 4)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Observed Symptoms */}
              {diagnosisResult?.advisory?.symptoms && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                  <span className="font-bold text-amber-300 block text-[10px] uppercase tracking-wider">
                    Key Observed Symptoms:
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{diagnosisResult.advisory.symptoms}</p>
                </div>
              )}

              {/* Veterinary Referral Requirement */}
              {diagnosisResult?.vetReferralRequired && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Veterinary referral required: This condition requires authorized prescription or quarantine.</span>
                </div>
              )}

              {/* Treatment & Care guidelines for detected diseases */}
              {isDiseaseDetected && (
                ((Array.isArray(diagnosisResult?.treatments) && diagnosisResult.treatments.length > 0) ||
                 (Array.isArray(diagnosisResult?.supportiveCare) && diagnosisResult.supportiveCare.length > 0) ||
                 diagnosisResult?.advisory?.recommended_treatment)
              ) && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Recommended Treatment & Biosecurity Protocol:</span>
                  </div>

                  {diagnosisResult?.advisory?.recommended_treatment && (
                    <p className="text-[11px] text-rose-200/95 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-rose-500/20">
                      {typeof diagnosisResult.advisory.recommended_treatment === 'string'
                        ? diagnosisResult.advisory.recommended_treatment
                        : JSON.stringify(diagnosisResult.advisory.recommended_treatment)}
                    </p>
                  )}

                  {/* Treatments list (supports strings OR objects with activeIngredients, supportiveCare, withdrawalNotes) */}
                  {Array.isArray(diagnosisResult?.treatments) && diagnosisResult.treatments.length > 0 && (
                    <div className="space-y-2">
                      {diagnosisResult.treatments.map((t, idx) => {
                        if (typeof t === 'string') {
                          return (
                            <div key={idx} className="p-2 rounded-xl bg-slate-900/80 border border-rose-500/20 text-[11px]">
                              {t}
                            </div>
                          );
                        }

                        // t is an object
                        return (
                          <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-500/20 space-y-1.5 text-[11px]">
                            {Array.isArray(t?.activeIngredients) && t.activeIngredients.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="text-slate-400 text-[10px]">Active Ingredients:</span>
                                {t.activeIngredients.map((ing, iIdx) => (
                                  <span key={iIdx} className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-semibold font-mono">
                                    {String(ing)}
                                  </span>
                                ))}
                              </div>
                            )}
                            {t?.supportiveCare && (
                              <p className="text-rose-200/90">
                                <strong>Care: </strong>{String(t.supportiveCare)}
                              </p>
                            )}
                            {t?.withdrawalNotes && (
                              <p className="text-[10px] text-amber-400/90 font-medium">
                                ⚠️ {String(t.withdrawalNotes)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Supportive care list if present */}
                  {Array.isArray(diagnosisResult?.supportiveCare) && diagnosisResult.supportiveCare.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-200/90 pl-1">
                      {diagnosisResult.supportiveCare.slice(0, 3).map((c, idx) => (
                        <li key={idx}>{typeof c === 'string' ? c : (c?.text || c?.description || JSON.stringify(c))}</li>
                      ))}
                    </ul>
                  )}

                  {/* Recommended products matching this disease if present */}
                  {Array.isArray(diagnosisResult?.products) && diagnosisResult.products.length > 0 && (
                    <div className="pt-1 border-t border-rose-500/20">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" /> Matched Veterinary Supplies ({diagnosisResult.products.length}):
                        </span>
                        <span className="text-[9px] text-slate-500">Verified AgriShop</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {diagnosisResult.products.slice(0, 4).map(prod => (
                          <div key={prod._id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] flex justify-between items-center gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-200 truncate">{prod.name}</p>
                              <p className="text-[10px] text-slate-400">{prod.unit} • {prod.sellerName || 'AgriMind Supplier'}</p>
                            </div>
                            <span className="shrink-0 font-bold text-emerald-400 text-xs">৳{prod.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-rose-400/80 pt-0.5">
                    Isolate affected birds immediately and consult a registered veterinarian if mortality rises.
                  </p>
                </div>
              )}
            </div>
          )}

          {hasRedFlag && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span>Critical disease detected: Batch status will update to "Attention Required".</span>
            </div>
          )}

          {/* Observations/symptoms text field removed — diagnosis comes from droppings photo only */}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin" /> Saving Routine...
            </span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {mode === 'morning'
                ? (isMorningComplete ? 'Update Morning Check-In' : 'Save Morning Check-In')
                : (isEveningComplete ? 'Update Evening Check-In' : 'Save Evening Check-In')}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
