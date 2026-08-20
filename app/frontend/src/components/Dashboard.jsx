import React, { useState, useEffect } from 'react';
import {
  Sparkles, Warehouse, ShoppingBag, Users, Phone, MapPin, Bird,
  PieChart, RefreshCw, AlertCircle, ArrowRight, ShieldCheck,
  Activity, Star, CheckCircle2, DollarSign, ChevronRight
} from 'lucide-react';

const CHICKEN_TYPES = ['Sonali', 'Broiler', 'Desi', 'Cock', 'Layer'];

const DEFAULT_FORM = {
  farmName: '',
  ownerName: '',
  phoneNumber: '',
  country: 'Bangladesh',
  city: 'Dhaka',
  chickenType: 'Broiler',
  initialChickens: 1700,
  averageChickens: 1650,
  ageMonths: 2,
  feedKg: 5500,
  mortality: 50,
  feedPricePerKg: 53.25,
  averageMarketEggPrice: 11.8,
  averageMarketChickenPrice: 195.0,
  medicineCost: 30000,
  vaccinationCost: 12000,
  laborCost: 48000,
  electricityCost: 21000,
  waterCost: 6000,
  transportCost: 15000,
  otherCost: 9000,
  eggsProduced: 0,
  chickensSold: 1550,
  averageWeightKg: 2.2,
  chickenPricePerKg: 195.0,
  eggPrice: 11.8
};

export default function Dashboard({ setActiveTab, setActiveFarmId, onFarmRegistered }) {
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && data.products) {
        setFeaturedProducts(data.products.slice(0, 6));
      }
    } catch {
      setFeaturedProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterFarm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success && data.farm) {
        if (setActiveFarmId) setActiveFarmId(data.farm._id);
        localStorage.setItem('farmId', data.farm._id);
        setFormData({ ...DEFAULT_FORM });
        if (onFarmRegistered) onFarmRegistered(data.farm);
        setActiveTab('myfarm');
      } else {
        setError(data.error || 'Failed to register farm.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto animate-fade-in pb-8">
      {/* ── Hero Banner ── */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-emerald-950/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Poultry Intelligence & Trade
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-emerald-200 to-teal-400 tracking-tight">
              AgriMind Farming Dashboard
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Register your farm to run automated ML Profit Forecasting (Lasso pipeline), diagnose diseases with EfficientNetB3 deep learning, and buy/sell farming supplies & poultry produce in our marketplace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('myfarm')}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all shadow-md"
            >
              <Warehouse className="w-4 h-4 text-emerald-400" />
              <span>View My Farms</span>
            </button>
            <button
              onClick={() => setActiveTab('market')}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/40"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Marketplace</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 1: Farm Registration Form (Directly on Dashboard) ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
              <Warehouse className="w-6 h-6 text-emerald-400" />
              Register a New Poultry Farm
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Fill in your farm details and operational expenses. Profit will be automatically calculated via our trained ML model upon submission.
            </p>
          </div>
        </div>

        <form onSubmit={handleRegisterFarm} className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-8 shadow-2xl">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Group 1: Owner & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Users className="w-4 h-4" /> 1. Owner & Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Owner Name *</label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Mohammad Rahman"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone Number (Mandatory) *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g. +880 1712-345678"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Group 2: Farm Identity & Location */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <MapPin className="w-4 h-4" /> 2. Farm Identity & Geolocation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Farm Name *</label>
                <input
                  type="text"
                  name="farmName"
                  value={formData.farmName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Green Valley Agro"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Country *</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Bangladesh"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">City / District (For Live Weather) *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Gazipur, Dhaka"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Group 3: Flock & Feed Parameters */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-teal-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Bird className="w-4 h-4" /> 3. Flock & Feed Parameters (ML Model Features)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Chicken Type</label>
                <select
                  name="chickenType"
                  value={formData.chickenType}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  {CHICKEN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Initial Flock</label>
                <input
                  type="number"
                  name="initialChickens"
                  value={formData.initialChickens}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Average Active Flock</label>
                <input
                  type="number"
                  name="averageChickens"
                  value={formData.averageChickens}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Age (Months)</label>
                <input
                  type="number"
                  step="0.1"
                  name="ageMonths"
                  value={formData.ageMonths}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Feed Consumed (kg)</label>
                <input
                  type="number"
                  name="feedKg"
                  value={formData.feedKg}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Mortality Count</label>
                <input
                  type="number"
                  name="mortality"
                  value={formData.mortality}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Feed Price (BDT/kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="feedPricePerKg"
                  value={formData.feedPricePerKg}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Market Chicken (BDT/kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="averageMarketChickenPrice"
                  value={formData.averageMarketChickenPrice}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Group 4: Operating Expenses */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-purple-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <PieChart className="w-4 h-4" /> 4. Operational Overhead Expenses (BDT)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Medicine</label>
                <input
                  type="number"
                  name="medicineCost"
                  value={formData.medicineCost}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Vaccination</label>
                <input
                  type="number"
                  name="vaccinationCost"
                  value={formData.vaccinationCost}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Labor</label>
                <input
                  type="number"
                  name="laborCost"
                  value={formData.laborCost}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Electricity</label>
                <input
                  type="number"
                  name="electricityCost"
                  value={formData.electricityCost}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Water</label>
                <input
                  type="number"
                  name="waterCost"
                  value={formData.waterCost}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Transport</label>
                <input
                  type="number"
                  name="transportCost"
                  value={formData.transportCost}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Misc / Other</label>
                <input
                  type="number"
                  name="otherCost"
                  value={formData.otherCost}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Market Egg Price</label>
                <input
                  type="number"
                  step="0.1"
                  name="averageMarketEggPrice"
                  value={formData.averageMarketEggPrice}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl font-extrabold text-base transition-all bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:opacity-95 text-slate-950 shadow-xl shadow-emerald-950/40 hover:scale-[1.005] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Registering Farm & Running ML Profit Model...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Register Farm & View in My Farm</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Section 2: Shopping & Marketplace Items (Directly on Dashboard) ── */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
              <ShoppingBag className="w-6 h-6 text-emerald-400" />
              Explore Marketplace & Poultry Supplies
            </h3>
            <p className="text-xs text-slate-400">
              Instruments, vaccines, medicines, feed, and farmer produce available for immediate order.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('market')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <span>Explore All Products ({featuredProducts.length}+)</span>
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
                      <span className="text-base font-extrabold text-emerald-400">৳ {product.price.toLocaleString()}</span>
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

      {/* ── Section 3: Quick Diagnostics Feature Callout ── */}
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
