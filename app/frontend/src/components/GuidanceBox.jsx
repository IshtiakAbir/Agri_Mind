/**
 * =============================================================================
 * Module: Stage-Specific Lifecycle Guidance Box
 * Component: /app/frontend/src/components/GuidanceBox.jsx
 * Description: Renders age-aware management tips from the lifecycle template
 *              stage, highlights imminent milestones, and provides collapsible
 *              feed/biosecurity recommendations.
 * =============================================================================
 */

import React, { useState } from 'react';
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function GuidanceBox({ stage = {}, batch = {}, tasksDue = [] }) {
  const [expanded, setExpanded] = useState(true);

  const tips = stage?.tips || stage?.guidance || [];
  const stageName = stage?.name || stage?.stageName || 'Active Phase';
  const feedRecommendation = stage?.feedRecommendation || stage?.feed || null;

  const getLocalDateStr = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Find today's critical milestones
  const todayMilestones = (tasksDue || []).filter(t => {
    if (!t.dueDate) return false;
    const due = getLocalDateStr(new Date(t.dueDate));
    const today = getLocalDateStr(new Date());
    return due === today && t.isCritical && t.status !== 'Completed';
  });

  return (
    <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              Lifecycle Guidance
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                {stageName}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Age-specific management recommendations for {batch?.chickenType || 'flock'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Today's Critical Milestone Spotlight */}
      {todayMilestones.length > 0 && (
        <div className="space-y-2">
          {todayMilestones.map((ms, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs animate-pulse"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-300">⚡ Due Today: {ms.title}</p>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  {ms.instructions || ms.category || 'Critical biosecurity milestone requires completion today.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collapsible Tips List */}
      {expanded && (
        <div className="space-y-3 animate-fadeIn">
          {/* Feed Recommendation */}
          {feedRecommendation && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-xs">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-300">Feed Recommendation</p>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">{feedRecommendation}</p>
              </div>
            </div>
          )}

          {/* Tips Bullets */}
          {tips.length > 0 ? (
            <div className="space-y-2">
              {tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{typeof tip === 'string' ? tip : tip.text || tip.description || JSON.stringify(tip)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-500">
              No specific guidance available for this lifecycle stage. Continue standard feed and biosecurity protocols.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
