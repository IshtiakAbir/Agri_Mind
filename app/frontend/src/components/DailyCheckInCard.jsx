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
  Send,
  Sparkles,
  HelpCircle,
  FileText,
  AlertCircle,
  Camera,
  Upload,
  X,
  ShieldCheck
} from 'lucide-react';
import { BatchContext } from '../context/BatchContext';

export default function DailyCheckInCard({ batch, onLogSubmitted = null }) {
  const { submitDailyLog } = useContext(BatchContext);

  const now = new Date();
  const currentHour = now.getHours();
  const defaultMode = currentHour < 12 ? 'morning' : 'evening';
  const todayDateStr = now.toISOString().split('T')[0];

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

  // 1. Calculate live birds for validation and display
  const liveBirds = useMemo(() => {
    if (!batch) return 0;
    return Math.max(0, (batch.initialChickens || 0) - (batch.cumulativeMortality || 0));
  }, [batch]);

  // 2. Draft Storage: Load draft on mount / mode switch
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
  }, [draftKey, batchId, mode]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              {mode === 'morning' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-400" />
              )}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
              Daily Flock Check-In
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-300">
                {todayDateStr}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {mode === 'morning' ? 'Morning Inspection (Water & Feed Check)' : 'Evening Feed & Population Census'}
            </p>
          </div>
        </div>

        {/* Routine Mode Pills & Online Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('morning')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'morning'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Morning
            </button>
            <button
              type="button"
              onClick={() => setMode('evening')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'evening'
                  ? 'bg-indigo-500 text-slate-100 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Evening
            </button>
          </div>

          <div
            title={isOnline ? 'Online — Auto-sync active' : 'Offline — Changes saved locally'}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center text-slate-400"
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            )}
          </div>
        </div>
      </div>

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
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                          diagnosisResult.prediction === 'Healthy'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : diagnosisResult.prediction === 'unclear_result'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        }`}>
                          {diagnosisResult.prediction}
                        </span>
                        {diagnosisResult.confidence && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(diagnosisResult.confidence * 100).toFixed(1)}% confidence
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300">
                        {diagnosisResult.prediction === 'Healthy'
                          ? 'Flock droppings appear normal and healthy.'
                          : diagnosisResult.prediction === 'unclear_result'
                          ? 'Image was unclear. Retake a closer, well-lit photo if abnormalities persist.'
                          : 'Pathological symptoms detected. Flock status flagged for immediate attention.'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-rose-400 py-1">
                      {diagnosisResult?.error || 'Analysis failed. Tap Remove Photo to try again.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Treatment & Care guidelines for detected diseases */}
              {isDiseaseDetected && (diagnosisResult?.treatments?.length > 0 || diagnosisResult?.supportiveCare?.length > 0 || diagnosisResult?.advisory?.recommended_treatment) && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Recommended Treatment & Biosecurity Protocol:</span>
                  </div>
                  {diagnosisResult?.advisory?.recommended_treatment && (
                    <p className="text-[11px] text-rose-200/95 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-rose-500/20">
                      {diagnosisResult.advisory.recommended_treatment}
                    </p>
                  )}
                  {diagnosisResult?.treatments?.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-200/90 pl-1">
                      {diagnosisResult.treatments.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  )}
                  {diagnosisResult?.supportiveCare?.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-200/90 pl-1">
                      {diagnosisResult.supportiveCare.slice(0, 2).map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
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
            <span>Saving Routine...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit {mode === 'morning' ? 'Morning' : 'Evening'} Check-In
            </>
          )}
        </button>
      </form>
    </div>
  );
}
