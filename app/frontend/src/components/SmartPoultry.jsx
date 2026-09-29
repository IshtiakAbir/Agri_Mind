/**
 * =============================================================================
 * Module: Your Farm — Flock Management Section
 * Component: /app/frontend/src/components/SmartPoultry.jsx
 * Description: Master container for "Your Farm" — shows farm selector,
 *              Farm Summary dashboard with cards, and BatchDashboard for
 *              flock batch lifecycle telemetry.
 * Route: /your-farm (protected; requires login)
 * =============================================================================
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  Bird, Warehouse, MapPin, ChevronRight, Plus, Check,
  ArrowLeft, LayoutDashboard, RefreshCw
} from 'lucide-react';
import { BatchContext } from '../context/BatchContext';
import BatchDashboard from './BatchDashboard';
import FarmSummary from './FarmSummary';
import ErrorBoundary from './ErrorBoundary';

export default function SmartPoultry({ activeFarmId, setActiveFarmId, setActiveTab }) {
  const { batches } = useContext(BatchContext);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFarm, setActiveFarm] = useState(null);
  const [view, setView] = useState('summary'); // 'summary' | 'batches'

  useEffect(() => {
    fetchFarms();
  }, [activeFarmId]);

  const fetchFarms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/farms');
      const data = await res.json();
      if (data.success && data.farms?.length > 0) {
        setFarms(data.farms);
        let current = null;
        if (activeFarmId) {
          current = data.farms.find(f => f._id === activeFarmId);
        }
        if (!current) {
          current = data.farms[0];
          setActiveFarmId(current._id);
          localStorage.setItem('farmId', current._id);
        }
        setActiveFarm(current);
      } else {
        setFarms([]);
        setActiveFarm(null);
      }
    } catch {
      setFarms([]);
      setActiveFarm(null);
    }
    finally { setLoading(false); }
  };

  const handleSelectFarm = (farm) => {
    setActiveFarm(farm);
    setActiveFarmId(farm._id);
    localStorage.setItem('farmId', farm._id);
    setView('summary');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading Your Farm...</p>
        </div>
      </div>
    );
  }

  // No farms yet — inviting empty state with Create Farm CTA
  if (farms.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-16 animate-fade-in">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl">
          <Bird className="w-12 h-12 text-emerald-400" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-100">You don't have a farm yet</h2>
          <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
            Create your first poultry farm to unlock batch management, daily check-ins, AI diagnostics, and profit forecasting.
          </p>
        </div>
        <BatchDashboard activeFarmId={activeFarmId} setActiveFarmId={setActiveFarmId} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Farm Switcher — always visible so a one-farm user can discover creating a second farm */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-emerald-400" /> Your Farms ({farms.length})
          </h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {farms.map(f => {
            const isActive = f._id === activeFarm?._id;
            return (
              <button
                key={f._id}
                onClick={() => handleSelectFarm(f)}
                className={`px-4 py-2.5 rounded-xl border text-left shrink-0 transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 border-emerald-500/50 shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800 text-emerald-400">
                    {f.chickenType}
                  </span>
                  <span className="text-xs font-bold text-slate-100 truncate max-w-[150px]">{f.farmName}</span>
                  {isActive && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" /> {f.city}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('summary')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            view === 'summary'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" /> Farm Summary
        </button>
        <button
          onClick={() => setView('batches')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            view === 'batches'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bird className="w-3.5 h-3.5" /> Batch Dashboard
        </button>
      </div>

      {/* Content */}
      <ErrorBoundary fallbackTitle="Flock View Temporarily Unavailable">
        {view === 'summary' ? (
          <FarmSummary
            farm={activeFarm}
            batches={batches.filter(b => String(b.farmId) === String(activeFarm?._id))}
            onNavigateToBatch={(batchId) => setView('batches')}
            onNavigateToDiagnosis={() => setActiveTab && setActiveTab('disease')}
          />
        ) : (
          <BatchDashboard
            activeFarmId={activeFarmId}
            setActiveFarmId={setActiveFarmId}
          />
        )}
      </ErrorBoundary>
    </div>
  );
}
