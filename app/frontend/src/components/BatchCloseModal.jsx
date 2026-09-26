/**
 * =============================================================================
 * Module: Batch Close Modal (Final Economics Capture)
 * Component: /app/frontend/src/components/BatchCloseModal.jsx
 * Description: Modal to capture final harvest/sale outcomes, compute closeout
 *              economics, and transition a batch from Active to Closed via
 *              POST /api/batches/:id/close.
 * =============================================================================
 */

import React, { useState, useContext } from 'react';
import {
  X,
  DollarSign,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Bird,
  Sparkles
} from 'lucide-react';
import { BatchContext } from '../context/BatchContext';

export default function BatchCloseModal({ batch, isOpen, onClose, onBatchClosed }) {
  const { closeBatch } = useContext(BatchContext);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    finalWeightKg: '',
    soldCount: '',
    revenuePerKg: batch?.expectedSalePricePerKg || 165,
    actualRevenue: '',
    notes: ''
  });

  const liveBirds = Math.max(0, (batch?.initialChickens || 0) - (batch?.cumulativeMortality || 0));

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    const soldCount = Number(formData.soldCount) || liveBirds;
    if (soldCount > liveBirds) {
      setError(`Cannot sell more birds (${soldCount}) than current live population (${liveBirds}).`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        finalWeightKg: Number(formData.finalWeightKg) || undefined,
        soldCount: soldCount,
        revenue: Number(formData.actualRevenue) || undefined,
        notes: formData.notes.trim() || undefined
      };

      // Auto-calculate revenue if not manually entered
      if (!payload.revenue && formData.finalWeightKg && formData.revenuePerKg) {
        payload.revenue = Math.round(Number(formData.finalWeightKg) * Number(formData.revenuePerKg));
      }

      const res = await closeBatch(batch._id, payload);
      if (res.success) {
        if (onBatchClosed) onBatchClosed(res.batch, res.summary);
        onClose();
      } else {
        setError(res.message || 'Failed to close batch.');
      }
    } catch (err) {
      setError(err.message || 'Network error while closing batch.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !batch) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Close Batch & Record Outcomes</h3>
              <p className="text-[11px] text-slate-400">{batch.batchName} • {batch.chickenType}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning */}
        <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Closing a batch is irreversible. The flock lifecycle and all associated daily logs will be archived.</span>
        </div>

        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Summary Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <p className="text-slate-500">Initial DOC</p>
              <p className="font-bold text-slate-200">{batch.initialChickens}</p>
            </div>
            <div>
              <p className="text-slate-500">Total Mortality</p>
              <p className="font-bold text-rose-400">{batch.cumulativeMortality || 0}</p>
            </div>
            <div>
              <p className="text-slate-500">Live Birds</p>
              <p className="font-bold text-emerald-400">{liveBirds}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Total Weight Sold (kg)</label>
              <input
                type="number" step="0.1" min="0"
                placeholder="e.g. 2850"
                value={formData.finalWeightKg}
                onChange={(e) => setFormData({ ...formData, finalWeightKg: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Birds Sold Count</label>
              <input
                type="number" min="0" max={liveBirds}
                placeholder={`Max: ${liveBirds}`}
                value={formData.soldCount}
                onChange={(e) => setFormData({ ...formData, soldCount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sale Price per kg (৳)</label>
              <input
                type="number" step="1" min="0"
                value={formData.revenuePerKg}
                onChange={(e) => setFormData({ ...formData, revenuePerKg: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Actual Total Revenue (৳)</label>
              <input
                type="number" step="1" min="0"
                placeholder="Auto-calculated if blank"
                value={formData.actualRevenue}
                onChange={(e) => setFormData({ ...formData, actualRevenue: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Closeout Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Sold to ABC dealer at Khatungonj market"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 transition-all disabled:opacity-50"
          >
            {submitting ? 'Closing Batch...' : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Close Batch & Archive
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
