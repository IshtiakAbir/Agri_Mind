/**
 * =============================================================================
 * Module: AgriMind Home Page (Public Landing)
 * Component: /app/frontend/src/components/Dashboard.jsx
 * Description: Full-screen hero, about section, and marketplace product grid.
 *              Does NOT contain any farm creation form or farm-specific data.
 *              All farm management lives under "Your Farm" (/your-farm route).
 *
 *  Layout:
 *    A. Transparent nav (handled in App.jsx; this component renders BELOW it)
 *    B. Full-viewport hero with photo overlay
 *    C. About section (dark background)
 *    D. AgriShop marketplace grid with category filter
 *    E. Diagnostics callout + footer (footer in App.jsx, omitted here)
 *
 *  Hero photo: Drop your final image at
 *    /app/frontend/src/assets/hero-poultry.jpg
 *  or serve from your CDN and update HERO_IMG_SRC below.
 * =============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag, ArrowRight, Activity,
  CheckCircle2, ChevronRight,
  BarChart3, Stethoscope, ClipboardCheck, TrendingUp,
  Star, Tag, Phone, RefreshCw, Sparkles, Bird,
  MapPin, Video, Truck
} from 'lucide-react';

// ─── Hero image source ────────────────────────────────────────────────────────
// Place your final image at app/frontend/src/assets/hero-poultry.jpg
// The fallback gradient is used if the image fails to load or is not yet placed.
const HERO_IMG_SRC = '/hero-poultry.jpg';

// ─── Category list for marketplace filter ────────────────────────────────────
const CATEGORIES = ['All', 'Farm Produce', 'Feed', 'Medicines', 'Vaccines', 'Instruments'];

export default function Dashboard({ setActiveTab, setActiveFarmId, onFarmRegistered, user, onYourFarmClick }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [stats, setStats] = useState({ totalFarms: 0, totalBirds: 0, totalDiagnoses: 0 });
  const [activeCategory, setActiveCategory] = useState('All');
  const [heroImgError, setHeroImgError] = useState(false);
  const [homeContent, setHomeContent] = useState({
    heroHeadline: "Smart Farming. Healthier Flocks.\nHigher Profits.",
    heroSubtext: "Track batch health with daily smart check-ins, detect diseases from droppings in seconds, consult verified poultry doctors, and trade directly on AgriShop.",
    aboutTitle: "About us",
    aboutText: "Bringing digital tools to poultry farming. We help farmers monitor their flocks, prevent disease, and grow profit with confidence."
  });
  const marketplaceRef = useRef(null);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchFeaturedDoctors();
    fetchStats();
    fetchHomeContent();
  }, []);

  const fetchHomeContent = async () => {
    try {
      const res = await fetch('/api/content/homepage');
      const data = await res.json();
      if (data.success && data.content) {
        setHomeContent(data.content);
      }
    } catch (_) {}
  };

  const fetchFeaturedProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && data.products) {
        setFeaturedProducts(data.products.slice(0, 12));
      }
    } catch { setFeaturedProducts([]); }
    finally { setLoadingProducts(false); }
  };

  const fetchFeaturedDoctors = async () => {
    try {
      const res = await fetch('/api/doctors?limit=4');
      const data = await res.json();
      if (data.success && data.doctors) {
        setFeaturedDoctors(data.doctors.slice(0, 4));
      }
    } catch { setFeaturedDoctors([]); }
    finally { setLoadingDoctors(false); }
  };

  const fetchStats = async () => {
    try {
      const [farmsRes, histRes] = await Promise.allSettled([
        fetch('/api/farms'),
        fetch('/api/history?limit=1000')
      ]);
      if (farmsRes.status === 'fulfilled') {
        const d = await farmsRes.value.json();
        if (d.success && d.farms) {
          const totalBirds = d.farms.reduce((s, f) => s + (f.initialChickens || f.totalChickens || 0), 0);
          setStats(prev => ({ ...prev, totalFarms: d.farms.length, totalBirds }));
        }
      }
      if (histRes.status === 'fulfilled') {
        const d = await histRes.value.json();
        if (d.success) setStats(prev => ({ ...prev, totalDiagnoses: d.count || 0 }));
      }
    } catch {}
  };

  // Robust category matching
  const matchesCategory = (prodCat = '', filterCat = '') => {
    if (filterCat === 'All') return true;
    const p = (prodCat || '').toLowerCase();
    const f = (filterCat || '').toLowerCase();
    if (p === f) return true;
    if (f.includes('med') && p.includes('med')) return true;
    if (f.includes('vac') && p.includes('vac')) return true;
    if ((f.includes('inst') || f.includes('equip')) && (p.includes('inst') || p.includes('equip'))) return true;
    if ((f.includes('prod') || f.includes('farm')) && (p.includes('farm') || p.includes('prod'))) return true;
    if (f.includes('feed') && p.includes('feed')) return true;
    return p.includes(f) || f.includes(p);
  };

  // Filter products by category
  const filteredProducts = activeCategory === 'All'
    ? featuredProducts
    : featuredProducts.filter(p => matchesCategory(p.category, activeCategory));

  const scrollToMarketplace = () => {
    marketplaceRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full">
      {/* ═══════════════════════════════════════════════════════════════════════
          A. HERO SECTION — Full viewport height
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{ minHeight: '100dvh' }}
        aria-label="AgriMind hero section"
      >
        {/* Background image or fallback gradient */}
        {!heroImgError ? (
          <img
            src={HERO_IMG_SRC}
            alt="Bangladesh poultry farm — chickens in a well-maintained shed"
            onError={() => setHeroImgError(true)}
            className="absolute inset-0 w-full h-full object-cover object-center"
            fetchpriority="high"
          />
        ) : (
          /* Fallback: rich dark gradient when no image is placed yet */
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950" />
        )}

        {/* Dark gradient overlay — darker at top and bottom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(2,10,18,0.82) 0%, rgba(2,10,18,0.45) 40%, rgba(2,10,18,0.55) 70%, rgba(2,10,18,0.90) 100%)'
          }}
        />

        {/* Hero text — centered */}
        <div className="relative z-10 text-center px-5 sm:px-8 max-w-4xl mx-auto space-y-7">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Poultry Intelligence for Bangladesh
          </span>

          {/* Main headline — 2 lines max */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight"
              style={{ textShadow: '0 4px 24px rgba(0,0,0,0.7)', whiteSpace: 'pre-line' }}>
            {homeContent.heroHeadline}
          </h1>

          {/* Sub-headline */}
          <p className="text-base sm:text-lg text-slate-200/90 max-w-2xl mx-auto leading-relaxed font-light"
             style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
            {homeContent.heroSubtext}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={scrollToMarketplace}
              className="px-7 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-extrabold flex items-center gap-2.5 transition-all shadow-xl shadow-emerald-900/50 hover:scale-105 active:scale-100 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              Explore Marketplace
            </button>
            <button
              onClick={() => setActiveTab('doctors')}
              className="px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/30 flex items-center gap-2.5 backdrop-blur-sm transition-all hover:scale-105 active:scale-100 cursor-pointer"
            >
              <Stethoscope className="w-4 h-4" />
              Find a Doctor
            </button>
          </div>

          {/* Live stats strip — only if we have real data */}
          {stats.totalBirds > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
              {[
                { value: stats.totalBirds.toLocaleString(), label: 'Birds Monitored' },
                { value: stats.totalFarms.toString(), label: 'Active Farms' },
                { value: stats.totalDiagnoses.toString(), label: 'AI Diagnoses' }
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-extrabold text-emerald-300">{s.value}</p>
                  <p className="text-[11px] text-slate-300 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-7 h-10 rounded-full border-2 border-white/30 flex items-start justify-center pt-2">
            <div className="w-1 h-2.5 rounded-full bg-emerald-400/80" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          B. ABOUT SECTION — dark background, generous spacing
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-950 py-24 px-5 sm:px-8" aria-label="About AgriMind">
        <div className="max-w-4xl mx-auto space-y-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">{homeContent.aboutTitle || 'About us'}</p>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-relaxed max-w-3xl">
            {homeContent.aboutText}
          </p>
          <div className="w-16 h-0.5 bg-emerald-500 rounded-full mt-6" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          C. AGRISHOP MARKETPLACE GRID
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={marketplaceRef}
        id="marketplace"
        className="bg-slate-900 py-20 px-5 sm:px-8"
        aria-label="AgriShop marketplace"
      >
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> AgriShop
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Poultry Supplies &amp; Marketplace
              </h2>
              <p className="text-sm text-slate-400 max-w-xl">
                Instruments, vaccines, medicines, feed, and farmer produce available for immediate order.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('market')}
              className="shrink-0 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 flex items-center gap-1.5 transition-colors"
            >
              View all products <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  activeCategory === cat
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-emerald-500/40 hover:text-emerald-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products grid */}
          {loadingProducts ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading marketplace items...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No products in this category yet.</p>
              <button onClick={() => setActiveCategory('All')} className="text-xs text-emerald-400 underline">Show all</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map(product => (
                <div
                  key={product._id}
                  onClick={() => setActiveTab('market')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setActiveTab('market')}
                  className="bg-slate-950 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer hover:scale-[1.02] shadow-lg hover:shadow-emerald-950/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {/* Product image */}
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={product.image}
                      alt={`${product.name} — ${product.category}`}
                      loading="lazy"
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

                  {/* Product info */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 line-clamp-1 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-base font-extrabold text-emerald-400">৳ {product.price?.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 ml-1">/{product.unit}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-400 flex items-center gap-1 transition-colors">
                        Order →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          D. QUICK DIAGNOSTICS CALLOUT
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-950 py-16 px-5 sm:px-8" aria-label="Disease diagnostics callout">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setActiveTab('disease')}
            className="w-full rounded-3xl p-8 sm:p-10 border border-slate-800 hover:border-rose-500/40 transition-all text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group hover:bg-slate-900/60 bg-slate-900/40 backdrop-blur-sm"
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 group-hover:bg-rose-500/20 transition-colors">
                <Activity className="w-8 h-8 text-rose-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  AI Disease Diagnostics
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </h3>
                <p className="text-sm text-slate-400 max-w-lg">
                  Upload droppings photos to detect Coccidiosis, Salmonella, or Newcastle disease using our EfficientNetB3 deep learning model — instant results, no lab needed.
                </p>
              </div>
            </div>
            <span className="shrink-0 px-5 py-2.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold group-hover:bg-rose-500/20 transition-colors">
              Upload a Photo →
            </span>
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          E. FEATURED POULTRY VETERINARIANS SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-900 py-20 px-5 sm:px-8 border-t border-slate-800" aria-label="Poultry Veterinarians">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" /> Poultry Doctors
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Expert Veterinarians Near You
              </h2>
              <p className="text-sm text-slate-400 max-w-xl">
                Certified poultry health specialists available across all 64 districts for video consultations and on-site farm visits.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('doctors')}
              className="shrink-0 px-5 py-2.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-500/20 flex items-center gap-1.5 transition-colors"
            >
              Browse All Doctors (64 Districts) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loadingDoctors ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-7 h-7 text-blue-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading veterinary experts...</p>
            </div>
          ) : featuredDoctors.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <p>Veterinary network available via the Doctors tab.</p>
              <button onClick={() => setActiveTab('doctors')} className="mt-2 text-xs text-blue-400 underline">Open Doctor Directory</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredDoctors.map(doc => (
                <div
                  key={doc._id}
                  onClick={() => setActiveTab('doctors')}
                  className="bg-slate-950 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-all duration-300 p-5 flex flex-col justify-between group cursor-pointer hover:scale-[1.02] shadow-lg hover:shadow-blue-950/30"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                        {doc.name.replace('Dr. ', '')[0]}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{doc.rating}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-100 group-hover:text-blue-300 transition-colors truncate">
                        {doc.name}
                      </h4>
                      <p className="text-[11px] text-blue-400 font-medium truncate">{doc.specialty}</p>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-400 border-t border-slate-900 pt-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{doc.district} District</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ClipboardCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{doc.yearsOfExperience} yrs exp • {doc.qualification}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 mt-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Video className="w-3 h-3 text-blue-400" /> Video:
                      </span>
                      <span className="font-bold text-emerald-400">৳{doc.consultationFee?.video || 300}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('doctors');
                      }}
                      className="w-full py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      Book Consultation →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          F. HOME FOOTER
      ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
                <Bird className="w-5 h-5 text-slate-950" />
              </div>
              <span className="text-lg font-bold text-slate-100">AgriMind</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unified Poultry Health, Trade &amp; Financial Intelligence Platform — built for Bangladesh farmers.
            </p>
            <p className="text-[10px] text-slate-600">© 2026 AgriMind. All rights reserved.</p>
          </div>

          {/* Platform links */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Platform</p>
            {[
              { id: 'market', label: 'Marketplace' },
              { id: 'disease', label: 'Diagnostics' },
              { id: 'doctors', label: 'Doctors' },
              { id: 'history', label: 'Reports' },
            ].map(link => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className="block text-sm text-slate-400 hover:text-emerald-400 transition-colors text-left"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Contact / support */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Support</p>
            <p className="text-sm text-slate-400">support@agrimind.app</p>
            <p className="text-sm text-slate-400">Available Mon–Sat, 9 AM – 6 PM BST</p>
            <p className="text-xs text-slate-600 mt-2">
              For veterinary emergencies, use the Doctors directory.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
