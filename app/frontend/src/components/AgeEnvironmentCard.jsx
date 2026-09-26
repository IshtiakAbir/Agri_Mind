/**
 * =============================================================================
 * Module: Age & Environment Status Card
 * Component: /app/frontend/src/components/AgeEnvironmentCard.jsx
 * Description: Displays flock age progress, lifecycle stage name, live bird 
 *              count, and current environmental conditions (temperature & humidity)
 *              versus target biosecurity ranges with coloured range bars.
 * =============================================================================
 */

import React from 'react';
import {
  Calendar,
  Bird,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  AlertTriangle
} from 'lucide-react';

function RangeBar({ label, value, min, max, unit = '', icon: Icon, color = 'emerald' }) {
  const safeMin = min ?? 0;
  const safeMax = max ?? 100;
  const rangeSpan = safeMax - safeMin;
  const displayMin = safeMin - rangeSpan * 0.3;
  const displayMax = safeMax + rangeSpan * 0.3;
  const totalSpan = displayMax - displayMin;
  
  const inRange = value >= safeMin && value <= safeMax;
  const clampedValue = Math.max(displayMin, Math.min(displayMax, value));
  const valuePct = ((clampedValue - displayMin) / totalSpan) * 100;
  const rangeStartPct = ((safeMin - displayMin) / totalSpan) * 100;
  const rangeWidthPct = (rangeSpan / totalSpan) * 100;

  const dotColor = inRange ? `bg-${color}-400` : 'bg-rose-400';
  const valueColor = inRange ? `text-${color}-400` : 'text-rose-400';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-300 font-medium">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
          {label}
        </span>
        <span className={`font-bold ${inRange ? 'text-emerald-400' : 'text-rose-400'}`}>
          {value}{unit}
          {!inRange && <AlertTriangle className="w-3 h-3 inline ml-1" />}
        </span>
      </div>
      <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
        {/* Safe range zone */}
        <div
          className="absolute top-0 h-full bg-emerald-500/20 border-l border-r border-emerald-500/40"
          style={{ left: `${rangeStartPct}%`, width: `${rangeWidthPct}%` }}
        />
        {/* Value indicator */}
        <div
          className={`absolute top-0.5 w-2 h-2 rounded-full shadow-md transition-all duration-500 ${inRange ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-rose-400 ring-2 ring-rose-400/30'}`}
          style={{ left: `calc(${valuePct}% - 4px)` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>Target: {safeMin}{unit}</span>
        <span>{safeMax}{unit}</span>
      </div>
    </div>
  );
}

export default function AgeEnvironmentCard({ batch, dashboardData, weather }) {
  const ageDays = batch?.currentAgeDays ?? dashboardData?.ageDays ?? 0;
  const cycleDays = batch?.cycleLengthDays ?? 35;
  const progressPct = Math.min(100, Math.round((ageDays / cycleDays) * 100));
  const liveBirds = dashboardData?.metrics?.liveBirds ?? Math.max(0, (batch?.initialChickens || 0) - (batch?.cumulativeMortality || 0));
  const stage = dashboardData?.stage || {};

  const tempC = weather?.temperatureC ?? '--';
  const humPct = weather?.humidityPct ?? '--';
  const heatIdx = weather?.heatIndexC ?? '--';
  const windKph = weather?.windKph ?? '--';

  // Target ranges from lifecycle stage or reasonable defaults
  const targetTemp = stage?.targetTempC || [24, 32];
  const targetHumidity = stage?.targetHumidityPct || [50, 70];

  return (
    <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
      {/* ─── Flock Age & Lifecycle Progress ─── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">
              Day {ageDays} <span className="text-slate-400 font-normal">of {cycleDays}</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Stage: <span className="text-emerald-400 font-semibold">{stage?.name || stage?.stageName || 'Growing Phase'}</span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <Bird className="w-4 h-4 text-emerald-400" />
            <span className="text-lg font-bold text-slate-100">{liveBirds}</span>
          </div>
          <p className="text-[10px] text-slate-400">Live Birds</p>
        </div>
      </div>

      {/* Lifecycle Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Lifecycle Progress</span>
          <span className="text-emerald-400 font-bold">{progressPct}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ─── Environmental Conditions vs Targets ─── */}
      <div className="pt-3 border-t border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Shed Microclimate</span>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Wind className="w-3.5 h-3.5" />
            <span>{windKph} km/h</span>
          </div>
        </div>

        {typeof tempC === 'number' && (
          <RangeBar
            label="Temperature"
            value={tempC}
            min={targetTemp[0]}
            max={targetTemp[1]}
            unit="°C"
            icon={Thermometer}
          />
        )}

        {typeof humPct === 'number' && (
          <RangeBar
            label="Relative Humidity"
            value={humPct}
            min={targetHumidity[0]}
            max={targetHumidity[1]}
            unit="%"
            icon={Droplets}
          />
        )}

        {typeof heatIdx === 'number' && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Heat Index
            </span>
            <span className={`font-bold ${heatIdx > 35 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {heatIdx}°C
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
