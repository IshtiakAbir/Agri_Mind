/**
 * =============================================================================
 * Module: Batch Creation Wizard (Smart Poultry Onboarding)
 * Component: /app/frontend/src/components/BatchWizard.jsx
 * Description: Multi-step guided modal for creating poultry batches with
 *              breed schedules, mid-cycle start age handling, hatchery vaccination
 *              checks, and initial economic targets.
 * =============================================================================
 */

import React, { useState, useContext, useEffect } from 'react';
import {
  X,
  Bird,
  Calendar,
  DollarSign,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Layers,
  HelpCircle,
  Warehouse
} from 'lucide-react';
import { BatchContext } from '../context/BatchContext';
import { AuthContext } from '../context/AuthContext';

const BREED_PROFILES = [
  {
    type: 'Broiler',
    cycleDays: 35,
    defaultHarvestKg: 1.85,
    defaultChickCost: 40,
    defaultSalePrice: 165,
    defaultFeedCost: 68,
    description: 'Fast-growing meat bird with 35-day turnaround and high FCR sensitivity.',
    badge: 'Fast Turnaround'
  },
  {
    type: 'Sonali',
    cycleDays: 70,
    defaultHarvestKg: 0.95,
    defaultChickCost: 35,
    defaultSalePrice: 280,
    defaultFeedCost: 65,
    description: 'High-demand crossbreed with premium meat value and 70-day growth curve.',
    badge: 'Premium Value'
  },
  {
    type: 'Desi',
    cycleDays: 90,
    defaultHarvestKg: 1.20,
    defaultChickCost: 30,
    defaultSalePrice: 380,
    defaultFeedCost: 60,
    description: 'Hardy indigenous breed with highest local market price and free-range adaptability.',
    badge: 'Hardy & Resilient'
  },
  {
    type: 'Cock',
    cycleDays: 60,
    defaultHarvestKg: 1.10,
    defaultChickCost: 25,
    defaultSalePrice: 220,
    defaultFeedCost: 62,
    description: 'Layer cockerel raised for tender meat with moderate cycle length.',
    badge: 'Economical DOC'
  },
  {
    type: 'Layer',
    cycleDays: 504,
    defaultHarvestKg: 1.70,
    defaultChickCost: 60,
    defaultSalePrice: 250,
    defaultFeedCost: 66,
    description: 'Long-term egg production flock spanning 72 weeks with high biosecurity demands.',
    badge: 'Long-term Egg Flocks'
  }
];

const COMMON_HATCHERY_VACCINES = [
  { key: 'mareks', label: "Marek's Disease (HVT Subcutaneous)", defaultChecked: true },
  { key: 'nd_b1', label: 'Newcastle Disease (ND B1 / Clone Spray)', defaultChecked: true },
  { key: 'ib_ma5', label: 'Infectious Bronchitis (IB Ma5 / H120)', defaultChecked: false },
  { key: 'ibd_cx', label: 'Gumboro Immune-Complex (In-Ovo / Hatchery)', defaultChecked: false },
];

