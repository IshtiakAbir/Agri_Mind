import React, { useState, useEffect } from 'react';
import {
  Warehouse, Plus, MapPin, Users, Bird, Calendar, Phone,
  Activity, DollarSign, Trash2, Pencil, RefreshCw, CheckCircle2,
  Clock, ChevronRight, AlertCircle, X, Layers, TrendingUp, TrendingDown,
  PieChart, ShieldAlert, Sparkles, Droplets, ArrowRight,
  ChevronDown, Check, LayoutDashboard
} from 'lucide-react';
import WeatherWidget from './WeatherWidget';

const CHICKEN_TYPES = ['Sonali', 'Broiler', 'Desi', 'Cock', 'Layer'];

export default function MyFarm({
  activeFarmId,
  setActiveFarmId,
  setActiveTab
}) {
  const [farms, setFarms] = useState([]);
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch all registered farms
  const fetchAllFarms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/farms');
      const data = await res.json();
      if (data.success && data.farms && data.farms.length > 0) {
        setFarms(data.farms);
        
        let currentFarm = null;
        if (activeFarmId) {
          currentFarm = data.farms.find(f => f._id === activeFarmId);
        }
        if (!currentFarm) {
          currentFarm = data.farms[0];
          setActiveFarmId(currentFarm._id);
          localStorage.setItem('farmId', currentFarm._id);
        }
        setFarm(currentFarm);
        if (currentFarm) {
          fetchRecentActivity(currentFarm._id);
        }
      } else {
        setFarms([]);
        setFarm(null);
      }
    } catch {
      setFarms([]);
      setFarm(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFarms();
  }, [activeFarmId]);

  const fetchRecentActivity = async (farmId) => {
    try {
      const res = await fetch(`/api/history?farmId=${farmId}&limit=6`);
      const data = await res.json();
      if (data.success) {
        setRecentActivity(data.history || []);
      }
    } catch {
      setRecentActivity([]);
    }
  };

  const handleSelectFarm = (selectedFarm) => {
    setFarm(selectedFarm);
    setActiveFarmId(selectedFarm._id);
    localStorage.setItem('farmId', selectedFarm._id);
    setIsEditing(false);
    fetchRecentActivity(selectedFarm._id);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/farms/${farm._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success && data.farm) {
        setFarm(data.farm);
        setIsEditing(false);
        fetchAllFarms();
      } else {
        setError(data.error || 'Failed to update farm.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/farms/${farm._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setShowDeleteConfirm(false);
        const remaining = farms.filter(f => f._id !== farm._id);
        setFarms(remaining);
        if (remaining.length > 0) {
          handleSelectFarm(remaining[0]);
        } else {
          setFarm(null);
          setActiveFarmId(null);
          localStorage.removeItem('farmId');
          setRecentActivity([]);
        }
      }
    } catch {
      setError('Failed to delete farm.');
    }
  };

  const startEditing = () => {
    setFormData({
      farmName: farm.farmName || '',
      ownerName: farm.ownerName || '',
      phoneNumber: farm.phoneNumber || '',
      country: farm.country || 'Bangladesh',
      city: farm.city || 'Dhaka',
      chickenType: farm.chickenType || 'Broiler',
      initialChickens: farm.initialChickens || farm.totalChickens || 1700,
      averageChickens: farm.averageChickens || 1650,
      ageMonths: farm.ageMonths || 2,
      feedKg: farm.feedKg || 5500,
      mortality: farm.mortality || 50,
      feedPricePerKg: farm.feedPricePerKg || 53.25,
      averageMarketEggPrice: farm.averageMarketEggPrice || 11.8,
      averageMarketChickenPrice: farm.averageMarketChickenPrice || 195.0,
      medicineCost: farm.medicineCost ?? 30000,
      vaccinationCost: farm.vaccinationCost ?? 12000,
      laborCost: farm.laborCost ?? 48000,
      electricityCost: farm.electricityCost ?? 21000,
      waterCost: farm.waterCost ?? 6000,
      transportCost: farm.transportCost ?? 15000,
      otherCost: farm.otherCost ?? 9000,
      eggsProduced: farm.eggsProduced ?? 0,
      chickensSold: farm.chickensSold ?? 1550,
      averageWeightKg: farm.averageWeightKg ?? 2.2,
      chickenPricePerKg: farm.chickenPricePerKg ?? 195.0,
      eggPrice: farm.eggPrice ?? 11.8
    });
    setIsEditing(true);
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading your farms...</p>
        </div>
      </div>
    );
  }

  // If no farms registered yet
  if (!farm || farms.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-12 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
          <Warehouse className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-extrabold text-slate-100">No Farms Registered Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            You haven't registered any poultry farms yet. Fill out the registration form on the Dashboard to start tracking your farm's ML profit predictions.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 mx-auto transition-all"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Go to Dashboard & Register Farm</span>
        </button>
      </div>
    );
  }

  const profit = farm.profitResult;
  const isProfitable = profit ? (profit.predicted_profit >= 0) : true;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl p-6 border border-rose-500/30 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-rose-300">Delete Farm?</h3>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-300">
              This will permanently delete <strong className="text-slate-100">{farm.farmName}</strong> and its prediction records.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm font-bold hover:bg-rose-500/30"
              >
                Delete Farm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Section: Stored Farms List & Switcher (Shown ONLY in My Farm) ── */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-100 flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-emerald-400" />
              My Stored Poultry Farms ({farms.length})
            </h3>
            <p className="text-xs text-slate-400">
              Select any farm below to view its live weather, ML profit calculations, and flock metrics.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Register Another Farm</span>
          </button>
        </div>

        {/* Farm Cards Switcher Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {farms.map((f) => {
            const isActive = f._id === farm._id;
            return (
              <div
                key={f._id}
                onClick={() => handleSelectFarm(f)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isActive
                    ? 'bg-emerald-500/15 border-emerald-500/50 shadow-lg shadow-emerald-950/40 glow-emerald'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-950/60 border border-slate-800 text-emerald-400 inline-block">
                      {f.chickenType}
                    </span>
                    <h4 className="font-bold text-sm text-slate-100 truncate">
                      {f.farmName}
                    </h4>
                  </div>
                  {isActive && (
                    <span className="p-1 rounded-full bg-emerald-500 text-slate-950 shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 border-t border-slate-800/60 pt-2 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span className="truncate max-w-[100px]">{f.city}</span>
                  </span>
                  <span className="font-semibold text-slate-300">
                    {(f.initialChickens || f.totalChickens || 0).toLocaleString()} birds
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Active Farm Header & Weather Widget ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Farm Meta */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              {farm.farmName}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              {farm.ownerName}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              {farm.phoneNumber || 'N/A'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              {farm.city ? `${farm.city}, ${farm.country}` : farm.location}
            </span>
          </div>
        </div>

        {/* Weather & Edit Actions */}
        <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3">
          <WeatherWidget city={farm.city || 'Dhaka'} country={farm.country || 'Bangladesh'} />
          
          <div className="flex gap-2 justify-end">
            <button
              onClick={startEditing}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Farm Specs
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {isEditing && (
        <form onSubmit={handleUpdate} className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/40 space-y-6 animate-fade-in shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Pencil className="w-4 h-4" /> Edit Farm Specifications & Re-Calculate Profit
            </h3>
            <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-300">Farm Name *</label>
              <input type="text" name="farmName" value={formData.farmName} onChange={handleChange} required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 mt-1" />
            </div>
            <div>
              <label className="font-semibold text-slate-300">Owner Name *</label>
              <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 mt-1" />
            </div>
            <div>
              <label className="font-semibold text-slate-300">Phone Number *</label>
              <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 mt-1" />
            </div>
            <div>
              <label className="font-semibold text-slate-300">City *</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 mt-1" />
            </div>
            <div>
              <label className="font-semibold text-slate-300">Country *</label>
              <input type="text" name="country" value={formData.country} onChange={handleChange} required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 mt-1" />
            </div>
            <div>
              <label className="font-semibold text-slate-300">Chicken Type</label>
              <select name="chickenType" value={formData.chickenType} onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 mt-1">
                {CHICKEN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-300">Initial Chickens</label>
              <input type="number" name="initialChickens" value={formData.initialChickens} onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 mt-1" />
            </div>
            <div>
              <label className="font-semibold text-slate-300">Average Chickens</label>
              <input type="number" name="averageChickens" value={formData.averageChickens} onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 mt-1" />
            </div>
            <div>
              <label className="font-semibold text-slate-300">Feed Consumed (kg)</label>
              <input type="number" name="feedKg" value={formData.feedKg} onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 mt-1" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:opacity-90 flex items-center justify-center gap-2">
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save & Re-Calculate ML Profit</span>
            </button>
            <button type="button" onClick={() => setIsEditing(false)}
              className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── ML Profit Prediction & Financial Dashboard ── */}
      {profit && profit.success ? (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> ML Profit Prediction & Financial Analytics
              </span>
              <p className="text-xs text-slate-400">
                Calculated directly from registered farm parameters using the Lasso Regression pipeline.
              </p>
            </div>
            <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
              Model: Lasso Pipeline (.pkl)
            </span>
          </div>

          {/* Hero Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ML Predicted Net Profit */}
            <div
              className={`p-6 rounded-2xl border space-y-2 transition-all ${
                isProfitable
                  ? 'bg-gradient-to-b from-emerald-500/15 to-emerald-950/30 border-emerald-500/30 text-emerald-300 glow-emerald'
                  : 'bg-gradient-to-b from-rose-500/15 to-rose-950/30 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest opacity-80">
                <span className="flex items-center gap-1.5">
                  {isProfitable ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
                  ML Predicted Net Profit
                </span>
                <span className="font-mono text-[10px] bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                  ML Model
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                ৳ {profit.predicted_profit?.toLocaleString()} <span className="text-xs font-normal">BDT</span>
              </h3>
            </div>

            {/* Arithmetic Formula Profit */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                <span className="flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-cyan-400" />
                  Exact Arithmetic Profit
                </span>
                <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                  Formula Engine
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-cyan-400 tracking-tight">
                ৳ {profit.actual_calculated_profit?.toLocaleString()} <span className="text-xs font-normal">BDT</span>
              </h3>
            </div>
          </div>

          {/* Financial Breakdown Grid */}
          {profit.breakdown && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-semibold">Total Revenue</span>
                <span className="text-base font-bold text-emerald-400">৳ {profit.breakdown.total_revenue?.toLocaleString()}</span>
              </div>
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-semibold">Total Expenses</span>
                <span className="text-base font-bold text-rose-400">৳ {profit.breakdown.total_cost?.toLocaleString()}</span>
              </div>
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-semibold">Feed Cost</span>
                <span className="text-base font-bold text-slate-200">৳ {profit.breakdown.feed_cost?.toLocaleString()}</span>
              </div>
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-semibold">Operating Overhead</span>
                <span className="text-base font-bold text-slate-200">৳ {profit.breakdown.non_feed_cost?.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 bg-amber-950/10 text-amber-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold">Profit calculation will refresh upon updating farm specs.</p>
            <p className="text-xs text-amber-400/80">Click "Edit Farm Specs" to update parameters and recalculate.</p>
          </div>
        </div>
      )}

      {/* ── Key Farm Specs Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] uppercase font-semibold">
            <Bird className="w-3.5 h-3.5 text-emerald-400" />
            <span>Breed</span>
          </div>
          <p className="text-base font-bold text-slate-100">{farm.chickenType || 'Broiler'}</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] uppercase font-semibold">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Flock Count</span>
          </div>
          <p className="text-base font-bold text-emerald-400">
            {(farm.initialChickens || farm.totalChickens || 0).toLocaleString()} birds
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] uppercase font-semibold">
            <Droplets className="w-3.5 h-3.5 text-teal-400" />
            <span>Feed Consumed</span>
          </div>
          <p className="text-base font-bold text-slate-100">{(farm.feedKg || 0).toLocaleString()} kg</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] uppercase font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Mortality Count</span>
          </div>
          <p className="text-base font-bold text-amber-400">{farm.mortality || 0} birds</p>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          Recent Activity & Predictions for {farm.farmName}
        </h3>

        {recentActivity.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center space-y-2">
            <Activity className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">No predictions recorded yet for this farm</p>
            <p className="text-xs text-slate-500">Run a disease diagnostics check to populate activity logs.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map(item => {
              const isDisease = item.type === 'disease';
              const dateStr = new Date(item.timestamp).toLocaleString();
              return (
                <div key={item._id} className="glass-panel rounded-xl p-3.5 border border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isDisease
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {isDisease ? <Activity className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {isDisease
                          ? item.result?.success
                            ? `Detected: ${item.result?.prediction}`
                            : 'Image rejected (Low confidence)'
                          : item.result?.success
                            ? `ML Predicted Profit: ৳${item.result?.predicted_profit?.toLocaleString()}`
                            : 'Calculation failed'
                        }
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" /> {dateStr}
                      </p>
                    </div>
                  </div>
                  {isDisease && item.result?.confidence != null && (
                    <span className="text-[10px] font-mono bg-slate-900 px-2 py-1 rounded-md text-slate-400 border border-slate-800 shrink-0">
                      {(item.result.confidence * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
