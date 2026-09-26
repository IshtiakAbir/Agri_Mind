/**
 * =============================================================================
 * Module: Batch Context Provider for Smart Poultry Lifecycle
 * Component: /app/frontend/src/context/BatchContext.jsx
 * Description: Manages flock batch selection, multi-farm batch queries,
 *              active batch dashboard state, and CRUD mutations.
 * =============================================================================
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';

export const BatchContext = createContext();

export const BatchProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);

  const [batches, setBatches] = useState([]);
  const [activeBatchId, setActiveBatchId] = useState(() => localStorage.getItem('agri_active_batch_id') || null);
  const [activeBatch, setActiveBatch] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper for auth headers
  const getHeaders = useCallback(() => {
    const currentToken = token || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
    };
  }, [token]);

  /**
   * Fetches full dashboard telemetry for the currently selected batch.
   */
  const fetchBatchDashboard = useCallback(async (batchId) => {
    if (!batchId) return;

    try {
      const res = await fetch(`/api/batches/${batchId}/dashboard`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success && data.dashboard) {
        const d = data.dashboard;
        const stageObj = {
          ...(d.stageInfo?.stage || {}),
          ...(d.stageInfo || {}),
          stageName: d.stageInfo?.stage?.stageName || d.stageInfo?.stageName || 'Growing Phase',
        };
        const batchObj = d.batch || {};
        const liveBirds = batchObj.liveBirdsEstimate ?? Math.max(0, (batchObj.initialChickens || 0) - (batchObj.cumulativeMortality || 0));

        // Build the shape that BatchDashboard.jsx and child components expect
        setDashboardData({
          evaluation: {
            status: d.status || 'Looks Good',
            reasons: d.reasons || [],
            evaluatedAt: new Date().toISOString(),
          },
          weather: null,
          metrics: { liveBirds },
          ageDays: batchObj.currentAge ?? batchObj.currentAgeDays ?? 0,
          stage: stageObj,
          tasksDue: d.upcomingTasks || [],
          alerts: [],
          todayLog: d.todayLog || null,
          recentLogs: d.recentLogs || [],
        });
        if (d.batch) {
          setActiveBatch(d.batch);
        }
      } else if (data.success && data.batch) {
        // Fallback if backend returns flat shape
        setDashboardData(data);
        setActiveBatch(data.batch);
      }
    } catch (err) {
      console.warn('Dashboard fetch note:', err.message);
    }
  }, [getHeaders]);

  /**
   * Fetches all batches for the authenticated user (optionally filtered by farmId).
   */
  const fetchBatches = useCallback(async (farmId = null) => {
    setLoading(true);
    setError(null);

    try {
      let url = '/api/batches';
      if (farmId) {
        url += `?farmId=${encodeURIComponent(farmId)}`;
      }

      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();

      if (data.success && Array.isArray(data.batches)) {
        setBatches(data.batches);

        // Auto-select batch: either previously saved ID, or first active batch, or first batch
        const storedId = localStorage.getItem('agri_active_batch_id');
        let matched = data.batches.find(b => b._id === storedId);

        if (!matched) {
          matched = data.batches.find(b => b.status === 'Active') || data.batches[0] || null;
        }

        if (matched) {
          setActiveBatchId(matched._id);
          setActiveBatch(matched);
          localStorage.setItem('agri_active_batch_id', matched._id);
          fetchBatchDashboard(matched._id);
        } else {
          setActiveBatchId(null);
          setActiveBatch(null);
          localStorage.removeItem('agri_active_batch_id');
        }
      } else {
        setBatches([]);
      }
    } catch (err) {
      console.warn('Batch fetch note:', err.message);
      setError('Unable to load flock batches.');
    } finally {
      setLoading(false);
    }
  }, [token, getHeaders, fetchBatchDashboard]);

  /**
   * Selects an active batch and reloads its dashboard.
   */
  const selectBatch = useCallback((batchId) => {
    setActiveBatchId(batchId);
    if (batchId) {
      localStorage.setItem('agri_active_batch_id', batchId);
      const found = batches.find(b => b._id === batchId);
      if (found) setActiveBatch(found);
      fetchBatchDashboard(batchId);
    } else {
      localStorage.removeItem('agri_active_batch_id');
      setActiveBatch(null);
      setDashboardData(null);
    }
  }, [batches, fetchBatchDashboard]);

  /**
   * Creates a new flock batch via POST /api/batches.
   */
  const createBatch = async (batchPayload) => {
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(batchPayload)
      });
      const data = await res.json();
      if (data.success && data.batch) {
        setBatches(prev => [data.batch, ...prev]);
        selectBatch(data.batch._id);
        return { success: true, batch: data.batch };
      }
      return { success: false, message: data.message || 'Failed to create flock batch.' };
    } catch (err) {
      return { success: false, message: err.message || 'Network error while creating batch.' };
    }
  };

  /**
   * Submits daily morning or evening check-in log via POST /api/batches/:id/log.
   */
  const submitDailyLog = async (batchId, logPayload) => {
    try {
      const res = await fetch(`/api/batches/${batchId}/log`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(logPayload)
      });
      const data = await res.json();
      if (data.success) {
        // Refresh dashboard immediately to reflect updated live count & reasons
        fetchBatchDashboard(batchId);
        return { success: true, log: data.log, metrics: data.metrics };
      }
      return { success: false, message: data.message || 'Failed to record check-in.' };
    } catch (err) {
      return { success: false, message: err.message || 'Network error during check-in.' };
    }
  };

  /**
   * Updates task status or notes via PATCH /api/batches/:id/tasks.
   */
  const updateBatchTask = async (batchId, taskId, patchData) => {
    try {
      const res = await fetch(`/api/batches/${batchId}/tasks`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ taskId, ...patchData })
      });
      const data = await res.json();
      if (data.success) {
        fetchBatchDashboard(batchId);
        return { success: true, task: data.task };
      }
      return { success: false, message: data.message || 'Failed to update task.' };
    } catch (err) {
      return { success: false, message: err.message || 'Network error updating task.' };
    }
  };

  /**
   * Closes a batch and computes final economics via POST /api/batches/:id/close.
   */
  const closeBatch = async (batchId, closePayload) => {
    try {
      const res = await fetch(`/api/batches/${batchId}/close`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(closePayload)
      });
      const data = await res.json();
      if (data.success && data.batch) {
        setBatches(prev => prev.map(b => b._id === batchId ? data.batch : b));
        if (activeBatchId === batchId) {
          setActiveBatch(data.batch);
        }
        return { success: true, batch: data.batch, summary: data.summary };
      }
      return { success: false, message: data.message || 'Failed to close batch.' };
    } catch (err) {
      return { success: false, message: err.message || 'Network error closing batch.' };
    }
  };

  // Initial load when user or token changes
  useEffect(() => {
    fetchBatches();
  }, [token, fetchBatches]);

  // Load dashboard whenever activeBatchId changes
  useEffect(() => {
    if (activeBatchId) {
      fetchBatchDashboard(activeBatchId);
    }
  }, [activeBatchId, fetchBatchDashboard]);

  return (
    <BatchContext.Provider
      value={{
        batches,
        activeBatchId,
        activeBatch,
        dashboardData,
        loading,
        error,
        fetchBatches,
        selectBatch,
        createBatch,
        submitDailyLog,
        updateBatchTask,
        closeBatch,
        refreshActiveBatch: () => fetchBatchDashboard(activeBatchId)
      }}
    >
      {children}
    </BatchContext.Provider>
  );
};