export default function BatchWizard({ isOpen, onClose, defaultFarmId = null, onBatchCreated = null }) {
  const { createBatch } = useContext(BatchContext);
  const { language } = useContext(AuthContext);

  const [step, setStep] = useState(1);
  const [farms, setFarms] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    farmId: defaultFarmId || '',
    batchName: '',
    chickenType: 'Broiler',
    initialChickens: 500,
    batchStartDate: new Date().toISOString().split('T')[0],
    initialAverageAgeDays: 0,
    shedName: 'Shed 1',
    targetHarvestWeightKg: 1.85,
    chickCostPerBird: 40,
    expectedSalePricePerKg: 165,
    feedCostPerKg: 68,
    miscCostBudget: 5000,
    vaccinationsAlreadyGiven: ['mareks', 'nd_b1'],
  });

  // Load user farms if not provided
  useEffect(() => {
    if (isOpen) {
      fetch('/api/farms')
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.farms) && data.farms.length > 0) {
            setFarms(data.farms);
            if (!formData.farmId) {
              const active = defaultFarmId || data.farms[0]._id;
              setFormData(prev => ({ ...prev, farmId: active }));
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, defaultFarmId]);

  // Sync default breed parameters when chickenType changes
  const handleBreedSelect = (breedType) => {
    const profile = BREED_PROFILES.find(b => b.type === breedType);
    if (profile) {
      setFormData(prev => ({
        ...prev,
        chickenType: breedType,
        targetHarvestWeightKg: profile.defaultHarvestKg,
        chickCostPerBird: profile.defaultChickCost,
        expectedSalePricePerKg: profile.defaultSalePrice,
        feedCostPerKg: profile.defaultFeedCost,
        batchName: prev.batchName ? prev.batchName : `${breedType} Flock ${new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
      }));
    }
  };

  const handleVaccineToggle = (key) => {
    setFormData(prev => {
      const exists = prev.vaccinationsAlreadyGiven.includes(key);
      const updated = exists
        ? prev.vaccinationsAlreadyGiven.filter(k => k !== key)
        : [...prev.vaccinationsAlreadyGiven, key];
      return { ...prev, vaccinationsAlreadyGiven: updated };
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    // Basic Validation
    if (!formData.farmId) {
      setErrorMsg('Please select a farm for this flock batch.');
      setStep(1);
      return;
    }
    if (!formData.batchName.trim()) {
      setErrorMsg('Please specify a flock batch name.');
      setStep(1);
      return;
    }
    if (!formData.initialChickens || Number(formData.initialChickens) <= 0) {
      setErrorMsg('Flock size must be at least 1 bird.');
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        farmId: formData.farmId,
        batchName: formData.batchName.trim(),
        chickenType: formData.chickenType,
        initialChickens: Number(formData.initialChickens),
        batchStartDate: formData.batchStartDate,
        initialAverageAgeDays: Number(formData.initialAverageAgeDays) || 0,
        shedName: formData.shedName.trim() || 'Shed 1',
        targetHarvestWeightKg: Number(formData.targetHarvestWeightKg) || 1.8,
        chickCostPerBird: Number(formData.chickCostPerBird) || 0,
        expectedSalePricePerKg: Number(formData.expectedSalePricePerKg) || 0,
        feedCostPerKg: Number(formData.feedCostPerKg) || 0,
        miscCostBudget: Number(formData.miscCostBudget) || 0,
        vaccinationsAlreadyGiven: formData.vaccinationsAlreadyGiven,
      };

      const res = await createBatch(payload);
      if (res.success) {
        if (onBatchCreated) onBatchCreated(res.batch);
        onClose();
      } else {
        setErrorMsg(res.message || 'Error creating flock batch.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit flock batch.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentProfile = BREED_PROFILES.find(b => b.type === formData.chickenType) || BREED_PROFILES[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-950/50">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Bird className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                New Flock Onboarding
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Smart Poultry
                </span>
              </h2>
              <p className="text-xs text-slate-400">Step {step} of 3 • Guided Setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body (Step Form) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* ──────────────── STEP 1: Breed & Flock Identification ──────────────── */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              {/* Farm Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-emerald-400" />
                  Target Farm Location
                </label>
                <select
                  value={formData.farmId}
                  onChange={(e) => setFormData({ ...formData, farmId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="" disabled>Select a farm...</option>
                  {farms.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.city || 'Dhaka'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Breed Selection Cards */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Poultry Breed
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {BREED_PROFILES.map((breed) => {
                    const isSelected = formData.chickenType === breed.type;
                    return (
                      <button
                        key={breed.type}
                        type="button"
                        onClick={() => handleBreedSelect(breed.type)}
                        className={`text-left p-3 rounded-2xl border transition-all relative ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-slate-100 shadow-md shadow-emerald-950/40'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-200">{breed.type}</span>
                          <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                            {breed.cycleDays}d
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {breed.description}
                        </p>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Batch Name & Birds Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Flock / Batch Name
                  </label>
                  <input
                    type="text"
                    value={formData.batchName}
                    placeholder="e.g. Broiler Batch 2026-A"
                    onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Initial Birds Count (DOC)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.initialChickens}
                    onChange={(e) => setFormData({ ...formData, initialChickens: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Start Date & Age at Arrival */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Batch Placement Date
                  </label>
                  <input
                    type="date"
                    value={formData.batchStartDate}
                    onChange={(e) => setFormData({ ...formData, batchStartDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Flock Age at Arrival (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={formData.initialAverageAgeDays}
                    onChange={(e) => setFormData({ ...formData, initialAverageAgeDays: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {Number(formData.initialAverageAgeDays) > 0 && (
                    <p className="mt-1 text-[11px] text-amber-400 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" />
                      Mid-cycle purchase: earlier schedule tasks will be skipped.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: Economics & Harvest Targets ──────────────── */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-300">Financial Planning & Projections</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    These baseline benchmarks power your real-time break-even calculations, FCR alerts, and closeout profit analytics.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Chick Cost per Bird (BDT ৳)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.chickCostPerBird}
                    onChange={(e) => setFormData({ ...formData, chickCostPerBird: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Feed Cost per kg (BDT ৳)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.feedCostPerKg}
                    onChange={(e) => setFormData({ ...formData, feedCostPerKg: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Harvest Weight (kg / bird)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.targetHarvestWeightKg}
                    onChange={(e) => setFormData({ ...formData, targetHarvestWeightKg: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Expected Sale Price per kg (BDT ৳)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.expectedSalePricePerKg}
                    onChange={(e) => setFormData({ ...formData, expectedSalePricePerKg: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Shed / House Identifier
                  </label>
                  <input
                    type="text"
                    value={formData.shedName}
                    placeholder="e.g. Shed 1 (East Wing)"
                    onChange={(e) => setFormData({ ...formData, shedName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Medicines & Misc Budget (BDT ৳)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={formData.miscCostBudget}
                    onChange={(e) => setFormData({ ...formData, miscCostBudget: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 3: Biosecurity & Final Review ──────────────── */}
          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Hatchery Vaccinations Already Administered
                </label>
                <p className="text-[11px] text-slate-400 mb-3">
                  Check all vaccines confirmed given at hatchery before delivery. Corresponding Day 0/1 tasks will be pre-completed.
                </p>

                <div className="space-y-2">
                  {COMMON_HATCHERY_VACCINES.map((vax) => {
                    const isChecked = formData.vaccinationsAlreadyGiven.includes(vax.key);
                    return (
                      <label
                        key={vax.key}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-200'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-medium">{vax.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleVaccineToggle(vax.key)}
                          className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800 focus:ring-emerald-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Flock Summary</span>
                  <span className="text-xs font-bold text-emerald-400">{formData.batchName || 'Untitled'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px]">Breed:</span>
                    <p className="font-semibold text-slate-200">{formData.chickenType}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Chicks:</span>
                    <p className="font-semibold text-slate-200">{formData.initialChickens} birds</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Start Date:</span>
                    <p className="font-semibold text-slate-200">{formData.batchStartDate}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Est. Cycle:</span>
                    <p className="font-semibold text-slate-200">{currentProfile.cycleDays} days</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !formData.farmId) {
                  setErrorMsg('Please choose a farm location before proceeding.');
                  return;
                }
                setErrorMsg(null);
                setStep(step + 1);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all"
            >
              Next: {step === 1 ? 'Economics' : 'Biosecurity'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <span>Generating Lifecycle Tasks...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Launch Flock Lifecycle
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
