import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Search, Plus, Filter, Phone, MapPin, Tag,
  Star, CheckCircle2, AlertCircle, RefreshCw, Warehouse, Sparkles,
  ArrowRight, ShieldCheck, Truck, Package, X
} from 'lucide-react';

const CATEGORIES = ['All', 'Instruments', 'Medicines', 'Vaccines', 'Feed', 'Farmer Products'];

export default function Marketplace({ activeFarm, setActiveTab, onOpenRegisterFarm }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showSellModal, setShowSellModal] = useState(false);
  const [contactModalProduct, setContactModalProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New Listing Form State
  const [sellForm, setSellForm] = useState({
    name: '',
    category: 'Farmer Products',
    price: '',
    unit: 'per kg',
    sellerName: activeFarm?.ownerName || '',
    sellerPhone: activeFarm?.phoneNumber || '',
    city: activeFarm?.city || 'Dhaka',
    description: '',
    image: ''
  });

  useEffect(() => {
    if (activeFarm) {
      setSellForm(prev => ({
        ...prev,
        sellerName: prev.sellerName || activeFarm.ownerName || '',
        sellerPhone: prev.sellerPhone || activeFarm.phoneNumber || '',
        city: prev.city || activeFarm.city || 'Dhaka'
      }));
    }
  }, [activeFarm]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/api/products';
      const params = new URLSearchParams();
      if (category !== 'All') params.append('category', category);
      if (search.trim()) params.append('search', search.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, search]);

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sellForm)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Your product has been listed in the Marketplace!');
        setShowSellModal(false);
        setSellForm({
          name: '',
          category: 'Farmer Products',
          price: '',
          unit: 'per kg',
          sellerName: activeFarm?.ownerName || '',
          sellerPhone: activeFarm?.phoneNumber || '',
          city: activeFarm?.city || 'Dhaka',
          description: '',
          image: ''
        });
        fetchProducts();
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setError(data.error || 'Failed to list product.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* ── Sell Your Product Modal ── */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-emerald-500/30 max-w-xl w-full my-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  List Your Farm Product for Sale
                </h3>
                <p className="text-xs text-slate-400">
                  Sell live chickens, fresh eggs, compost manure, or surplus farm equipment directly to other buyers.
                </p>
              </div>
              <button
                onClick={() => setShowSellModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSellSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Brown Farm Eggs (30-Egg Crate)"
                  value={sellForm.name}
                  onChange={e => setSellForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Category</label>
                  <select
                    value={sellForm.category}
                    onChange={e => setSellForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Farmer Products">Farmer Products</option>
                    <option value="Instruments">Instruments & Tools</option>
                    <option value="Medicines">Medicines</option>
                    <option value="Vaccines">Vaccines</option>
                    <option value="Feed">Feed & Nutrition</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Price (BDT) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 390"
                    value={sellForm.price}
                    onChange={e => setSellForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Unit / Quantity</label>
                  <input
                    type="text"
                    placeholder="e.g. per kg, per crate"
                    value={sellForm.unit}
                    onChange={e => setSellForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Seller / Farm Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Green Valley Farm"
                    value={sellForm.sellerName}
                    onChange={e => setSellForm(prev => ({ ...prev, sellerName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Seller Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +880 1712-345678"
                    value={sellForm.sellerPhone}
                    onChange={e => setSellForm(prev => ({ ...prev, sellerPhone: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">City / Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gazipur, Dhaka"
                    value={sellForm.city}
                    onChange={e => setSellForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Description</label>
                <textarea
                  rows="2"
                  placeholder="Describe your product condition, batch size, availability..."
                  value={sellForm.description}
                  onChange={e => setSellForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Post Listing to Marketplace</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSellModal(false)}
                  className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Contact Seller Modal ── */}
      {contactModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 max-w-sm w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                Contact Seller
              </h3>
              <button onClick={() => setContactModalProduct(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <p className="font-bold text-sm text-slate-100">{contactModalProduct.name}</p>
              <p className="text-emerald-400 font-extrabold text-lg">৳ {contactModalProduct.price.toLocaleString()} <span className="text-xs font-normal text-slate-400">/{contactModalProduct.unit}</span></p>
              <div className="pt-2 border-t border-slate-800 text-slate-300 space-y-1">
                <p><span className="text-slate-500">Seller:</span> {contactModalProduct.sellerName}</p>
                <p><span className="text-slate-500">Location:</span> {contactModalProduct.city}</p>
                <p><span className="text-slate-500">Direct Contact:</span> <strong className="text-emerald-400">{contactModalProduct.sellerPhone}</strong></p>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={`tel:${contactModalProduct.sellerPhone}`}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Call Seller Directly</span>
              </a>
              <button
                onClick={() => setContactModalProduct(null)}
                className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Alert ── */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Header Banner ── */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-emerald-950/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShoppingBag className="w-3.5 h-3.5" /> AgriMind Farm Marketplace
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-emerald-200 to-teal-400">
              Poultry Supplies & Trade Hub
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Buy farming instruments, vaccines, medicines, and feed at wholesale rates. Sell live chickens, fresh farm eggs, and organic compost directly to fellow farmers.
            </p>
          </div>

          <button
            onClick={() => setShowSellModal(true)}
            className="shrink-0 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-950/50 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Sell Your Farm Produce</span>
          </button>
        </div>
      </div>

      {/* ── Search & Filter Tabs ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                category === cat
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search instruments, vaccines, eggs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* ── Products Grid ── */}
      {loading ? (
        <div className="glass-panel p-16 rounded-2xl text-center space-y-3 border border-slate-800">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading marketplace catalogue...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center space-y-3 border border-slate-800">
          <Package className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-base font-bold text-slate-300">No products found</p>
          <p className="text-xs text-slate-500">Try changing your category filter or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map(product => (
            <div
              key={product._id}
              className="glass-panel rounded-2xl border border-slate-800/90 hover:border-emerald-500/40 transition-all duration-300 overflow-hidden flex flex-col group hover:scale-[1.01] shadow-xl"
            >
              {/* Product Image */}
              <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500&auto=format&fit=crop&q=60';
                  }}
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                    {product.category}
                  </span>
                </div>
                {product.badge && (
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 shadow-md">
                      {product.badge}
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-2">
                    {product.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  {/* Price */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-lg font-extrabold text-emerald-400">
                        ৳ {product.price.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-500 ml-1 font-medium">
                        /{product.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{product.rating}</span>
                    </div>
                  </div>

                  {/* Seller & Location */}
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <p className="truncate font-medium text-slate-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{product.sellerName}</span>
                    </p>
                    <p className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{product.city}</span>
                    </p>
                  </div>

                  {/* Buy / Call Button */}
                  <button
                    onClick={() => setContactModalProduct(product)}
                    className="w-full py-2.5 rounded-xl bg-slate-800/90 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border border-slate-700/80 hover:border-emerald-500 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Order / Contact Seller</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Farm Registration & Management CTA Section (Under Shopping Section) ── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-cyan-950/30 space-y-4 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Warehouse className="w-3.5 h-3.5" /> Farm Management & ML Prediction Hub
            </span>
            <h3 className="text-2xl font-extrabold text-slate-100">
              Have a Poultry Farm? Register or Manage Your Farms
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Register multiple farms under your account to run automated Machine Learning profit forecasts, AI fecal disease diagnostics, and track customized local weather.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => {
                if (onOpenRegisterFarm) {
                  onOpenRegisterFarm();
                } else {
                  setActiveTab('farm');
                }
              }}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-950/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Register a New Farm</span>
            </button>

            <button
              onClick={() => setActiveTab('farm')}
              className="px-5 py-3.5 rounded-2xl border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Go to My Farm Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
