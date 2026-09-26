/**
 * =============================================================================
 * Module: Task Model Schema
 * Component: /app/backend/models/Task.js
 * Description: A Task represents a single scheduled management action within
 *              a batch's production cycle (vaccinations, feed transitions,
 *              flock weighings, or scheduled medication routines).
 *
 * Key design decisions:
 *   - Unique compound index on (batchId, templateKey) guarantees idempotency;
 *     running the task generator multiple times will never duplicate tasks.
 *   - isCritical flag gates status evaluation: only overdue critical tasks
 *     trigger the "CRITICAL_TASK_OVERDUE" status reason.
 *   - instructions are copied from the lifecycle template at generation time
 *     so the timeline frontend can render standalone without template lookups.
 *   - Overdue status is computed dynamically on-read and also synced by the
 *     nightly scheduled job to maintain query consistency.
 * =============================================================================
 */

'use strict';

const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    // ── Ownership ─────────────────────────────────────────────────────────────
    /** The batch this task belongs to */
    batchId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Batch',
      required: [true, 'batchId is required'],
      index:    true,
    },

    // ── Identity & Template Link ──────────────────────────────────────────────
    /**
     * Stable unique key identifying the task definition in lifecycle templates
     * (e.g., 'nd-lasota-1', 'gumboro-d78', 'switch-grower-feed', 'weekly-weight-1').
     * Combined with batchId, this forms the unique compound index.
     */
    templateKey: {
      type:     String,
      required: [true, 'templateKey is required'],
      trim:     true,
    },

    /** Human-readable task title */
    title: {
      type:      String,
      required:  [true, 'title is required'],
      trim:      true,
      maxlength: [150, 'title must be 150 characters or fewer'],
    },

    /** Category of the task */
    category: {
      type:     String,
      enum:     {
        values:  ['Vaccination', 'Feed Transition', 'Weighing', 'Medication'],
        message: 'category must be one of: Vaccination, Feed Transition, Weighing, Medication',
      },
      required: [true, 'category is required'],
    },

    /**
     * Age of the flock (in days) when this task should be executed.
     * Stored so timeline views can group tasks by bird age.
     */
    dayNumber: {
      type:     Number,
      required: [true, 'dayNumber is required'],
      min:      [0, 'dayNumber cannot be negative'],
    },

    /**
     * Exact calendar due date, calculated once at generation from:
     * batchStartDate + dayNumber days (in farm local timezone).
     */
    dueDate: {
      type:     Date,
      required: [true, 'dueDate is required'],
    },

    /**
     * True for high-stakes actions (e.g., Newcastle, Gumboro vaccinations).
     * Only critical overdue tasks trigger 'CRITICAL_TASK_OVERDUE' in the status evaluator.
     */
    isCritical: {
      type:    Boolean,
      default: false,
    },

    // ── Execution State ───────────────────────────────────────────────────────
    /**
     * Task progress state.
     * Nightly job marks pending tasks as 'Overdue' once dueDate has passed.
     */
    status: {
      type:    String,
      enum:    {
        values:  ['Pending', 'Completed', 'Overdue', 'Skipped'],
        message: 'status must be one of: Pending, Completed, Overdue, Skipped',
      },
      default: 'Pending',
      index:   true,
    },

    /** Timestamp when the farmer submitted completion or skip */
    completedAt: {
      type:    Date,
      default: null,
    },

    /**
     * Arbitrary structured payload captured upon task completion:
     * - Weighing tasks: { avgWeightG: 450, sampleSize: 20 }
     * - Vaccines: { batchNo: 'VAC-2026-X', administeredBy: 'Self' }
     * - Feed transitions: { feedBrand: 'Aftab Starter', notes: 'Smooth transition' }
     */
    completionData: {
      type:    mongoose.Schema.Types.Mixed,
      default: null,
    },

    /**
     * Step-by-step guidance copied directly from the template at generation time.
     * Enables frontend timeline to show detailed instructions without extra lookups.
     */
    instructions: {
      type:    String,
      default: '',
      trim:    true,
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Unique compound index: prevents duplicate tasks from repetitive generation
TaskSchema.index({ batchId: 1, templateKey: 1 }, { unique: true });

// Timeline sorting and queries by due date
TaskSchema.index({ batchId: 1, dueDate: 1 });

// Filtering pending, overdue, or completed tasks for a batch
TaskSchema.index({ batchId: 1, status: 1 });

// Fast lookup of overdue critical tasks
TaskSchema.index({ batchId: 1, isCritical: 1, status: 1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

/**
 * isOverdueComputed
 * Real-time check whether the task is overdue, regardless of whether the
 * nightly cron job has updated the status column yet.
 */
TaskSchema.virtual('isOverdueComputed').get(function () {
  if (this.status === 'Completed' || this.status === 'Skipped') {
    return false;
  }
  if (!this.dueDate) return false;
  return new Date() > this.dueDate;
});

// ─── Model ───────────────────────────────────────────────────────────────────

module.exports = mongoose.model('Task', TaskSchema);
