/**
 * =============================================================================
 * Module: Unified AgriMind Frontend Router & App Root
 * Authorship: Full-Stack Web Team & Machine Learning Team
 * Component: /app/frontend/src/App.jsx
 * Description: Master layout, authentication gate, multi-tab navigation,
 *              language toggle, and user state management.
 * =============================================================================
 */

import React, { useState, useContext } from 'react';
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
  LayoutDashboard,
  ShoppingBag,
  Activity,
  Database,
  UserCheck,
  Globe,
  LogOut,
  Sparkles,
  Stethoscope
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [skipAuth, setSkipAuth] = useState(false);
  const [activeFarmId, setActiveFarmId] = useState(() => localStorage.getItem('farmId') || null);
  const [historyTrigger, setHistoryTrigger] = useState(0);

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

  // Translations
  const t = {
    dashboard: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard',
    flocks: language === 'bn' ? 'স্মার্ট পোল্ট্রি' : 'Smart Poultry',
    marketplace: language === 'bn' ? 'মার্কেটপ্লেস' : 'Marketplace',
    disease: language === 'bn' ? 'রোগ নির্ণয়' : 'Disease Classifier',
    history: language === 'bn' ? 'অডিট লগ' : 'Audit Logs',
    employee: language === 'bn' ? 'কর্মচারী টুলস' : 'Employee Tools',
    doctors: language === 'bn' ? 'ডাক্তার' : 'Doctors',
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
        <p className="mt-4 font-bold text-slate-300 text-sm">Loading AgriMind System...</p>
      </div>
    );
  }

  // Unauthenticated Gate with optional guest preview
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

  // Authenticated Tabs — "My Farm" removed; "Smart Poultry" is the sole farm nav entry
  const tabs = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'flocks', label: t.flocks, icon: Bird },
    { id: 'market', label: t.marketplace, icon: ShoppingBag },
    { id: 'disease', label: t.disease, icon: Activity },
    { id: 'doctors', label: t.doctors, icon: Stethoscope },
    { id: 'history', label: t.history, icon: Database },
  ];

  if (user?.role === 'employee') {
    tabs.push({ id: 'employee', label: t.employee, icon: UserCheck });
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo (Clickable to Dashboard) */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-3 text-left group focus:outline-none transition-transform hover:scale-[1.01]"
            title="Go to Dashboard"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-950/50 group-hover:shadow-emerald-500/20 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Feather className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2 group-hover:text-emerald-400 transition-colors">
                AgriMind
              </h1>
              <p className="text-[11px] text-slate-400">{t.subtitle}</p>
            </div>
          </button>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-950/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* User Controls & Language */}
          <div className="flex items-center space-x-2.5">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Toggle Bengali / English"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'bn' ? 'বাংলা' : 'EN'}</span>
            </button>

            {/* User Profile / Logout */}
            {user ? (
              <div className="flex items-center space-x-2 pl-1">
                <span className="text-xs text-slate-300 hidden lg:inline font-semibold">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition-colors"
                  title={t.logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSkipAuth(false)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden bg-slate-900 p-2 border-b border-slate-800 flex justify-around overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
              activeTab === tab.id ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            setActiveTab={setActiveTab}
            setActiveFarmId={setActiveFarmId}
            onFarmRegistered={handleFarmRegistered}
          />
        )}
        {activeTab === 'flocks' && (
          <SmartPoultry
            activeFarmId={activeFarmId}
            setActiveFarmId={setActiveFarmId}
          />
        )}
        {activeTab === 'market' && (
          <Marketplace
            activeFarmId={activeFarmId}
            setActiveTab={setActiveTab}
            onOpenRegisterFarm={() => setActiveTab('dashboard')}
          />
        )}
        {activeTab === 'disease' && (
          <DiseaseDetection
            onPredictionSaved={handlePredictionSaved}
            farmId={activeFarmId}
          />
        )}
        {activeTab === 'doctors' && (
          <DoctorDirectory />
        )}
        {activeTab === 'history' && (
          <PredictionHistory
            key={historyTrigger}
            farmId={activeFarmId}
          />
        )}
        {activeTab === 'employee' && <EmployeeSupport />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-slate-500">© 2026 AgriMind. Unified Poultry Health, Trade & Financial Intelligence Platform.</p>
            <p className="text-[10px] text-slate-600 mt-1">Built for Bangladesh poultry farmers • Contact: support@agrimind.app</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <button onClick={() => setActiveTab('market')} className="hover:text-emerald-400 transition-colors">
              Marketplace
            </button>
            <span>•</span>
            <button onClick={() => setActiveTab('disease')} className="hover:text-emerald-400 transition-colors">
              Diagnostics
            </button>
            <span>•</span>
            <button onClick={() => setActiveTab('doctors')} className="hover:text-emerald-400 transition-colors">
              Doctors
            </button>
            <span>•</span>
            <button onClick={() => setActiveTab('flocks')} className="hover:text-emerald-400 transition-colors">
              Smart Poultry
            </button>
            <span>•</span>
            <button onClick={() => setActiveTab('history')} className="hover:text-emerald-400 transition-colors">
              Reports
            </button>
          </div>
        </div>
      </footer>
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
