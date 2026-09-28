/**
 * =============================================================================
 * Module: Unified AgriMind Frontend Router & App Root
 * Authorship: Full-Stack Web Team & Machine Learning Team
 * Component: /app/frontend/src/App.jsx
 * Description: Master layout, authentication gate, multi-tab navigation,
 *              language toggle, and user state management.
 *
 * Nav order: Home | Your Farm | Marketplace | Diagnostics | Doctors | Reports
 * - "Dashboard" renamed to "Home" everywhere in UI
 * - "Smart Poultry" and "My Farm" replaced by single "Your Farm"
 * - /dashboard redirects to home; logo click → Home
 * - Mobile: hamburger menu opening a full-width dark panel
 * =============================================================================
 */

import React, { useState, useContext, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { BatchProvider } from './context/BatchContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import Marketplace from './components/Marketplace';
import DiseaseDetection from './components/DiseaseDetection';
import PredictionHistory from './components/PredictionHistory';
import EmployeeSupport from './components/EmployeeSupport';
import SmartPoultry from './components/SmartPoultry';
import DoctorDirectory from './components/DoctorDirectory';
import {
  Feather,
  Bird,
  Home,
  ShoppingBag,
  Activity,
  Database,
  UserCheck,
  Globe,
  LogOut,
  Stethoscope,
  Menu,
  X,
  BarChart3,
  User,
  ChevronDown
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000,
    },
  },
});

