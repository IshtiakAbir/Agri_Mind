import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, Activity, DollarSign, Clock, FileText } from 'lucide-react';

export default function PredictionHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filter === 'all' ? '/api/history' : `/api/history?type=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch history');
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-400" />
            MongoDB Prediction Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time history stored directly in your MongoDB Atlas cluster.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Predictions</option>
            <option value="disease">Disease Diagnoses</option>
            <option value="profit">Profit Predictions</option>
          </select>

          <button
            onClick={fetchHistory}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3 border border-slate-800">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Fetching predictions from MongoDB Atlas...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          Error loading logs: {error}
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-2 border border-slate-800">
          <FileText className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-400">No predictions recorded yet</p>
          <p className="text-xs text-slate-500">Run a disease test or profit calculation to populate this audit log.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const dateStr = new Date(item.timestamp).toLocaleString();
            const isDisease = item.type === 'disease';
            return (
              <div
                key={item._id}
                className="glass-panel p-4 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isDisease
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {isDisease ? <Activity className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                        {isDisease ? 'Disease Classification' : 'Profit Calculation'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {dateStr}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-100">
                      {isDisease ? (
                        item.result?.success ? (
                          <>
                            Class: <span className="text-emerald-400">{item.result?.prediction}</span> (Confidence: {(item.result?.confidence * 100).toFixed(1)}%)
                          </>
                        ) : (
                          <>
                            Status: <span className="text-rose-400">Rejected (Low Confidence: {(item.result?.confidence * 100).toFixed(1)}%)</span>
                          </>
                        )
                      ) : (
                        item.result?.success ? (
                          <>
                            ML Predicted: <span className="text-emerald-400">৳ {item.result?.predicted_profit?.toLocaleString()} BDT</span>
                          </>
                        ) : (
                          <>
                            Status: <span className="text-rose-400">ML Model Error</span>
                          </>
                        )
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:text-right shrink-0">
                  <span className="text-[10px] font-mono bg-slate-900 px-2.5 py-1 rounded-md text-slate-400 border border-slate-800">
                    ID: {item._id.slice(-8)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
