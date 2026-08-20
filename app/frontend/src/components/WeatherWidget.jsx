import React, { useState, useEffect } from 'react';
import {
  Sun, CloudSun, Cloud, CloudRain, CloudDrizzle,
  CloudLightning, CloudSnow, Wind, Droplets, RefreshCw, MapPin
} from 'lucide-react';

export default function WeatherWidget({ city = 'Dhaka', country = 'Bangladesh' }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`);
      const data = await res.json();
      if (data.success) {
        setWeather(data);
      } else {
        setError('Weather unavailable');
      }
    } catch {
      setError('Weather offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (city) {
      fetchWeather();
    }
  }, [city, country]);

  const getWeatherIcon = (iconName) => {
    const props = { className: "w-7 h-7" };
    switch (iconName) {
      case 'sun':
        return <Sun {...props} className="w-7 h-7 text-amber-400 animate-pulse" />;
      case 'cloud-sun':
        return <CloudSun {...props} className="w-7 h-7 text-amber-300" />;
      case 'cloud':
        return <Cloud {...props} className="w-7 h-7 text-slate-300" />;
      case 'cloud-drizzle':
        return <CloudDrizzle {...props} className="w-7 h-7 text-cyan-400" />;
      case 'cloud-rain':
        return <CloudRain {...props} className="w-7 h-7 text-blue-400" />;
      case 'cloud-lightning':
        return <CloudLightning {...props} className="w-7 h-7 text-yellow-400" />;
      case 'cloud-snow':
        return <CloudSnow {...props} className="w-7 h-7 text-sky-200" />;
      default:
        return <CloudSun {...props} className="w-7 h-7 text-amber-400" />;
    }
  };

  if (loading && !weather) {
    return (
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center justify-center min-h-[96px]">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>Fetching local farm weather...</span>
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-500" />
          <span>{city}, {country}</span>
        </div>
        <button onClick={fetchWeather} className="text-emerald-400 hover:underline text-[11px]">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800/90 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/80 shadow-lg relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-4">
        {/* Left: Location & Condition */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">{weather?.city || city}, {weather?.country || country}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              {weather?.temperature}°C
            </span>
            <span className="text-xs font-medium text-emerald-300">
              {weather?.condition}
            </span>
          </div>
        </div>

        {/* Right: Icon & Metrics */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-cyan-400" />
              <span>{weather?.humidity}%</span>
            </span>
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-teal-400" />
              <span>{weather?.windSpeed} km/h</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0">
            {getWeatherIcon(weather?.icon)}
          </div>
        </div>
      </div>
    </div>
  );
}
