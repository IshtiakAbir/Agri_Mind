/**
 * =============================================================================
 * Module: Milestone Timeline with Grouped Sections
 * Component: /app/frontend/src/components/MilestoneTimeline.jsx
 * Description: Vertical timeline of lifecycle tasks grouped by Overdue, Today,
 *              Upcoming (next 7 days), and Completed, with Mark Done / Skip
 *              actions and inline completion data input.
 * =============================================================================
 */

import React, { useState, useContext } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Layers,
  Syringe,
  Scale,
  Sparkles,
  X,
  Send,
  SkipForward,
  RotateCw
} from 'lucide-react';
import { BatchContext } from '../context/BatchContext';

function getCategoryIcon(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('vaccin')) return Syringe;
  if (cat.includes('weigh')) return Scale;
  return Layers;
}

function getCategoryBadgeColor(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('vaccin')) return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
  if (cat.includes('weigh')) return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
  if (cat.includes('feed')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  if (cat.includes('bio') || cat.includes('health')) return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  return 'bg-slate-800 text-slate-300 border-slate-700';
}

export default function MilestoneTimeline({ tasks = [], batchId }) {
  const { updateBatchTask } = useContext(BatchContext);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [actionTaskId, setActionTaskId] = useState(null);
  const [actionMode, setActionMode] = useState(null); // 'complete' | 'skip'
  const [completionNote, setCompletionNote] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const [quickCompletingId, setQuickCompletingId] = useState(null);

  const getLocalDateStr = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getLocalDateStr(new Date());
  const nextWeek = getLocalDateStr(new Date(Date.now() + 7 * 86400000));

  const getDueIso = (d) => {
    if (!d) return '';
    try {
      const dateObj = d instanceof Date ? d : new Date(d);
      return getLocalDateStr(dateObj);
    } catch {
      return '';
    }
  };

  // Group tasks
  const overdue = tasks.filter(t => t.status === 'Overdue' || (t.status === 'Pending' && t.dueDate && getDueIso(t.dueDate) < today));
  const todayTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Overdue' && t.dueDate && getDueIso(t.dueDate) === today);
  const upcoming = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Overdue' && t.dueDate && getDueIso(t.dueDate) > today && getDueIso(t.dueDate) <= nextWeek);
  const completed = tasks.filter(t => t.status === 'Completed');

  const handleQuickComplete = async (e, task) => {
    e.stopPropagation();
    if (!batchId || !task?._id || quickCompletingId) return;
    setQuickCompletingId(task._id);
    try {
      await updateBatchTask(batchId, task._id, {
        status: 'Completed',
        completionData: {
          notes: 'Marked complete from milestones timeline'
        }
      });
    } catch (err) {
      console.error('Error completing task:', err);
    } finally {
      setQuickCompletingId(null);
    }
  };

  const handleAction = async (taskId, status, category = '') => {
    if (!batchId || !taskId) return;
    setProcessing(true);
    try {
      const completionData = {
        notes: completionNote.trim() || undefined
      };
      if (batchNo.trim()) {
        completionData.batchNo = batchNo.trim();
      }
      if (weightKg.trim()) {
        completionData.weightKg = Number(weightKg);
      }
      await updateBatchTask(batchId, taskId, {
        status,
        completionData
      });
      setActionTaskId(null);
      setActionMode(null);
      setCompletionNote('');
      setBatchNo('');
      setWeightKg('');
    } catch (_) {}
    setProcessing(false);
  };

  const renderGroup = (groupLabel, groupTasks, groupColor, groupIcon) => {
    if (groupTasks.length === 0) return null;
    const GroupIcon = groupIcon;

    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <GroupIcon className={`w-3.5 h-3.5 ${groupColor}`} />
          <span className={groupColor}>{groupLabel}</span>
          <span className="text-slate-500">({groupTasks.length})</span>
        </div>

        {groupTasks.map((task) => {
          const isExpanded = expandedTaskId === task._id;
          const isActionOpen = actionTaskId === task._id;
          const CatIcon = getCategoryIcon(task.category);
          const dueStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';

          return (
            <div
              key={task._id}
              className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden transition-all"
            >
              {/* Task Row */}
              <div
                className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/50 transition-colors"
                onClick={() => setExpandedTaskId(isExpanded ? null : task._id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    task.status === 'Overdue' || overdue.includes(task) ? 'bg-rose-500 ring-4 ring-rose-500/20' :
                    task.status === 'Completed' ? 'bg-emerald-500' :
                    task.isCritical ? 'bg-amber-500 ring-4 ring-amber-500/20' :
                    'bg-teal-500'
                  }`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-slate-200 truncate">{task.title}</p>
                      {task.isCritical && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold uppercase">Critical</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${getCategoryBadgeColor(task.category)}`}>
                        {task.category || 'Task'}
                      </span>
                      <span className="text-[10px] text-slate-500">Day {task.targetDay} • {dueStr}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {task.status !== 'Completed' && (
                    <button
                      onClick={(e) => handleQuickComplete(e, task)}
                      disabled={quickCompletingId === task._id}
                      title="Mark as completed"
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {quickCompletingId === task._id ? (
                        <RotateCw className="w-3 h-3 animate-spin" />
                      ) : (
                        '✓ Done'
                      )}
                    </button>
                  )}
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                </div>
              </div>

              {/* Expanded Instructions */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/50 animate-fadeIn">
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {task.instructions || 'No additional instructions provided for this task.'}
                  </p>
                  {task.status !== 'Completed' && (
                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        onClick={() => { setActionTaskId(task._id); setActionMode('complete'); }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Mark Done
                      </button>
                      <button
                        onClick={() => { setActionTaskId(task._id); setActionMode('skip'); }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <SkipForward className="w-3 h-3" />
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Action Modal Inline */}
              {isActionOpen && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-800 animate-fadeIn">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        {actionMode === 'complete' ? '✓ Mark as Completed' : '⏭ Skip with Reason'}
                      </span>
                      <button onClick={() => { setActionTaskId(null); setActionMode(null); }} className="text-slate-400 hover:text-slate-200">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {actionMode === 'complete' && (task.category || '').toLowerCase().includes('vaccin') && (
                      <input
                        type="text"
                        value={batchNo}
                        onChange={(e) => setBatchNo(e.target.value)}
                        placeholder="Vaccine Batch No. (e.g. VAX-9021)"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-violet-500 transition-colors"
                      />
                    )}
                    {actionMode === 'complete' && (task.category || '').toLowerCase().includes('weigh') && (
                      <input
                        type="number"
                        step="0.01"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        placeholder="Sample Average Weight (kg)"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    )}
                    <input
                      type="text"
                      value={completionNote}
                      onChange={(e) => setCompletionNote(e.target.value)}
                      placeholder={actionMode === 'complete' ? 'Additional notes (optional)...' : 'Reason for skipping...'}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      onClick={() => handleAction(task._id, actionMode === 'complete' ? 'Completed' : 'Skipped', task.category)}
                      disabled={processing}
                      className="w-full py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      {processing ? 'Saving...' : 'Confirm'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">Lifecycle Milestones</h4>
            <p className="text-[11px] text-slate-400">{tasks.length} total tasks tracked</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {renderGroup('Overdue', overdue, 'text-rose-400', AlertTriangle)}
        {renderGroup('Today', todayTasks, 'text-amber-400', Clock)}
        {renderGroup('Upcoming (7 days)', upcoming, 'text-teal-400', Calendar)}

        {/* Completed Section — Collapsible */}
        {completed.length > 0 && (
          <div className="space-y-2.5">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed ({completed.length})</span>
              {showCompleted ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showCompleted && (
              <div className="space-y-2 animate-fadeIn">
                {completed.map(task => (
                  <div key={task._id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/50 flex items-center gap-3 text-xs opacity-60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-slate-400 line-through">{task.title}</span>
                    <span className="text-[10px] text-slate-500 ml-auto">Day {task.targetDay}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tasks.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            No lifecycle tasks generated yet. Tasks appear after batch creation.
          </div>
        )}
      </div>
    </div>
  );
}