const MainApp = () => {
  const { user, logout, language, toggleLanguage, loading, loginGuest } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('home');
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [skipAuth, setSkipAuth] = useState(false);
  const [activeFarmId, setActiveFarmId] = useState(() => localStorage.getItem('farmId') || null);
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  // Close menus on tab change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setNavScrolled(false); // reset when switching tabs
  }, [activeTab]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Transparent nav on Home: detect scroll position
  useEffect(() => {
    if (activeTab !== 'home') return;
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial check
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeTab]);

  // Close user dropdown on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e) => {
      if (!e.target.closest('[data-user-menu]')) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const handleGuestAccess = async () => {
    try {
      if (loginGuest) await loginGuest();
    } catch (_) {}
    setSkipAuth(true);
  };

  const handlePredictionSaved = () => {
    setHistoryTrigger(prev => prev + 1);
  };

  const handleFarmRegistered = (farm) => {
    if (farm?._id) {
      setActiveFarmId(farm._id);
      localStorage.setItem('farmId', farm._id);
    }
  };

  // Navigate to Your Farm — if not authenticated, redirect to login first
  const handleYourFarmClick = () => {
    if (!user && !skipAuth) {
      setAuthView('login');
      setSkipAuth(false);
      // store intent so after login we return to your-farm
      sessionStorage.setItem('loginRedirect', 'your-farm');
      return;
    }
    setActiveTab('your-farm');
  };

  // Post-login redirect handling
  useEffect(() => {
    if (user || skipAuth) {
      const redirect = sessionStorage.getItem('loginRedirect');
      if (redirect) {
        sessionStorage.removeItem('loginRedirect');
        setActiveTab(redirect);
      }
    }
  }, [user, skipAuth]);

  // Translations
  const t = {
    home: language === 'bn' ? 'হোম' : 'Home',
    yourFarm: language === 'bn' ? 'আপনার ফার্ম' : 'Your Farm',
    marketplace: language === 'bn' ? 'মার্কেটপ্লেস' : 'Marketplace',
    disease: language === 'bn' ? 'রোগ নির্ণয়' : 'Diagnostics',
    doctors: language === 'bn' ? 'ডাক্তার' : 'Doctors',
    reports: language === 'bn' ? 'রিপোর্ট' : 'Reports',
    employee: language === 'bn' ? 'কর্মচারী টুলস' : 'Employee Tools',
    logout: language === 'bn' ? 'বাহির হন' : 'Log Out',
    demoAccess: language === 'bn' ? 'লগইন ছাড়া ব্যবহার করুন →' : 'Continue as Guest / Open Access →',
    subtitle: language === 'bn' ? 'স্মার্ট পোল্ট্রি স্বাস্থ্য, বাণিজ্য ও লাভ পূর্বাভাস' : 'Smart Poultry Health, Trade & Financial Intelligence'
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-bounce">
          <Feather className="w-8 h-8 text-emerald-400" />
        </div>
        <p className="mt-4 font-bold text-slate-300 text-sm">Loading AgriMind...</p>
      </div>
    );
  }

  // Unauthenticated Gate
  if (!user && !skipAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
        {authView === 'login' ? (
          <LoginPage
            onNavigateToRegister={() => setAuthView('register')}
            onSkip={handleGuestAccess}
          />
        ) : (
          <RegisterPage
            onNavigateToLogin={() => setAuthView('login')}
            onSkip={handleGuestAccess}
          />
        )}
        <div className="py-4 text-center border-t border-slate-900 bg-slate-950">
          <button
            onClick={handleGuestAccess}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
          >
            {t.demoAccess}
          </button>
        </div>
      </div>
    );
  }

  // Core public nav items — always visible
  const publicNavItems = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'market', label: t.marketplace, icon: ShoppingBag },
    { id: 'disease', label: t.disease, icon: Activity },
    { id: 'doctors', label: t.doctors, icon: Stethoscope },
    { id: 'history', label: t.reports, icon: BarChart3 },
  ];

  // "Your Farm" is special — requires auth
  const yourFarmItem = { id: 'your-farm', label: t.yourFarm, icon: Bird };

  // Full ordered nav: Home | Your Farm | Marketplace | Diagnostics | Doctors | Reports
  const allNavItems = [
    { id: 'home', label: t.home, icon: Home },
    yourFarmItem,
    { id: 'market', label: t.marketplace, icon: ShoppingBag },
    { id: 'disease', label: t.disease, icon: Activity },
    { id: 'doctors', label: t.doctors, icon: Stethoscope },
    { id: 'history', label: t.reports, icon: BarChart3 },
  ];

  if (user?.role === 'employee') {
    allNavItems.push({ id: 'employee', label: t.employee, icon: UserCheck });
  }

  const handleNavClick = (itemId) => {
    if (itemId === 'your-farm') {
      handleYourFarmClick();
    } else {
      setActiveTab(itemId);
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* ─── Top Navbar ─── */}
      <header
        className={`z-50 transition-all duration-300 border-b ${
          activeTab === 'home' && !navScrolled
            ? 'fixed w-full top-0 bg-transparent border-transparent'
            : 'sticky top-0 glass-panel border-slate-800/80 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo → Home */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center space-x-3 text-left group focus:outline-none transition-transform hover:scale-[1.01]"
            title="AgriMind — Go to Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-950/50 group-hover:shadow-emerald-500/20 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Feather className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100 group-hover:text-emerald-400 transition-colors">
                AgriMind
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">{t.subtitle}</p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            {allNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-950/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Toggle Bengali / English"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{language === 'bn' ? 'বাংলা' : 'EN'}</span>
            </button>

            {/* User Avatar / Log In pill */}
            {user ? (
              <div className="relative" data-user-menu="true">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 text-[10px] font-bold">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden lg:inline max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-800">
                      <p className="text-xs font-bold text-slate-100 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-3 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {t.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => { setAuthView('login'); setSkipAuth(false); }}
                className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors shadow-md shadow-emerald-950/40"
              >
                Log in
              </button>
            )}

            {/* Hamburger (mobile) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Full-Width Dark Menu Panel ─── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-slate-950/98 backdrop-blur-md flex flex-col p-6 space-y-2 border-t border-slate-800 overflow-y-auto">
          {allNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-lg'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
          <div className="pt-4 border-t border-slate-800">
            {user ? (
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                {t.logout}
              </button>
            ) : (
              <button
                onClick={() => { setAuthView('login'); setSkipAuth(false); setMobileMenuOpen(false); }}
                className="w-full py-4 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm"
              >
                Log in
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Main Content Area ─── */}
      <main className={`flex-1 ${activeTab === 'home' ? '' : 'max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        {activeTab === 'home' && (
          <Dashboard
            setActiveTab={setActiveTab}
            setActiveFarmId={setActiveFarmId}
            onFarmRegistered={handleFarmRegistered}
            user={user}
            onYourFarmClick={handleYourFarmClick}
          />
        )}
        {activeTab === 'your-farm' && (
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SmartPoultry
              activeFarmId={activeFarmId}
              setActiveFarmId={setActiveFarmId}
              setActiveTab={setActiveTab}
            />
          </div>
        )}
        {activeTab === 'market' && (
          <Marketplace
            activeFarmId={activeFarmId}
            setActiveTab={setActiveTab}
            onOpenRegisterFarm={() => setActiveTab('your-farm')}
          />
        )}
        {activeTab === 'disease' && (
          <DiseaseDetection
            onPredictionSaved={handlePredictionSaved}
            farmId={activeFarmId}
          />
        )}
        {activeTab === 'doctors' && (
          <DoctorDirectory user={user} onLoginRequired={() => { setAuthView('login'); setSkipAuth(false); }} />
        )}
        {activeTab === 'history' && (
          <PredictionHistory
            key={historyTrigger}
            farmId={activeFarmId}
          />
        )}
        {activeTab === 'employee' && <EmployeeSupport />}
      </main>

      {/* ─── Footer ─── */}
      {activeTab !== 'home' && (
        <footer className="border-t border-slate-900 bg-slate-950 py-6">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs text-slate-500">© 2026 AgriMind. Unified Poultry Health, Trade & Financial Intelligence Platform.</p>
              <p className="text-[10px] text-slate-600 mt-1">Built for Bangladesh poultry farmers • Contact: support@agrimind.app</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <button onClick={() => setActiveTab('market')} className="hover:text-emerald-400 transition-colors">Marketplace</button>
              <span>•</span>
              <button onClick={() => setActiveTab('disease')} className="hover:text-emerald-400 transition-colors">Diagnostics</button>
              <span>•</span>
              <button onClick={() => setActiveTab('doctors')} className="hover:text-emerald-400 transition-colors">Doctors</button>
              <span>•</span>
              <button onClick={() => handleNavClick('your-farm')} className="hover:text-emerald-400 transition-colors">Your Farm</button>
              <span>•</span>
              <button onClick={() => setActiveTab('history')} className="hover:text-emerald-400 transition-colors">Reports</button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BatchProvider>
          <MainApp />
        </BatchProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
