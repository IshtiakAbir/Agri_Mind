import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Bell,
  Sparkles,
  Bird,
  ShieldCheck,
  Package,
  RotateCcw,
  ArrowRight,
  CalendarCheck2
} from 'lucide-react';

/**
 * =============================================================================
 * Module: Poultry Batch Calendar & Dynamic Daily Check-in System
 * Component: /app/frontend/src/components/PoultryBatchDashboard.jsx
 * Description: Interactive calendar-driven daily check-in, dynamic flock age
 *              updating automatically based on placement date, and predictive
 *              task reminders embedded directly in Batch Operations.
 * =============================================================================
 */
export default function PoultryBatchDashboard({
  batch = null,
  dashboardData = null,
  onRefresh = null
}) {
  // ─── 1. Batch Identity & Dynamic Placement Date ─────────────────────────────
  // Defaults to Batch #A-104 placed on 2026-10-06 unless passed from BatchContext
  const initialStartDate = useMemo(() => {
    if (batch?.batchStartDate) {
      try {
        return new Date(batch.batchStartDate).toISOString().split('T')[0];
      } catch (_) {}
    }
    return batch?.startDate || '2026-10-06';
  }, [batch]);

  const [startDate, setStartDate] = useState(initialStartDate);
  const [referenceDate, setReferenceDate] = useState('2026-10-07'); // Default simulated "Today" anchor

  useEffect(() => {
    if (initialStartDate) {
      setStartDate(initialStartDate);
    }
  }, [initialStartDate]);

  const batchInfo = useMemo(() => {
    return {
      batchNumber: batch?.batchName || 'Batch #A-104',
      breed: batch?.chickenType ? `${batch.chickenType} (Broiler)` : 'Cobb 500 (Broiler)',
      farmName: batch?.farmName || 'Gazipur Green Agro — Shed 02',
      initialFlockSize: batch?.initialChickens || 2500,
      currentLiveBirds: dashboardData?.metrics?.liveBirds ?? (batch?.initialChickens ? Math.max(0, batch.initialChickens - (batch?.cumulativeMortality || 12)) : 2488),
      targetHarvestDays: batch?.cycleLengthDays || 35,
      targetHarvestWeight: `${batch?.targetHarvestWeightKg || 2.10} kg`
    };
  }, [batch, dashboardData]);

  // Selected date on the interactive calendar
  const [selectedDateStr, setSelectedDateStr] = useState('2026-10-07');
  
  // Calendar month state: initialized to the month of the selected date (October 2026 = month 9)
  const [currentMonth, setCurrentMonth] = useState({ year: 2026, month: 9 });

  // ─── 2. Flock Age Calculation Engine (Date Driven) ─────────────────────────
  /**
   * Calculates flock age in calendar days based on target date and start date.
   * Arrival / Placement day is considered Day 1.
   */
  const calculateFlockAgeDays = (targetDateStr, baseStartDate = startDate) => {
    if (!targetDateStr || !baseStartDate) return 1;
    try {
      const [ty, tm, td] = targetDateStr.split('-').map(Number);
      const [sy, sm, sd] = baseStartDate.split('-').map(Number);
      const targetUtc = Date.UTC(ty, tm - 1, td);
      const startUtc = Date.UTC(sy, sm - 1, sd);
      const diffMs = targetUtc - startUtc;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays + 1);
    } catch {
      return 1;
    }
  };

  // Flock Age for Reference Date ("Today")
  const currentFlockAgeDays = useMemo(() => {
    return calculateFlockAgeDays(referenceDate, startDate);
  }, [referenceDate, startDate]);

  // Flock Age for the currently clicked date on the calendar
  const selectedFlockAgeDays = useMemo(() => {
    return calculateFlockAgeDays(selectedDateStr, startDate);
  }, [selectedDateStr, startDate]);

  // ─── 3. Daily Check-in Database State ──────────────────────────────────────
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
      notes: 'Day-old chicks arrived at 08:30 AM. Brooder pre-heated to 33°C. High initial vitality.'
    },
    '2026-10-07': {
      completed: false, // Pending for today
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

  // ─── 4. Predictive Task Reminders Pipeline ──────────────────────────────────
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
      notes: 'Eye-drop or coarse spray route. Prepare skim milk stabiliser in clean non-chlorinated water.'
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
      notes: 'Sample 50 birds across 4 pen quadrants to evaluate initial growth rate against Cobb 500 curve.'
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
      notes: 'Drinking water route with 2 hours water withholding before administration.'
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
      notes: '50/50 blend of Crumble Starter and Grower Pellets for 48 hours before full switch.'
    },
    {
      id: 'task-5',
      date: '2026-10-18',
      flockAge: 13,
      title: 'Ventilation Fan Step-Up Calibration',
      category: 'Environment',
      icon: Wind,
      badge: 'Upcoming',
      badgeColor: 'emerald',
      notes: 'Increase minimum ventilation CFM per bird to manage respiratory moisture and ammonia.'
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

  // Active form values for the selected date
  const activeLog = logs[selectedDateStr] || {
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

  const [formValues, setFormValues] = useState(activeLog);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Sync form values whenever selected date changes
  useEffect(() => {
    const existing = logs[selectedDateStr] || {
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
  }, [selectedDateStr, logs]);

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
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // ─── 5. Calendar Generation (Month Matrix) ──────────────────────────────────
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

    // Trailing days padding
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
    const [ry, rm] = referenceDate.split('-').map(Number);
    setCurrentMonth({ year: ry, month: rm - 1 });
    setSelectedDateStr(referenceDate);
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

  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  return (
    <div className="space-y-6 text-slate-100 font-sans animate-fade-in">
      {/* ─── 1. Top Batch Header & Dynamic Flock Age Widget ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-emerald-500/5 to-transparent pointer-events-none rounded-full blur-3xl -mr-20 -mt-20" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
          {/* Left Column: Batch Identity & Placement Date Config */}
          <div className="md:col-span-7 space-y-3.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-mono font-extrabold text-xs shadow-md tracking-wider">
                {batchInfo.batchNumber}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold">
                {batchInfo.breed}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {batchInfo.farmName}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Placement Date
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <CalendarDays className="w-4 h-4 text-emerald-400 shrink-0" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    title="Change placement start date to test dynamic flock age calculation"
                    className="bg-slate-950 border border-slate-800 text-slate-100 text-xs font-bold rounded-lg px-2 py-1 focus:border-emerald-500 focus:outline-none transition-colors cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Flock Population
                </span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Bird className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-200">
                    {batchInfo.currentLiveBirds.toLocaleString()} Birds
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Target Harvest
                </span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-200">
                    Day {batchInfo.targetHarvestDays} ({batchInfo.targetHarvestWeight})
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Date Calculation Breakdown Note */}
            <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span className="text-slate-500">Date Calculation:</span>
              <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 font-mono text-emerald-400">
                Start: {startDate}
              </span>
              <span>➔</span>
              <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 font-mono text-indigo-300">
                Today: {referenceDate}
              </span>
              <span>=</span>
              <span className="font-bold text-slate-200">
                Day {currentFlockAgeDays} of {batchInfo.targetHarvestDays}
              </span>
            </div>
          </div>

          {/* Right Column: Prominent Dynamic Flock Age Widget */}
          <div className="md:col-span-5 flex justify-start md:justify-end">
            <div className="w-full sm:w-auto min-w-[280px] bg-gradient-to-br from-indigo-950/50 via-slate-900 to-emerald-950/30 border-2 border-indigo-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl relative">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Dynamic Flock Age
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Auto-Updates
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
                  Flock Age: {currentFlockAgeDays}
                </span>
                <span className="text-sm sm:text-base font-bold text-indigo-400">
                  Days
                </span>
              </div>

              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between gap-4">
                <span>Cycle Progress:</span>
                <span className="font-bold text-emerald-400">
                  {Math.min(100, Math.round((currentFlockAgeDays / batchInfo.targetHarvestDays) * 100))}%
                </span>
              </div>

              {/* Progress bar towards harvest */}
              <div className="w-full bg-slate-950 rounded-full h-2 mt-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 h-2 rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/50"
                  style={{ width: `${Math.min(100, Math.round((currentFlockAgeDays / batchInfo.targetHarvestDays) * 100))}%` }}
                />
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>Calculated from Start Date</span>
                <span className="text-indigo-300 font-mono">Day {currentFlockAgeDays}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Main Content Split View (Calendar Grid + Daily Check-in & Tasks) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── Left Area: Large Interactive Calendar (lg:col-span-7) ─── */}
        <div className="lg:col-span-7 xl:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          {/* Month Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                {monthNames[currentMonth.month]} {currentMonth.year}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any date to inspect routine records, view day age, or submit daily check-in.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                onClick={handleResetToToday}
                className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Today
              </button>
              <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-0.5">
                <button
                  onClick={handlePrevMonth}
                  title="Previous Month"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  title="Next Month"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Status Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 bg-slate-950/60 px-3.5 py-2.5 rounded-xl border border-slate-800">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-[9px]">
                ✓
              </span>
              Completed Day
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className="w-3.5 h-3.5 rounded-md border-2 border-indigo-500 bg-indigo-500/20" />
              Pending / Today
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Vaccine
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Weighing / Task
            </span>
          </div>

          {/* Days of Week Header (Mon - Sun) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Interactive Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((cell, idx) => {
              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === referenceDate;
              const logData = logs[cell.dateStr];
              const isCompleted = Boolean(logData?.completed);
              const cellTasks = tasksByDate[cell.dateStr] || [];
              const cellFlockAge = calculateFlockAgeDays(cell.dateStr, startDate);

              return (
                <button
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  disabled={cell.isPadding}
                  className={`min-h-[76px] sm:min-h-[88px] p-1.5 sm:p-2 rounded-xl text-left flex flex-col justify-between transition-all relative cursor-pointer ${
                    cell.isPadding
                      ? 'opacity-20 bg-transparent border border-transparent cursor-not-allowed'
                      : isSelected
                      ? 'bg-slate-950 border-2 border-indigo-500 shadow-lg shadow-indigo-950/80 ring-2 ring-indigo-500/30'
                      : isCompleted
                      ? 'bg-slate-950/80 border border-emerald-500/40 hover:border-emerald-500'
                      : isToday
                      ? 'bg-slate-950 border-2 border-indigo-400/80 hover:border-indigo-400'
                      : 'bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  {/* Top Row: Date Number + Completed Checkmark / Status Icon */}
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs sm:text-sm font-bold ${
                      isSelected
                        ? 'text-indigo-400 font-extrabold'
                        : isToday
                        ? 'text-indigo-300 font-extrabold'
                        : 'text-slate-300'
                    }`}>
                      {cell.dayNumber}
                    </span>

                    {/* Completion status indicator */}
                    {isCompleted ? (
                      <span
                        title="Completed Daily Routine"
                        className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-[9px] shadow-xs"
                      >
                        ✓
                      </span>
                    ) : isToday ? (
                      <span
                        title="Pending Routine for Today"
                        className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                      />
                    ) : null}
                  </div>

                  {/* Middle Row: Flock Age Tag (Calculated dynamically) */}
                  {!cell.isPadding && (
                    <div className="my-0.5">
                      <span className={`text-[9px] sm:text-[10px] px-1 py-0.2 rounded font-mono block truncate ${
                        isSelected
                          ? 'bg-indigo-500/20 text-indigo-300 font-bold'
                          : isCompleted
                          ? 'text-emerald-400/90'
                          : 'text-slate-500'
                      }`}>
                        Day {cellFlockAge}
                      </span>
                    </div>
                  )}

                  {/* Bottom Row: Scheduled Task Indicator Dots */}
                  <div className="flex items-center gap-1 w-full overflow-hidden h-3">
                    {cellTasks.slice(0, 3).map((task, tIdx) => {
                      let dotColor = 'bg-blue-400';
                      if (task.category === 'Vaccination') dotColor = 'bg-rose-400';
                      else if (task.category === 'Nutrition') dotColor = 'bg-indigo-400';
                      else if (task.category === 'Environment') dotColor = 'bg-emerald-400';

                      return (
                        <span
                          key={task.id || tIdx}
                          title={`${task.category}: ${task.title}`}
                          className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`}
                        />
                      );
                    })}
                    {cellTasks.length > 3 && (
                      <span className="text-[8px] text-slate-500 font-bold leading-none">
                        +{cellTasks.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Right Column: Stacked Cards for Daily Check-in & Upcoming Reminders (lg:col-span-5) ─── */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-6">
          {/* Card 1: Daily Check-in Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Daily Check-in
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono font-bold">
                    Day {selectedFlockAgeDays}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Target Date: <strong className="text-slate-200">{formattedSelectedDate}</strong>
                </p>
              </div>

              {logs[selectedDateStr]?.completed ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Logged
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                  Pending
                </span>
              )}
            </div>

            {/* Success notification */}
            {saveSuccessNotice && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Daily record saved! Calendar updated with completed tick.</span>
              </div>
            )}

            <form onSubmit={handleSaveCheckIn} className="space-y-4">
              {/* Telemetry Inputs Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Mortality (Birds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 2"
                    value={formValues.mortality}
                    onChange={(e) => handleFormChange('mortality', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Feed Intake (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 110"
                    value={formValues.feedConsumed}
                    onChange={(e) => handleFormChange('feedConsumed', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Water Volume (L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 260"
                    value={formValues.waterIntake}
                    onChange={(e) => handleFormChange('waterIntake', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Avg Weight (g)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="e.g. 58"
                    value={formValues.avgWeight}
                    onChange={(e) => handleFormChange('avgWeight', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* House Hygiene & Biosecurity Checklist */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Biosecurity Verification
                </span>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(formValues.waterFlushed)}
                      onChange={(e) => handleFormChange('waterFlushed', e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                    />
                    <span>Nipple drinker water lines flushed</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(formValues.ventilationChecked)}
                      onChange={(e) => handleFormChange('ventilationChecked', e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                    />
                    <span>Ventilation fans & curtains calibrated</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(formValues.litterChecked)}
                      onChange={(e) => handleFormChange('litterChecked', e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                    />
                    <span>Litter dryness & ammonia odor verified</span>
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {logs[selectedDateStr]?.completed ? 'Update Daily Log' : 'Mark Day as Complete'}
              </button>
            </form>
          </div>

          {/* Card 2: Upcoming Predictive Reminders */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Upcoming Reminders
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400 font-mono">
                {tasks.length} Scheduled
              </span>
            </div>

            {/* Vertical Timeline */}
            <div className="space-y-3">
              {tasks.map((task) => {
                const IconComponent = task.icon || Activity;
                const isSelectedTaskDate = task.date === selectedDateStr;

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedDateStr(task.date)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelectedTaskDate
                        ? 'bg-slate-950 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/20'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-100 truncate">
                          {task.title}
                        </h4>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                          task.badgeColor === 'rose'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : task.badgeColor === 'amber'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : task.badgeColor === 'blue'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {task.badge}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {task.notes}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-mono">
                        <span>{task.date}</span>
                        <span>•</span>
                        <span className="text-indigo-400 font-semibold">Flock Age: Day {task.flockAge}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
