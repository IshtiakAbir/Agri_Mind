import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
  Check,
  CheckCheck,
  Syringe,
  Scale,
  Wheat,
  Droplets,
  Wind,
  Activity,
  ClipboardCheck,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sparkles,
  Bird,
  Info,
  ShieldCheck,
  Package,
  RotateCcw,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function PoultryBatchDashboard({ onBackToOperations }) {
  // ─── Batch Metadata & Configuration ──────────────────────────────────────────
  const [batchInfo, setBatchInfo] = useState({
    batchNumber: 'Batch #A-104',
    breed: 'Cobb 500 (Broiler)',
    farmName: 'Gazipur Green Agro — Shed 02',
    startDate: '2026-10-06', // ISO date: YYYY-MM-DD
    initialFlockSize: 2500,
    currentLiveBirds: 2488,
    targetHarvestDays: 35,
    targetHarvestWeight: '2.10 kg'
  });

  // Current simulated calendar anchor: October 2026
  // Default selected date: Oct 7, 2026 (Day 2 of flock)
  const [selectedDateStr, setSelectedDateStr] = useState('2026-10-07');
  const [currentMonth, setCurrentMonth] = useState({ year: 2026, month: 9 }); // 0-indexed: 9 = October

  // Today reference date in 2026
  const todayStr = '2026-10-07';

  // ─── Calendar Logs Database State ─────────────────────────────────────────
  // Dates pre-populated with daily check-ins
  const [logs, setLogs] = useState({
    '2026-10-06': {
      completed: true,
      mortality: 7,
      feedConsumed: 95,
      waterIntake: 230,
      avgWeight: 44,
      waterFlushed: true,
      ventilationChecked: true,
      litterChecked: true,
      notes: 'Chicks received at 08:30 AM. Pre-warmed brooder at 33°C. Uniform vitality.'
    },
    '2026-10-07': {
      completed: false, // Incomplete / Pending for today
      mortality: 5,
      feedConsumed: 110,
      waterIntake: 260,
      avgWeight: 58,
      waterFlushed: true,
      ventilationChecked: false,
      litterChecked: false,
      notes: ''
    }
  });

  // ─── Scheduled Task Reminders Pipeline ───────────────────────────────────────
  const [tasks, setTasks] = useState([
    {
      id: 'task-1',
      date: '2026-10-08',
      flockAge: 3,
      title: 'B1 Newcastle & Bronchitis Booster',
      category: 'Vaccination',
      icon: Syringe,
      badge: 'Due Tomorrow',
      badgeColor: 'amber',
      notes: 'Eye-drop or coarse spray administration. Prepare clean skim milk stabiliser.'
    },
    {
      id: 'task-2',
      date: '2026-10-10',
      flockAge: 5,
      title: 'Flock Uniformity & Weight Sampling',
      category: 'Weighing',
      icon: Scale,
      badge: 'Upcoming',
      badgeColor: 'blue',
      notes: 'Sample 50 birds across 4 pen quadrants to assess day 5 growth curve.'
    },
    {
      id: 'task-3',
      date: '2026-10-12',
      flockAge: 7,
      title: 'Gumboro (IBD Intermediate) Vaccine',
      category: 'Vaccination',
      icon: Syringe,
      badge: 'Critical Vaccine',
      badgeColor: 'rose',
      notes: 'Drinking water route with 2-hour water starvation prior to release.'
    },
    {
      id: 'task-4',
      date: '2026-10-14',
      flockAge: 9,
      title: 'Transition to Grower Pellet Feed',
      category: 'Nutrition',
      icon: Wheat,
      badge: 'Upcoming',
      badgeColor: 'indigo',
      notes: '50/50 blend of Crumble Starter and Grower Pellets for 48 hours.'
    },
    {
      id: 'task-5',
      date: '2026-10-18',
      flockAge: 13,
      title: 'Ventilation Fan Step-Up Calibration',
      category: 'Environment',
      icon: Wind,
      badge: 'Upcoming',
      badgeColor: 'slate',
      notes: 'Increase minimum ventilation CFM per bird to prevent ammonia build-up.'
    },
    {
      id: 'task-6',
      date: '2026-10-22',
      flockAge: 17,
      title: 'Switch to Finisher Feed Formula',
      category: 'Nutrition',
      icon: Package,
      badge: 'Upcoming',
      badgeColor: 'indigo',
      notes: 'High-energy finisher formulation for optimal feed conversion ratio (FCR).'
    }
  ]);

  // Temporary Form State for the active check-in panel
  const activeLog = logs[selectedDateStr] || {
    completed: false,
    mortality: 0,
    feedConsumed: 0,
    waterIntake: 0,
    avgWeight: 0,
    waterFlushed: false,
    ventilationChecked: false,
    litterChecked: false,
    notes: ''
  };

  const [formValues, setFormValues] = useState(activeLog);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Sync form state when user selects another date on the calendar
  const handleSelectDate = (dateKey) => {
    setSelectedDateStr(dateKey);
    const existing = logs[dateKey] || {
      completed: false,
      mortality: '',
      feedConsumed: '',
      waterIntake: '',
      avgWeight: '',
      waterFlushed: false,
      ventilationChecked: false,
      litterChecked: false,
      notes: ''
    };
    setFormValues(existing);
    setSaveSuccessNotice(false);
  };

  // ─── Mathematical Age Calculation Helpers ────────────────────────────────────
  const parseDateUTC = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  };

  const calculateFlockAge = (dateStr) => {
    const target = parseDateUTC(dateStr);
    const start = parseDateUTC(batchInfo.startDate);
    const diffTime = target - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // Day 1 on start date
    return diffDays;
  };

  // Flock age on today (2026-10-07)
  const currentFlockAgeDays = calculateFlockAge(todayStr);

  // Selected date age
  const selectedFlockAge = calculateFlockAge(selectedDateStr);

  // ─── Form Submission Handler ─────────────────────────────────────────────────
  const handleFormChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCheckIn = (e) => {
    e.preventDefault();
    setLogs(prev => ({
      ...prev,
      [selectedDateStr]: {
        ...formValues,
        completed: true,
        mortality: Number(formValues.mortality) || 0,
        feedConsumed: Number(formValues.feedConsumed) || 0,
        waterIntake: Number(formValues.waterIntake) || 0,
        avgWeight: Number(formValues.avgWeight) || 0
      }
    }));
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3500);
  };

  // ─── Calendar Generation Logic (Month View) ──────────────────────────────────
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday as day 0 (ISO)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const days = [];

    // Previous month padding
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDate - i;
      const prevMonthIdx = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`;
      days.push({
        dayNumber: pDay,
        dateStr,
        isCurrentMonth: false,
        isPadding: true
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isPadding: false
      });
    }

    // Trailing days padding to 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let r = 1; r <= remaining; r++) {
      const nextMonthIdx = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(r).padStart(2, '0')}`;
      days.push({
        dayNumber: r,
        dateStr,
        isCurrentMonth: false,
        isPadding: true
      });
    }

    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleResetToToday = () => {
    setCurrentMonth({ year: 2026, month: 9 });
    setSelectedDateStr(todayStr);
    handleSelectDate(todayStr);
  };

  // Map tasks by date for fast indicator dot rendering
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, [tasks]);

  const formattedSelectedHeader = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  }, [selectedDateStr]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16 selection:bg-indigo-500 selection:text-white">
      {/* ─── Top SaaS Breadcrumb & Controls Bar ─── */}
      <div className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Bird className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Flock Telemetry</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Cycle Active
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Poultry Batch Operations Hub
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600">
                  v2.6 Enterprise
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onBackToOperations && (
              <button
                onClick={onBackToOperations}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
              >
                ← Back to Farm Overview
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-medium text-slate-600">
              <span className="px-2.5 py-1 rounded-lg bg-white shadow-xs font-bold text-slate-800">
                Calendar View
              </span>
              <span className="px-2.5 py-1 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors">
                Metric Logs
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* ─── 1. Top Dashboard Header ─── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-50/50 via-emerald-50/20 to-transparent pointer-events-none rounded-full blur-3xl -mr-20 -mt-20" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
            {/* Left Column: Batch Identity Details */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs shadow-xs tracking-wide">
                  {batchInfo.batchNumber}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                  {batchInfo.breed}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {batchInfo.farmName}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Placement Date
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-800">
                      Oct 6, 2026
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Placed Flock Size
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Bird className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-800">
                      {batchInfo.initialFlockSize.toLocaleString()} Birds
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Target Harvest
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-800">
                      Day {batchInfo.targetHarvestDays} ({batchInfo.targetHarvestWeight})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Prominent Styled Widget for Current Flock Age */}
            <div className="md:col-span-5 flex justify-start md:justify-end">
              <div className="w-full sm:w-auto bg-gradient-to-br from-indigo-50/80 via-white to-emerald-50/40 border-2 border-indigo-200/80 rounded-2xl p-4 sm:p-5 shadow-xs relative">
                <div className="flex items-center justify-between gap-6 mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Live Bio-Telemetry
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200/60 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Auto-Calculated
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                    Flock Age: {currentFlockAgeDays}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-indigo-600">
                    Days
                  </span>
                </div>

                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between gap-4">
                  <span>Start: Oct 6, 2026</span>
                  <span className="font-semibold text-slate-700">Day {currentFlockAgeDays} of {batchInfo.targetHarvestDays}</span>
                </div>

                {/* Micro progress meter towards harvest */}
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((currentFlockAgeDays / batchInfo.targetHarvestDays) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 2. Main Content Layout (Grid/Split View) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ─── 3. Left Area: Large Interactive Calendar (lg:col-span-7 or 8) ─── */}
          <div className="lg:col-span-7 xl:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
            {/* Calendar Controls & Month Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-indigo-600" />
                  {monthNames[currentMonth.month]} {currentMonth.year}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any calendar date to review telemetry, inspect routines, or complete the check-in.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={handleResetToToday}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                >
                  Today
                </button>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs p-0.5">
                  <button
                    onClick={handlePrevMonth}
                    title="Previous Month"
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    title="Next Month"
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Legend Bar */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 bg-slate-50/80 px-3.5 py-2.5 rounded-xl border border-slate-200/60">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-4 h-4 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center font-bold text-[9px]">
                  ✓
                </span>
                Completed Day
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3.5 h-3.5 rounded-md border-2 border-indigo-600 bg-indigo-50" />
                Current / Pending
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-400">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-200" />
                Future Days
              </span>
              <span className="flex items-center gap-1.5 font-medium text-indigo-700">
                <span className="w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-indigo-200" />
                Action Task Day
              </span>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-400 uppercase tracking-wider py-1">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Full-Month Interactive Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const isToday = cell.dateStr === todayStr;
                const isFuture = cell.dateStr > todayStr;
                const isBeforeBatch = cell.dateStr < batchInfo.startDate;

                const logData = logs[cell.dateStr];
                const isCompleted = logData?.completed === true;
                const isCurrentPending = isToday && !isCompleted;
                const dayTasks = tasksByDate[cell.dateStr] || [];
                const hasActionTasks = dayTasks.length > 0;
                const flockAge = calculateFlockAge(cell.dateStr);

                // Determining styles according to state
                let cellBg = 'bg-white hover:bg-slate-50 border-slate-200';
                if (isCompleted) {
                  cellBg = 'bg-emerald-50/40 border-emerald-200/90 hover:bg-emerald-50/70 text-slate-900';
                }
                if (isCurrentPending) {
                  cellBg = 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-400/40 text-slate-900';
                }
                if (isFuture) {
                  cellBg = 'bg-slate-50/60 border-slate-200/60 text-slate-400 hover:bg-slate-100/60';
                }
                if (cell.isPadding) {
                  cellBg = 'bg-slate-50/30 border-transparent text-slate-300 pointer-events-none opacity-40';
                }
                if (isSelected) {
                  cellBg += ' ring-2 ring-indigo-600 ring-offset-2 border-indigo-600 shadow-sm';
                }

                return (
                  <button
                    key={`${cell.dateStr}-${idx}`}
                    onClick={() => handleSelectDate(cell.dateStr)}
                    className={`min-h-[76px] sm:min-h-[88px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between text-left transition-all duration-150 cursor-pointer relative group ${cellBg}`}
                  >
                    {/* Top Row: Date Number & Badges */}
                    <div className="flex items-start justify-between w-full">
                      <span className={`text-xs sm:text-sm font-bold ${
                        isToday ? 'text-indigo-600 font-extrabold' : (isCompleted ? 'text-emerald-800' : 'text-slate-700')
                      }`}>
                        {cell.dayNumber}
                      </span>

                      {/* Status indicator badge */}
                      <div>
                        {isCompleted && (
                          <span
                            title="Day Check-in Complete"
                            className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shadow-xs"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}

                        {isCurrentPending && (
                          <span
                            title="Pending Check-in Today"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-[9px] font-bold text-amber-800 animate-pulse"
                          >
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Flock Age Marker */}
                    {flockAge > 0 && !cell.isPadding && (
                      <div className="my-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-md ${
                          isCompleted
                            ? 'bg-emerald-100/80 text-emerald-800'
                            : (isToday ? 'bg-indigo-100/80 text-indigo-800 font-bold' : 'text-slate-400 bg-slate-100')
                        }`}>
                          Day {flockAge}
                        </span>
                      </div>
                    )}

                    {/* Bottom: Action Tasks Indicator Dots */}
                    <div className="flex items-center gap-1 w-full mt-auto pt-1">
                      {hasActionTasks && (
                        <div className="flex items-center gap-1">
                          {dayTasks.slice(0, 2).map((t, i) => (
                            <span
                              key={i}
                              title={`${t.title} (${t.category})`}
                              className={`w-2 h-2 rounded-full ${
                                t.badgeColor === 'rose'
                                  ? 'bg-rose-500 ring-2 ring-rose-200'
                                  : (t.badgeColor === 'amber' ? 'bg-amber-500 ring-2 ring-amber-200' : 'bg-indigo-500 ring-2 ring-indigo-200')
                              }`}
                            />
                          ))}
                          {dayTasks.length > 2 && (
                            <span className="text-[9px] font-bold text-slate-400">+{dayTasks.length - 2}</span>
                          )}
                        </div>
                      )}

                      {/* Small telemetry pill if logged */}
                      {isCompleted && logData?.mortality !== undefined && (
                        <span className="text-[9px] text-slate-500 ml-auto hidden sm:inline">
                          {logData.mortality} mort
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Right Column: Stacked Cards (lg:col-span-5 or 4) ─── */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-6">
            {/* ─── 4. Right Column (Top Card) - Daily Check-in Panel ─── */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
              {/* Card Header with selected date and Flock Age */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Flock Operation Record
                    </span>
                    {logs[selectedDateStr]?.completed ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Completed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                        Pending Record
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    Check-in for {formattedSelectedHeader}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                    Calculated Age
                  </span>
                  <span className="text-sm font-extrabold text-slate-800">
                    Day {selectedFlockAge > 0 ? selectedFlockAge : '—'}
                  </span>
                </div>
              </div>

              {/* Success Notification Banner */}
              {saveSuccessNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  Check-in saved successfully! Calendar updated with verified green mark.
                </div>
              )}

              {/* Form Input Fields Grid */}
              <form onSubmit={handleSaveCheckIn} className="space-y-4">
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Field 1: Mortality Count */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                      <span>Mortality Count</span>
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={formValues.mortality}
                        onChange={(e) => handleFormChange('mortality', e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                      <span className="text-[11px] font-medium text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        birds
                      </span>
                    </div>
                  </div>

                  {/* Field 2: Feed Consumed */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                      <span>Feed Consumed</span>
                      <Wheat className="w-3.5 h-3.5 text-amber-500" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formValues.feedConsumed}
                        onChange={(e) => handleFormChange('feedConsumed', e.target.value)}
                        placeholder="110"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                      <span className="text-[11px] font-medium text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        kg
                      </span>
                    </div>
                  </div>

                  {/* Field 3: Water Intake */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                      <span>Water Intake</span>
                      <Droplets className="w-3.5 h-3.5 text-blue-500" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={formValues.waterIntake}
                        onChange={(e) => handleFormChange('waterIntake', e.target.value)}
                        placeholder="260"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                      <span className="text-[11px] font-medium text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        Liters
                      </span>
                    </div>
                  </div>

                  {/* Field 4: Average Weight */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                      <span>Avg Weight (Sample)</span>
                      <Scale className="w-3.5 h-3.5 text-indigo-500" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={formValues.avgWeight}
                        onChange={(e) => handleFormChange('avgWeight', e.target.value)}
                        placeholder="58"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                      <span className="text-[11px] font-medium text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        grams
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checklist Section */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Daily Biosecurity & House Checklist
                  </span>

                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formValues.waterFlushed}
                        onChange={(e) => handleFormChange('waterFlushed', e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        Water Lines Flushed & Nipples Inspected
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formValues.ventilationChecked}
                        onChange={(e) => handleFormChange('ventilationChecked', e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        Ventilation & Airflow Speed Checked
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formValues.litterChecked}
                        onChange={(e) => handleFormChange('litterChecked', e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        Litter Moisture & Brooder Temperature Monitored
                      </span>
                    </label>
                  </div>
                </div>

                {/* Mark Day as Complete Primary Button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer hover:shadow-indigo-200 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Mark Day as Complete
                </button>
              </form>
            </div>

            {/* ─── 5. Right Column (Bottom Card) - Upcoming Task Reminders ─── */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Upcoming Task Reminders
                    </h3>
                    <p className="text-[11px] text-slate-400">Predictive schedule grouped by date & age</p>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-slate-500 px-2 py-0.5 rounded-full bg-slate-100">
                  {tasks.length} Scheduled
                </span>
              </div>

              {/* Scrollable list / vertical timeline */}
              <div className="max-h-[360px] overflow-y-auto pr-1 space-y-3 divide-y divide-slate-100">
                {tasks.map((task) => {
                  const IconComponent = task.icon;
                  return (
                    <div
                      key={task.id}
                      className="pt-3 first:pt-0 flex items-start gap-3 group hover:bg-slate-50/80 p-2 rounded-xl transition-colors"
                    >
                      {/* Icon with category color */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        task.badgeColor === 'rose'
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : (task.badgeColor === 'amber'
                              ? 'bg-amber-50 border-amber-200 text-amber-600'
                              : 'bg-indigo-50 border-indigo-200 text-indigo-600')
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                            {task.date} • <span className="text-indigo-600 font-extrabold">Day {task.flockAge}</span>
                          </span>

                          {/* Status Badge */}
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            task.badgeColor === 'rose'
                              ? 'bg-rose-100 text-rose-700'
                              : (task.badgeColor === 'amber'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-indigo-100 text-indigo-700')
                          }`}>
                            {task.badge}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                          {task.title}
                        </h4>

                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {task.notes}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
