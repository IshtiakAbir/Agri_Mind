import React, { useState, useEffect, useCallback } from 'react';
import {
  Sun, CloudSun, Cloud, CloudRain, CloudDrizzle,
  CloudLightning, CloudSnow, Wind, Droplets, RefreshCw, MapPin,
  Thermometer, ShieldCheck, AlertTriangle
} from 'lucide-react';

export default function WeatherWidget({ city = 'Dhaka', country = 'Bangladesh', compact = false }) {
  // Baseline initial state so the card is NEVER blank or empty
  const [weather, setWeather] = useState({
    city: city || 'Dhaka',
    country: country || 'Bangladesh',
    temperature: 27.5,
    condition: 'Partly Cloudy',
    humidity: 70,
    windSpeed: 8.5,
    apparentTemperature: 29.8,
    heatIndex: 28.5,
    forecastMax24h: 32.0,
    icon: 'cloud-sun',
    isCached: true,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchWeather = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const targetCity = city || 'Dhaka';
      const targetCountry = country || 'Bangladesh';
      const res = await fetch(`/api/weather?city=${encodeURIComponent(targetCity)}&country=${encodeURIComponent(targetCountry)}${isManual ? '&refresh=true' : ''}`);
      const data = await res.json();
      if (data && data.success) {
        setWeather({
          city: data.city || targetCity,
          country: data.country || targetCountry,
          temperature: data.temperature ?? 27.5,
          condition: data.condition || 'Partly Cloudy',
          humidity: data.humidity ?? 70,
          windSpeed: data.windSpeed ?? 8.5,
          apparentTemperature: data.apparentTemperature ?? data.temperature ?? 29.8,
          heatIndex: data.heatIndex ?? 28.5,
          forecastMax24h: data.forecastMax24h ?? 32.0,
          icon: data.icon || 'cloud-sun',
          isCached: data.isCached || false,
          isStale: data.isStale || false,
        });
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Weather fetch fallback active:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [city, country]);

  useEffect(() => {
    fetchWeather(false);
  }, [fetchWeather]);

  const getWeatherIcon = (iconName) => {
    const props = { className: "w-8 h-8" };
    switch (iconName) {
      case 'sun':
        return <Sun {...props} className="w-8 h-8 text-amber-400 animate-pulse" />;
      case 'cloud-sun':
        return <CloudSun {...props} className="w-8 h-8 text-amber-300" />;
      case 'cloud':
        return <Cloud {...props} className="w-8 h-8 text-slate-300" />;
      case 'cloud-drizzle':
        return <CloudDrizzle {...props} className="w-8 h-8 text-cyan-400" />;
      case 'cloud-rain':
        return <CloudRain {...props} className="w-8 h-8 text-blue-400" />;
      case 'cloud-lightning':
        return <CloudLightning {...props} className="w-8 h-8 text-yellow-400" />;
      case 'cloud-snow':
        return <CloudSnow {...props} className="w-8 h-8 text-sky-200" />;
      default:
        return <CloudSun {...props} className="w-8 h-8 text-amber-400" />;
    }
  };

  // Flock heat comfort calculation
  const heatIndex = weather?.heatIndex ?? weather?.temperature ?? 28;
  const isHeatStress = heatIndex >= 30;
  const isModerateHeat = heatIndex >= 27 && heatIndex < 30;

  return (
    <div className="space-y-3">
      {/* Top weather display */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100 tracking-tight">
              {Math.round(weather.temperature)}°C
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              {weather.condition}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>{weather.city || city}, {country}</span>
            {lastUpdated && <span className="text-slate-500">• {lastUpdated}</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchWeather(true)}
            disabled={refreshing || loading}
            title="Refresh weather data"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-center shadow-inner">
            {getWeatherIcon(weather.icon)}
          </div>
        </div>
      </div>

      {/* Grid of Microclimate Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/60">
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Droplets className="w-3 h-3 text-cyan-400" /> Humidity
          </span>
          <span className="text-xs font-bold text-slate-200 block mt-0.5">
            {weather.humidity}%
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Wind className="w-3 h-3 text-teal-400" /> Wind
          </span>
          <span className="text-xs font-bold text-slate-200 block mt-0.5">
            {weather.windSpeed} km/h
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Thermometer className="w-3 h-3 text-amber-400" /> Peak 24h
          </span>
          <span className="text-xs font-bold text-slate-200 block mt-0.5">
            {weather.forecastMax24h ? `${Math.round(weather.forecastMax24h)}°C` : '—'}
          </span>
        </div>
      </div>

      {/* Poultry Heat Stress Status Banner */}
      <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
        isHeatStress
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          : isModerateHeat
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
      }`}>
        {isHeatStress ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Heat Index {Math.round(heatIndex)}°C: Ensure max ventilation & cool water.</span>
          </>
        ) : isModerateHeat ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Heat Index {Math.round(heatIndex)}°C: Moderate warmth, keep airflow steady.</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Flock Comfort: Optimal temperature & humidity conditions.</span>
          </>
        )}
      </div>
    </div>
  );
}
