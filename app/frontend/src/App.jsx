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
import AdminPanel from './components/AdminPanel';
import FarmAdvantageGate from './components/FarmAdvantageGate';
import DiseaseAdvantageGate from './components/DiseaseAdvantageGate';
import ProfileModal from './components/ProfileModal';
import PoultryBatchDashboard from './components/PoultryBatchDashboard';
import ErrorBoundary from './components/ErrorBoundary';
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
  ChevronDown,
  Shield
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
  const { user, login, logout, language, toggleLanguage, loading } = useContext(AuthContext);

  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.startsWith('/admin') || hash === '#/admin' || hash === '#admin') {
        return 'admin';
      }
    }
    return 'home';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [skipAuth, setSkipAuth] = useState(true);
  const [activeFarmId, setActiveFarmId] = useState(() => localStorage.getItem('farmId') || null);
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  // Sync browser back/forward and direct /admin navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.startsWith('/admin') || hash === '#/admin' || hash === '#admin') {
        setActiveTab('admin');
      } else if (activeTab === 'admin') {
        setActiveTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  // Sync URL query parameters (?auth=login, ?auth=register, ?tab=employee, ?profile=true)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const auth = params.get('auth');
      if (auth === 'login' || auth === 'register') {
        setAuthView(auth);
        setSkipAuth(false);
      }
      const tab = params.get('tab');
      if (tab) {
        setActiveTab(tab);
      }
      if (params.get('profile') === 'true') {
        setShowProfileModal(true);
      }
    }
  }, []);

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

  const handlePredictionSaved = () => {
    setHistoryTrigger(prev => prev + 1);
  };

  const handleFarmRegistered = (farm) => {
    if (farm?._id) {
      setActiveFarmId(farm._id);
      localStorage.setItem('farmId', farm._id);
    }
  };

  // Navigate to Your Farm
  const handleYourFarmClick = () => {
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
    employee: language === 'bn' ? 'কর্মচারী টুলস' : 'Employee Tools',
    logout: language === 'bn' ? 'বাহির হন' : 'Log Out',
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

  // ─── Task 1 & 2: Dedicated Admin Route Gate (/admin) ───
  if (activeTab === 'admin') {
    // If not authenticated or not admin/support: render standalone 403 Forbidden page (not a redirect)
    if (!user || (user.role !== 'admin' && user.role !== 'support')) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none font-sans text-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 shadow-xl shadow-rose-950/40">
            <Shield className="w-10 h-10 text-rose-500" />
          </div>
          <span className="px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-3xl font-extrabold text-slate-100 mb-2">Access Denied</h1>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            Administrative privileges are required to access this control center. Non-administrative users cannot view or interact with administrative routes.
          </p>

          {/* Admin Credentials Quick Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 max-w-sm w-full mb-6 text-left shadow-xl shadow-slate-950/60">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>🛡️ Administrator Credentials</span>
              <span className="text-[10px] text-slate-500 font-normal">Default Access</span>
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-300 bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800">
                <span className="text-slate-500">Mobile / ID:</span>
                <span className="font-bold text-amber-300 select-all">01999999999</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800">
                <span className="text-slate-500">Password:</span>
                <span className="font-bold text-emerald-400 select-all">password123</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                setActiveTab('home');
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              ← Back to AgriMind Home
            </button>
            <button
              onClick={() => {
                setAuthView('login');
                setSkipAuth(false);
                sessionStorage.setItem('loginRedirect', 'admin');
                window.history.pushState({}, '', '/');
                setActiveTab('home');
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Sign In as Administrator →</span>
            </button>
          </div>
        </div>
      );
    }

    // Authenticated admin or support: standalone layout with its own full sidebar & header
    return (
      <AdminPanel
        onExit={() => {
          window.history.pushState({}, '', '/');
          setActiveTab('home');
        }}
      />
    );
  }

  // Unauthenticated Gate (shown when login/register view is triggered)
  if (!user && !skipAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
        <div className="p-4 px-6 flex items-center justify-between border-b border-slate-900 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
          <button
            onClick={() => { setSkipAuth(true); setActiveTab('home'); }}
            className="text-xs text-slate-400 hover:text-emerald-400 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            ← Back to Home
          </button>
          <div className="flex items-center gap-2">
            {authView === 'login' ? (
              <button
                onClick={() => setAuthView('register')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
              >
                Create Account →
              </button>
            ) : (
              <button
                onClick={() => setAuthView('login')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
              >
                Sign In →
              </button>
            )}
          </div>
        </div>
        {authView === 'login' ? (
          <LoginPage
            onNavigateToRegister={() => setAuthView('register')}
          />
        ) : (
          <RegisterPage
            onNavigateToLogin={() => setAuthView('login')}
          />
        )}
        <div className="py-4 text-center border-t border-slate-900 bg-slate-950">
          <p className="text-xs text-slate-500">AgriMind • Unified Poultry Health &amp; Intelligence</p>
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
                      id="btn-user-profile"
                      onClick={() => {
                        setShowProfileModal(true);
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors border-b border-slate-800 font-semibold cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'bn' ? 'প্রোফাইল পরিচালনা' : 'Profile Management'}</span>
                    </button>
                    {(user.role === 'admin' || user.role === 'support') && (
                      <button
                        onClick={() => {
                          window.history.pushState({}, '', '/admin');
                          setActiveTab('admin');
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2 transition-colors border-b border-slate-800 font-semibold cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        Admin Panel
                      </button>
                    )}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setAuthView('login'); setSkipAuth(false); }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthView('register'); setSkipAuth(false); }}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-950/40 hover:scale-[1.02] cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
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
              <>
                {(user.role === 'admin' || user.role === 'support') && (
                  <button
                    onClick={() => {
                      window.history.pushState({}, '', '/admin');
                      setActiveTab('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 mb-2 rounded-2xl text-sm font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    <Shield className="w-5 h-5 text-emerald-400" />
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  {t.logout}
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => { setAuthView('login'); setSkipAuth(false); setMobileMenuOpen(false); }}
                  className="w-full py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-bold text-xs hover:bg-slate-800 transition-colors text-center cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthView('register'); setSkipAuth(false); setMobileMenuOpen(false); }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-colors text-center shadow-lg shadow-emerald-950/40 cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Main Content Area ─── */}
      <main className={`flex-1 ${activeTab === 'home' ? '' : 'max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        <ErrorBoundary fallbackTitle="Page View Interrupted">
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
            user ? (
              <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SmartPoultry
                  activeFarmId={activeFarmId}
                  setActiveFarmId={setActiveFarmId}
                  setActiveTab={setActiveTab}
                />
              </div>
            ) : (
              <FarmAdvantageGate
                onSignIn={() => {
                  sessionStorage.setItem('loginRedirect', 'your-farm');
                  setAuthView('login');
                  setSkipAuth(false);
                }}
                onSignUp={() => {
                  sessionStorage.setItem('loginRedirect', 'your-farm');
                  setAuthView('register');
                  setSkipAuth(false);
                }}
                onExploreMarketplace={() => setActiveTab('market')}
              />
            )
          )}
          {activeTab === 'market' && (
            <Marketplace
              activeFarmId={activeFarmId}
              setActiveTab={setActiveTab}
              onOpenRegisterFarm={() => {
                if (!user) {
                  sessionStorage.setItem('loginRedirect', 'your-farm');
                  setAuthView('register');
                  setSkipAuth(false);
                } else {
                  setActiveTab('your-farm');
                }
              }}
              onRequireAuth={() => {
                sessionStorage.setItem('loginRedirect', 'market');
                setAuthView('login');
                setSkipAuth(false);
              }}
            />
          )}
          {activeTab === 'disease' && (
            user ? (
              <DiseaseDetection
                onPredictionSaved={handlePredictionSaved}
                farmId={activeFarmId}
              />
            ) : (
              <DiseaseAdvantageGate
                onSignIn={() => {
                  sessionStorage.setItem('loginRedirect', 'disease');
                  setAuthView('login');
                  setSkipAuth(false);
                }}
                onSignUp={() => {
                  sessionStorage.setItem('loginRedirect', 'disease');
                  setAuthView('register');
                  setSkipAuth(false);
                }}
                onExploreMarketplace={() => setActiveTab('market')}
              />
            )
          )}
          {activeTab === 'doctors' && (
            <DoctorDirectory
              user={user}
              onLoginRequired={() => {
                sessionStorage.setItem('loginRedirect', 'doctors');
                setAuthView('login');
                setSkipAuth(false);
              }}
            />
          )}
          {activeTab === 'history' && (
            <PredictionHistory
              key={historyTrigger}
              farmId={activeFarmId}
            />
          )}
          {(activeTab === 'batch-calendar' || activeTab === 'calendar') && (
            <PoultryBatchDashboard
              onBackToOperations={() => setActiveTab('your-farm')}
            />
          )}
          {activeTab === 'employee' && <EmployeeSupport />}
        </ErrorBoundary>
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

      {/* Profile Management Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
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
