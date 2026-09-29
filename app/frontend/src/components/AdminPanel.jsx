/**
 * =============================================================================
 * Module: AgriMind Comprehensive Admin Panel
 * Component: /app/frontend/src/components/AdminPanel.jsx
 * Description: Production-grade administrative control center for AgriMind:
 *              - Overview dashboard with real-time KPI links and audit stream
 *              - User management with complete cascading erasure & typed confirm
 *              - Marketplace product, stock, low-stock, and category management
 *              - Doctor directory & appointment oversight
 *              - Farms oversight with batch summaries & follow-up flagging
 *              - Diagnostics oversight with confidence analytics & flagging
 *              - Content management (Breed 2-step publish, treatments, weather, homepage)
 *              - Platform settings (confidence thresholds) & admin staff management
 *              - Inactivity session timeout protection
 * =============================================================================
 */

import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard, Users, ShoppingBag, Stethoscope, Warehouse, FileText,
  Settings, Shield, LogOut, ChevronDown, ChevronRight, Search, Plus,
  Edit3, Trash2, Eye, Ban, CheckCircle, AlertTriangle, Activity,
  Clock, TrendingUp, BarChart3, Menu, X, RefreshCw, Download,
  UserCheck, UserX, Filter, MoreVertical, ArrowLeft, ExternalLink,
  Database, Globe, Feather, Bell, Lock, Unlock, ChevronLeft, Calendar,
  Upload, Sliders, CheckSquare, Square, Layers, AlertCircle, Save
} from 'lucide-react';

const API = '/api/admin';

// ─── Utility: fetch with auth token ──────────────────────────────────────────
function useAdminFetch() {
  const { token } = useContext(AuthContext);

  const adminFetch = useCallback(async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };
    const res = await fetch(`${API}${endpoint}`, { ...options, headers });
    return res.json();
  }, [token]);

  return adminFetch;
}

// ─── Toast Notification ──────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 10000,
      padding: '14px 20px', borderRadius: 14, maxWidth: 440,
      background: type === 'error' ? 'rgba(239,68,68,0.95)' : type === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(59,130,246,0.95)',
      color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 10,
      animation: 'slideInRight 0.3s ease-out'
    }}>
      {type === 'success' ? <CheckCircle size={18} /> : type === 'error' ? <AlertTriangle size={18} /> : <Bell size={18} />}
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2 }}>
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, trend, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.statCard,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, border-color 0.2s'
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = color; } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(51,65,85,0.3)'; } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', margin: '6px 0 0', lineHeight: 1 }}>{value}</p>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={22} color={color} />
        </div>
      </div>
      {trend && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <TrendingUp size={12} color="#10b981" />
          <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>{trend}</span>
        </div>
      )}
      {onClick && (
        <p style={{ fontSize: 10, color: '#64748b', margin: '10px 0 0', fontWeight: 600 }}>Click to view details →</p>
      )}
    </div>
  );
}

// ─── Data Table ──────────────────────────────────────────────────────────────
function DataTable({ columns, data, onRowAction, emptyMessage = 'No records found.' }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        <Database size={36} color="#334155" style={{ marginBottom: 12 }} />
        <p style={{ margin: 0 }}>{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={styles.th}>{col.header}</th>
            ))}
            {onRowAction && <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={row._id || row.id || ri} style={styles.tr}>
              {columns.map((col, ci) => (
                <td key={ci} style={styles.td}>
                  {col.render ? col.render(row) : row[col.key] || '—'}
                </td>
              ))}
              {onRowAction && (
                <td style={{ ...styles.td, textAlign: 'right' }}>{onRowAction(row)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────────
function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '16px 0' }}>
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} style={{ ...styles.btnSecondary, opacity: page <= 1 ? 0.4 : 1 }}>
        <ChevronLeft size={14} /> Prev
      </button>
      <span style={{ padding: '6px 12px', color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>
        Page {page} of {pages}
      </span>
      <button disabled={page >= pages} onClick={() => onPageChange(page + 1)} style={{ ...styles.btnSecondary, opacity: page >= pages ? 0.4 : 1 }}>
        Next <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. OVERVIEW / DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardPage({ stats, loading, onRefresh, navigateTo }) {
  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Platform Overview</h2>
          <p style={styles.pageSubtitle}>Live metrics, system activity, and actionable oversight</p>
        </div>
        <button onClick={onRefresh} style={styles.btnSecondary}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Metrics
        </button>
      </div>

      {/* Primary KPIs (all linked to filtered tabs) */}
      <div style={styles.statsGrid}>
        <StatCard
          label="Total Users"
          value={stats.totalUsers || 0}
          icon={Users}
          color="#3b82f6"
          trend={stats.newUsersThisWeek ? `+${stats.newUsersThisWeek} new this week` : null}
          onClick={() => navigateTo('users')}
        />
        <StatCard
          label="Active Farms"
          value={stats.activeFarms || 0}
          icon={Warehouse}
          color="#10b981"
          onClick={() => navigateTo('farms')}
        />
        <StatCard
          label="AgriShop Products"
          value={stats.totalProducts || 0}
          icon={ShoppingBag}
          color="#f59e0b"
          onClick={() => navigateTo('marketplace')}
        />
        <StatCard
          label="Pending Appointments"
          value={stats.pendingAppointments || 0}
          icon={Calendar}
          color="#8b5cf6"
          onClick={() => navigateTo('appointments', { status: 'pending' })}
        />
        <StatCard
          label="Flagged for Follow-up"
          value={stats.flaggedContentCount || 0}
          icon={AlertTriangle}
          color="#ef4444"
          onClick={() => navigateTo('diagnostics', { flagged: 'true' })}
        />
        <StatCard
          label="Active Batches"
          value={stats.activeBatches || 0}
          icon={Activity}
          color="#06b6d4"
          onClick={() => navigateTo('farms')}
        />
      </div>

      {/* Quick Actions Strip */}
      <div style={{ ...styles.card, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Quick Shortcuts:</span>
        <button onClick={() => navigateTo('marketplace', { openAdd: true })} style={styles.btnPrimary}>
          <Plus size={14} /> Add Product
        </button>
        <button onClick={() => navigateTo('doctors', { openAdd: true })} style={styles.btnSecondary}>
          <Plus size={14} /> Add Doctor
        </button>
        <button onClick={() => navigateTo('content')} style={styles.btnSecondary}>
          <FileText size={14} /> Content & Breed Templates
        </button>
        <button onClick={() => navigateTo('settings')} style={styles.btnSecondary}>
          <Sliders size={14} /> Tune Confidence Thresholds
        </button>
      </div>

      {/* Live Activity Feed */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="#10b981" /> Recent Administrative Activity
          </h3>
          <button onClick={() => navigateTo('settings', { subtab: 'audit' })} style={{ ...styles.btnSecondary, fontSize: 11 }}>
            View Full Audit Log →
          </button>
        </div>

        {(!stats.recentActivity || stats.recentActivity.length === 0) ? (
          <p style={{ color: '#64748b', fontSize: 13, margin: '20px 0' }}>No recent administrative actions recorded.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.recentActivity.slice(0, 10).map((log, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                background: 'rgba(15,23,42,0.6)', borderRadius: 10, border: '1px solid rgba(51,65,85,0.25)'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: log.action?.includes('delete') ? 'rgba(239,68,68,0.15)' :
                    log.action?.includes('create') ? 'rgba(16,185,129,0.15)' :
                      log.action?.includes('suspend') ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {log.action?.includes('delete') ? <Trash2 size={14} color="#ef4444" /> :
                    log.action?.includes('create') ? <Plus size={14} color="#10b981" /> :
                      log.action?.includes('suspend') ? <Ban size={14} color="#f59e0b" /> :
                        <Edit3 size={14} color="#3b82f6" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', margin: 0 }}>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>{log.adminName || 'Admin'}</span>
                    {' performed '}
                    <span style={{ color: '#e2e8f0', background: 'rgba(51,65,85,0.4)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                      {log.action}
                    </span>
                    {log.targetId && ` on [${log.targetType}:${log.targetId}]`}
                  </p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. USER MANAGEMENT PAGE (Task 3)
// ═══════════════════════════════════════════════════════════════════════════════
function UserManagementPage({ adminFetch, showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Modals
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [deletingInProgress, setDeletingInProgress] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, search, role: roleFilter, status: statusFilter });
      const data = await adminFetch(`/users?${params}`);
      if (data.success) {
        setUsers(data.users || []);
        setPages(data.pages || 0);
        setTotal(data.total || 0);
      }
    } catch (_) {
      showToast('Failed to load users list.', 'error');
    }
    setLoading(false);
  }, [adminFetch, page, search, roleFilter, statusFilter, showToast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Load deep user detail modal
  const handleViewUser = async (u) => {
    try {
      const data = await adminFetch(`/users/${u._id}`);
      if (data.success) {
        setViewUser(data);
      } else {
        setViewUser({ user: u, farms: [], batches: [], appointments: [], diagnoses: [] });
      }
    } catch (_) {
      setViewUser({ user: u, farms: [], batches: [], appointments: [], diagnoses: [] });
    }
  };

  // Suspend / Unsuspend
  const handleSuspend = async (u, suspend) => {
    const data = await adminFetch(`/users/${u._id}`, {
      method: 'PUT',
      body: JSON.stringify({ suspend })
    });
    if (data.success) {
      showToast(`User "${u.name}" ${suspend ? 'suspended' : 'reactivated'}.`, 'success');
      loadUsers();
    } else {
      showToast(data.message || 'Action failed.', 'error');
    }
  };

  // Force Password Reset
  const handleResetPassword = async (u) => {
    const data = await adminFetch(`/users/${u._id}/reset-password`, { method: 'POST' });
    if (data.success) {
      showToast(`Password reset. Temporary password: ${data.temporaryPassword}`, 'success');
    } else {
      showToast(data.message || 'Failed to reset password.', 'error');
    }
  };

  // Save Edit
  const handleEditSave = async () => {
    if (!editUser) return;
    const data = await adminFetch(`/users/${editUser._id || editUser.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: editUser.name, role: editUser.role })
    });
    if (data.success) {
      showToast('User updated successfully.', 'success');
      setEditUser(null);
      loadUsers();
    } else {
      showToast(data.message || 'Update failed.', 'error');
    }
  };

  // Complete Cascading Delete Execution
  const handleDeletePermanent = async () => {
    if (!confirmDelete) return;
    if (typedConfirmation.trim() !== confirmDelete.mobile && typedConfirmation.trim() !== confirmDelete.name) {
      showToast('Typed confirmation does not match.', 'error');
      return;
    }

    setDeletingInProgress(true);
    try {
      const data = await adminFetch(`/users/${confirmDelete._id}`, { method: 'DELETE' });
      if (data.success) {
        showToast(data.message || 'User and all data permanently deleted.', 'success');
        setConfirmDelete(null);
        setTypedConfirmation('');
        loadUsers();
      } else {
        showToast(data.message || 'Deletion failed.', 'error');
      }
    } catch (_) {
      showToast('Server error during permanent delete.', 'error');
    }
    setDeletingInProgress(false);
  };

  const columns = [
    {
      header: 'User',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: u.role === 'admin' ? 'linear-gradient(135deg, #10b981, #14b8a6)' :
              u.role === 'support' ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' :
                u.role === 'employee' ? 'linear-gradient(135deg, #8b5cf6, #a78bfa)' :
                  'rgba(51,65,85,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#fff'
          }}>
            {u.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{u.name}</p>
            <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{u.mobile}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      render: (u) => (
        <span style={{
          padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          background: u.role === 'admin' ? 'rgba(16,185,129,0.15)' :
            u.role === 'support' ? 'rgba(59,130,246,0.15)' :
              u.role === 'employee' ? 'rgba(139,92,246,0.15)' : 'rgba(100,116,139,0.15)',
          color: u.role === 'admin' ? '#10b981' :
            u.role === 'support' ? '#3b82f6' :
              u.role === 'employee' ? '#a78bfa' : '#94a3b8'
        }}>
          {u.role || 'farmer'}
        </span>
      )
    },
    {
      header: 'Status',
      render: (u) => (
        <span style={{
          padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
          background: u.suspendedAt ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
          color: u.suspendedAt ? '#ef4444' : '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4
        }}>
          {u.suspendedAt ? <Ban size={10} /> : <CheckCircle size={10} />}
          {u.suspendedAt ? 'Suspended' : 'Active'}
        </span>
      )
    },
    {
      header: 'Farms',
      render: (u) => <span style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>{u.farmCount || 0}</span>
    },
    {
      header: 'Last Login',
      render: (u) => (
        <span style={{ fontSize: 11, color: '#64748b' }}>
          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
        </span>
      )
    },
    {
      header: 'Joined',
      render: (u) => (
        <span style={{ fontSize: 11, color: '#64748b' }}>
          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
        </span>
      )
    }
  ];

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>User Directory & Access Control</h2>
          <p style={styles.pageSubtitle}>{total} total platform accounts registered</p>
        </div>
      </div>

      {/* Filters Strip */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ ...styles.inputGroup, flex: 1, minWidth: 220 }}>
          <Search size={14} color="#64748b" />
          <input
            style={styles.input}
            placeholder="Search by user name or mobile number..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select style={styles.select} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="farmer">Farmer</option>
          <option value="employee">Employee</option>
          <option value="support">Support</option>
          <option value="admin">Admin</option>
        </select>
        <select style={styles.select} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div style={styles.card}>
        <DataTable
          columns={columns}
          data={users}
          emptyMessage="No users found matching your criteria."
          onRowAction={(u) => (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button onClick={() => handleViewUser(u)} style={styles.btnIcon} title="View Details">
                <Eye size={14} color="#3b82f6" />
              </button>
              <button onClick={() => setEditUser({ ...u })} style={styles.btnIcon} title="Edit User">
                <Edit3 size={14} color="#10b981" />
              </button>
              {u.suspendedAt ? (
                <button onClick={() => handleSuspend(u, false)} style={styles.btnIcon} title="Reactivate Account">
                  <Unlock size={14} color="#10b981" />
                </button>
              ) : (
                <button onClick={() => handleSuspend(u, true)} style={styles.btnIcon} title="Suspend Account (Blocks Login)">
                  <Ban size={14} color="#f59e0b" />
                </button>
              )}
              <button onClick={() => handleResetPassword(u)} style={styles.btnIcon} title="Force Password Reset">
                <Lock size={14} color="#8b5cf6" />
              </button>
              <button onClick={() => { setConfirmDelete(u); setTypedConfirmation(''); }} style={styles.btnIcon} title="Permanent Cascade Deletion">
                <Trash2 size={14} color="#ef4444" />
              </button>
            </div>
          )}
        />
        <Pagination page={page} pages={pages} onPageChange={setPage} />
      </div>

      {/* User Detail Modal */}
      {viewUser && (
        <div style={styles.overlay} onClick={() => setViewUser(null)}>
          <div style={{ ...styles.modal, maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  {viewUser.user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{viewUser.user.name}</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{viewUser.user.mobile} • Role: {viewUser.user.role}</p>
                </div>
              </div>
              <button onClick={() => setViewUser(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {/* Farms & Batches summary */}
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>Registered Farms ({viewUser.farms?.length || 0})</h4>
            {viewUser.farms?.length === 0 ? (
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>No farms registered by this user.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {viewUser.farms.map((f, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: 'rgba(15,23,42,0.8)', borderRadius: 8, border: '1px solid rgba(51,65,85,0.3)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{f.farmName} ({f.city})</span>
                    <span style={{ fontSize: 11, color: '#10b981' }}>{f.chickenType} • {f.initialChickens} birds</span>
                  </div>
                ))}
              </div>
            )}

            {/* Batches */}
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>Batches ({viewUser.batches?.length || 0})</h4>
            {viewUser.batches?.length === 0 ? (
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>No batch history found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {viewUser.batches.map((b, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: 'rgba(15,23,42,0.8)', borderRadius: 8, border: '1px solid rgba(51,65,85,0.3)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{b.batchName}</span>
                    <span style={{ fontSize: 11, color: '#f59e0b' }}>Age: {b.currentAgeDays}d • Status: {b.status}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Appointments */}
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>Doctor Consultations ({viewUser.appointments?.length || 0})</h4>
            {viewUser.appointments?.length === 0 ? (
              <p style={{ fontSize: 12, color: '#64748b' }}>No doctor consultations booked.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {viewUser.appointments.map((a, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: 'rgba(15,23,42,0.8)', borderRadius: 8, border: '1px solid rgba(51,65,85,0.3)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>Dr. {a.doctorName} ({a.type})</span>
                    <span style={{ fontSize: 11, color: a.status === 'completed' ? '#10b981' : '#f59e0b' }}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div style={styles.overlay} onClick={() => setEditUser(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 20px' }}>Edit User Account</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.modalInput}
                value={editUser.name || ''}
                onChange={e => setEditUser({ ...editUser, name: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={styles.label}>Access Role</label>
              <select
                style={styles.modalInput}
                value={editUser.role || 'farmer'}
                onChange={e => setEditUser({ ...editUser, role: e.target.value })}
              >
                <option value="farmer">Farmer (Public User)</option>
                <option value="employee">Employee / Field Officer</option>
                <option value="support">Support (Read-Mostly Staff)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setEditUser(null)} style={styles.btnSecondary}>Cancel</button>
              <button onClick={handleEditSave} style={styles.btnPrimary}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Cascade Erasure Confirmation Modal (Task 3) */}
      {confirmDelete && (
        <div style={styles.overlay} onClick={() => setConfirmDelete(null)}>
          <div style={{ ...styles.modal, maxWidth: 520, border: '1px solid rgba(239,68,68,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={24} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ef4444' }}>PERMANENT ACCOUNT ERASURE</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Destructive and irreversible cascade</p>
              </div>
            </div>

            <div style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.1)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)', marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.6, margin: '0 0 10px' }}>
                You are about to <strong>completely and permanently delete</strong> user <strong>"{confirmDelete.name}"</strong> ({confirmDelete.mobile}).
              </p>
              <p style={{ fontSize: 12, color: '#cbd5e1', margin: '0 0 6px', fontWeight: 600 }}>The following data will be permanently wiped from both databases and disk storage:</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                <li>All farms owned by this user</li>
                <li>All flock batches, historical check-ins, tasks & alerts</li>
                <li>All diagnosis records and <strong>uploaded droppings photos on disk</strong></li>
                <li>All doctor appointments</li>
                <li>The user record itself</li>
              </ul>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ ...styles.label, color: '#e2e8f0' }}>
                To confirm, type the user's mobile number <code style={{ color: '#ef4444', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>{confirmDelete.mobile}</code> below:
              </label>
              <input
                style={{ ...styles.modalInput, borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444', fontWeight: 700 }}
                placeholder={`Type ${confirmDelete.mobile} here`}
                value={typedConfirmation}
                onChange={e => setTypedConfirmation(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={styles.btnSecondary} disabled={deletingInProgress}>Cancel</button>
              <button
                onClick={handleDeletePermanent}
                disabled={typedConfirmation.trim() !== confirmDelete.mobile && typedConfirmation.trim() !== confirmDelete.name || deletingInProgress}
                style={{
                  ...styles.btnDanger,
                  opacity: (typedConfirmation.trim() === confirmDelete.mobile || typedConfirmation.trim() === confirmDelete.name) && !deletingInProgress ? 1 : 0.4
                }}
              >
                {deletingInProgress ? 'Erasing Data...' : 'Permanently Erase User & All Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. MARKETPLACE (AGRISHOP) MANAGEMENT (Task 4)
// ═══════════════════════════════════════════════════════════════════════════════
function MarketplaceManagementPage({ adminFetch, showToast }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);

  // Selected products for bulk action
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [editProduct, setEditProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Instruments',
    price: '',
    unit: '1 unit',
    stock: 20,
    description: '',
    activeIngredients: '',
    treatmentTags: '',
    status: 'active'
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: 15, search,
        category: categoryFilter,
        lowStock: lowStockFilter ? 'true' : 'false'
      });
      const [prodData, catData] = await Promise.all([
        adminFetch(`/products?${params}`),
        adminFetch('/categories')
      ]);

      if (prodData.success) {
        setProducts(prodData.products || []);
        setPages(prodData.pages || 0);
      }
      if (catData.success) {
        setCategories(catData.categories || []);
      }
    } catch (_) {
      showToast('Failed to load marketplace products.', 'error');
    }
    setLoading(false);
  }, [adminFetch, page, search, categoryFilter, lowStockFilter, showToast]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Create Product
  const handleCreate = async () => {
    if (!newProduct.name || !newProduct.price) {
      showToast('Product name and price are required.', 'error');
      return;
    }

    const payload = {
      ...newProduct,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock) || 0,
      activeIngredients: newProduct.activeIngredients ? newProduct.activeIngredients.split(',').map(s => s.trim()) : [],
      treatmentTags: newProduct.treatmentTags ? newProduct.treatmentTags.split(',').map(s => s.trim()) : []
    };

    const data = await adminFetch('/products', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (data.success) {
      showToast('Product created successfully.', 'success');
      setShowAddModal(false);
      setNewProduct({
        name: '', category: 'Instruments', price: '', unit: '1 unit',
        stock: 20, description: '', activeIngredients: '', treatmentTags: '', status: 'active'
      });
      loadProducts();
    } else {
      showToast(data.message || 'Failed to create product.', 'error');
    }
  };

  // Edit Save
  const handleEditSave = async () => {
    if (!editProduct) return;
    const payload = {
      ...editProduct,
      price: parseFloat(editProduct.price),
      stock: parseInt(editProduct.stock) || 0,
      activeIngredients: Array.isArray(editProduct.activeIngredients) ? editProduct.activeIngredients : (editProduct.activeIngredients || '').split(',').map(s => s.trim()),
      treatmentTags: Array.isArray(editProduct.treatmentTags) ? editProduct.treatmentTags : (editProduct.treatmentTags || '').split(',').map(s => s.trim())
    };

    const data = await adminFetch(`/products/${editProduct._id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (data.success) {
      showToast('Product updated successfully.', 'success');
      setEditProduct(null);
      loadProducts();
    } else {
      showToast(data.message || 'Update failed.', 'error');
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product listing?')) return;
    const data = await adminFetch(`/products/${id}`, { method: 'DELETE' });
    if (data.success) {
      showToast('Product deleted.', 'success');
      loadProducts();
    }
  };

  // Bulk status update
  const handleBulkStatus = async (status) => {
    if (selectedIds.length === 0) return;
    const data = await adminFetch('/products/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ productIds: selectedIds, status })
    });
    if (data.success) {
      showToast(data.message, 'success');
      setSelectedIds([]);
      loadProducts();
    }
  };

  // Category Actions
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const data = await adminFetch('/categories', {
      method: 'POST',
      body: JSON.stringify({ name: newCategoryName.trim() })
    });
    if (data.success) {
      showToast('Category added.', 'success');
      setCategories(data.categories || []);
      setNewCategoryName('');
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete category "${cat}"?`)) return;
    const data = await adminFetch(`/categories/${encodeURIComponent(cat)}`, { method: 'DELETE' });
    if (data.success) {
      showToast('Category deleted.', 'success');
      setCategories(data.categories || []);
    }
  };

  // Toggle selection
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          checked={products.length > 0 && selectedIds.length === products.length}
          onChange={(e) => {
            if (e.target.checked) setSelectedIds(products.map(p => p._id));
            else setSelectedIds([]);
          }}
        />
      ),
      render: (p) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(p._id)}
          onChange={() => toggleSelect(p._id)}
        />
      )
    },
    {
      header: 'Product',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {p.image ? (
            <img src={p.image} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} color="#10b981" />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
              {p.name}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{p.category} • {p.unit || 'unit'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Price',
      render: (p) => <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>৳{p.price?.toLocaleString()}</span>
    },
    {
      header: 'Stock',
      render: (p) => (
        <span style={{
          padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: (p.stock || 0) <= 10 ? 'rgba(239,68,68,0.15)' : 'rgba(51,65,85,0.4)',
          color: (p.stock || 0) <= 10 ? '#ef4444' : '#cbd5e1'
        }}>
          {p.stock !== undefined ? p.stock : '—'} {(p.stock || 0) <= 10 && '⚠️ Low'}
        </span>
      )
    },
    {
      header: 'Seller',
      render: (p) => <span style={{ fontSize: 11, color: '#94a3b8' }}>{p.sellerName || 'AgriMind'}</span>
    },
    {
      header: 'Status',
      render: (p) => (
        <span style={{
          padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
          background: p.status === 'hidden' ? 'rgba(100,116,139,0.2)' : 'rgba(16,185,129,0.15)',
          color: p.status === 'hidden' ? '#94a3b8' : '#10b981'
        }}>
          {p.status?.toUpperCase() || 'ACTIVE'}
        </span>
      )
    }
  ];

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>AgriShop Marketplace Management</h2>
          <p style={styles.pageSubtitle}>Product catalog, stock thresholds, active ingredient tags, and category control</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowCategoryModal(true)} style={styles.btnSecondary}>
            <Layers size={14} /> Manage Categories
          </button>
          <button onClick={() => setShowAddModal(true)} style={styles.btnPrimary}>
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* Filter and Bulk Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ ...styles.inputGroup, flex: 1, minWidth: 200 }}>
          <Search size={14} color="#64748b" />
          <input
            style={styles.input}
            placeholder="Search products by title, description or seller..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select style={styles.select} value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => { setLowStockFilter(!lowStockFilter); setPage(1); }}
          style={{
            ...styles.btnSecondary,
            background: lowStockFilter ? 'rgba(239,68,68,0.2)' : 'rgba(15,23,42,0.6)',
            borderColor: lowStockFilter ? '#ef4444' : 'rgba(51,65,85,0.4)',
            color: lowStockFilter ? '#ef4444' : '#94a3b8'
          }}
        >
          <AlertCircle size={14} /> Low-Stock Alert View
        </button>

        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(51,65,85,0.3)', padding: '6px 12px', borderRadius: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>{selectedIds.length} Selected:</span>
            <button onClick={() => handleBulkStatus('active')} style={{ ...styles.btnSecondary, padding: '4px 8px', fontSize: 11 }}>Activate</button>
            <button onClick={() => handleBulkStatus('hidden')} style={{ ...styles.btnSecondary, padding: '4px 8px', fontSize: 11 }}>Hide</button>
          </div>
        )}
      </div>

      {/* Product Table */}
      <div style={styles.card}>
        <DataTable
          columns={columns}
          data={products}
          emptyMessage="No products matching filters."
          onRowAction={(p) => (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditProduct({
                  ...p,
                  activeIngredients: Array.isArray(p.activeIngredients) ? p.activeIngredients.join(', ') : (p.activeIngredients || ''),
                  treatmentTags: Array.isArray(p.treatmentTags) ? p.treatmentTags.join(', ') : (p.treatmentTags || '')
                })}
                style={styles.btnIcon}
                title="Edit Product"
              >
                <Edit3 size={14} color="#3b82f6" />
              </button>
              <button onClick={() => handleDelete(p._id)} style={styles.btnIcon} title="Delete Product">
                <Trash2 size={14} color="#ef4444" />
              </button>
            </div>
          )}
        />
        <Pagination page={page} pages={pages} onPageChange={setPage} />
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div style={styles.overlay} onClick={() => setShowAddModal(false)}>
          <div style={{ ...styles.modal, maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 20px' }}>Create AgriShop Product</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={styles.label}>Product Name</label>
                <input style={styles.modalInput} value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Category</label>
                <select style={styles.modalInput} value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={styles.label}>Price (৳)</label>
                <input type="number" style={styles.modalInput} value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Unit</label>
                <input style={styles.modalInput} value={newProduct.unit} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Stock Qty</label>
                <input type="number" style={styles.modalInput} value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Active Ingredients (used for diagnosis cross-linking, comma-separated)</label>
              <input
                style={styles.modalInput}
                placeholder="e.g. Amprolium, Toltrazuril, Electrolytes"
                value={newProduct.activeIngredients}
                onChange={e => setNewProduct({ ...newProduct, activeIngredients: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Description</label>
              <textarea style={{ ...styles.modalInput, height: 60 }} value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setShowAddModal(false)} style={styles.btnSecondary}>Cancel</button>
              <button onClick={handleCreate} style={styles.btnPrimary}>Create Product</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <div style={styles.overlay} onClick={() => setEditProduct(null)}>
          <div style={{ ...styles.modal, maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 20px' }}>Edit Product</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={styles.label}>Product Name</label>
                <input style={styles.modalInput} value={editProduct.name || ''} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Category</label>
                <select style={styles.modalInput} value={editProduct.category || ''} onChange={e => setEditProduct({ ...editProduct, category: e.target.value })}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={styles.label}>Price (৳)</label>
                <input type="number" style={styles.modalInput} value={editProduct.price || ''} onChange={e => setEditProduct({ ...editProduct, price: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Stock</label>
                <input type="number" style={styles.modalInput} value={editProduct.stock !== undefined ? editProduct.stock : ''} onChange={e => setEditProduct({ ...editProduct, stock: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Status</label>
                <select style={styles.modalInput} value={editProduct.status || 'active'} onChange={e => setEditProduct({ ...editProduct, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Active Ingredients (Comma-separated for Disease cross-linking)</label>
              <input style={styles.modalInput} value={editProduct.activeIngredients || ''} onChange={e => setEditProduct({ ...editProduct, activeIngredients: e.target.value })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Description</label>
              <textarea style={{ ...styles.modalInput, height: 60 }} value={editProduct.description || ''} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setEditProduct(null)} style={styles.btnSecondary}>Cancel</button>
              <button onClick={handleEditSave} style={styles.btnPrimary}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <div style={styles.overlay} onClick={() => setShowCategoryModal(false)}>
          <div style={{ ...styles.modal, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 16px' }}>Manage Categories</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                style={{ ...styles.modalInput, flex: 1 }}
                placeholder="New category name..."
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
              />
              <button onClick={handleAddCategory} style={styles.btnPrimary}>Add</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
              {categories.map(c => (
                <div key={c} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(15,23,42,0.8)', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{c}</span>
                  <button onClick={() => handleDeleteCategory(c)} style={{ ...styles.btnIcon, padding: 4 }} title="Delete Category">
                    <Trash2 size={12} color="#ef4444" />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setShowCategoryModal(false)} style={styles.btnSecondary}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. DOCTORS DIRECTORY MANAGEMENT (Task 5)
// ═══════════════════════════════════════════════════════════════════════════════
function DoctorManagementPage({ adminFetch, showToast }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  const [editDoctor, setEditDoctor] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: '', district: 'Dhaka', specialty: 'General Poultry Health',
    phone: '', email: '', videoFee: 350, farmVisitFee: 1200, isSynthetic: true, active: true
  });

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/doctors');
      if (data.success) {
        setDoctors(data.doctors || []);
      }
    } catch (_) {
      showToast('Failed to load doctors.', 'error');
    }
    setLoading(false);
  }, [adminFetch, showToast]);

  useEffect(() => { loadDoctors(); }, [loadDoctors]);

  const handleToggleVerified = async (d) => {
    const data = await adminFetch(`/doctors/${d._id}`, {
      method: 'PUT',
      body: JSON.stringify({ isSynthetic: !d.isSynthetic })
    });
    if (data.success) {
      showToast(`Doctor marked as ${!d.isSynthetic ? 'Synthetic' : 'Verified Real'}.`, 'success');
      loadDoctors();
    }
  };

  const handleToggleActive = async (d) => {
    const data = await adminFetch(`/doctors/${d._id}`, {
      method: 'PUT',
      body: JSON.stringify({ active: d.active === false ? true : false })
    });
    if (data.success) {
      showToast(`Doctor listing ${d.active === false ? 'reactivated' : 'deactivated (hidden from search)'}.`, 'success');
      loadDoctors();
    }
  };

  const handleAddDoctor = async () => {
    if (!newDoctor.name || !newDoctor.district) {
      showToast('Doctor name and district required.', 'error');
      return;
    }
    const data = await adminFetch('/doctors', {
      method: 'POST',
      body: JSON.stringify({
        ...newDoctor,
        consultationFee: { video: parseInt(newDoctor.videoFee), farmVisit: parseInt(newDoctor.farmVisitFee) }
      })
    });
    if (data.success) {
      showToast('Doctor added successfully.', 'success');
      setShowAddModal(false);
      loadDoctors();
    }
  };

  const handleEditDoctorSave = async () => {
    if (!editDoctor) return;
    const data = await adminFetch(`/doctors/${editDoctor._id}`, {
      method: 'PUT',
      body: JSON.stringify(editDoctor)
    });
    if (data.success) {
      showToast('Doctor updated successfully.', 'success');
      setEditDoctor(null);
      loadDoctors();
    }
  };

  let filtered = [...doctors];
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(d => d.name?.toLowerCase().includes(s) || d.specialty?.toLowerCase().includes(s));
  }
  if (districtFilter) {
    filtered = filtered.filter(d => d.district?.toLowerCase() === districtFilter.toLowerCase());
  }

  const columns = [
    {
      header: 'Veterinarian',
      render: (d) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff'
          }}>
            {d.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{d.name}</p>
            <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{d.specialty || 'General Vet'}</p>
          </div>
        </div>
      )
    },
    { header: 'District', key: 'district' },
    {
      header: 'Fees (Video / Visit)',
      render: (d) => (
        <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
          ৳{d.consultationFee?.video || 350} / ৳{d.consultationFee?.farmVisit || 1200}
        </span>
      )
    },
    {
      header: 'Verification',
      render: (d) => (
        <button
          onClick={() => handleToggleVerified(d)}
          style={{
            padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer',
            background: d.isSynthetic ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
            color: d.isSynthetic ? '#f59e0b' : '#10b981'
          }}
          title="Click to toggle Verified / Synthetic"
        >
          {d.isSynthetic ? 'Synthetic Seed' : 'Verified Real'}
        </button>
      )
    },
    {
      header: 'Listing Status',
      render: (d) => (
        <button
          onClick={() => handleToggleActive(d)}
          style={{
            padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer',
            background: d.active === false ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            color: d.active === false ? '#ef4444' : '#10b981'
          }}
          title="Click to toggle Public / Deactivated"
        >
          {d.active === false ? 'Deactivated' : 'Active (Public)'}
        </button>
      )
    }
  ];

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Doctor Directory Management</h2>
          <p style={styles.pageSubtitle}>Maintain veterinarian listings, real-vs-synthetic verification, and search visibility</p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={styles.btnPrimary}>
          <Plus size={14} /> Add Doctor Listing
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ ...styles.inputGroup, flex: 1, minWidth: 200 }}>
          <Search size={14} color="#64748b" />
          <input
            style={styles.input}
            placeholder="Search by doctor name, specialty..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.card}>
        <DataTable
          columns={columns}
          data={filtered}
          onRowAction={(d) => (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditDoctor({ ...d })} style={styles.btnIcon} title="Edit Doctor Details">
                <Edit3 size={14} color="#3b82f6" />
              </button>
            </div>
          )}
        />
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div style={styles.overlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 16px' }}>Add New Veterinarian</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Doctor Name</label>
              <input style={styles.modalInput} value={newDoctor.name} onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={styles.label}>District</label>
                <input style={styles.modalInput} value={newDoctor.district} onChange={e => setNewDoctor({ ...newDoctor, district: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Specialty</label>
                <input style={styles.modalInput} value={newDoctor.specialty} onChange={e => setNewDoctor({ ...newDoctor, specialty: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={styles.label}>Video Fee (৳)</label>
                <input type="number" style={styles.modalInput} value={newDoctor.videoFee} onChange={e => setNewDoctor({ ...newDoctor, videoFee: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Farm Visit Fee (৳)</label>
                <input type="number" style={styles.modalInput} value={newDoctor.farmVisitFee} onChange={e => setNewDoctor({ ...newDoctor, farmVisitFee: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setShowAddModal(false)} style={styles.btnSecondary}>Cancel</button>
              <button onClick={handleAddDoctor} style={styles.btnPrimary}>Create Doctor</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {editDoctor && (
        <div style={styles.overlay} onClick={() => setEditDoctor(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 16px' }}>Edit Doctor</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Doctor Name</label>
              <input style={styles.modalInput} value={editDoctor.name || ''} onChange={e => setEditDoctor({ ...editDoctor, name: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={styles.label}>District</label>
                <input style={styles.modalInput} value={editDoctor.district || ''} onChange={e => setEditDoctor({ ...editDoctor, district: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Specialty</label>
                <input style={styles.modalInput} value={editDoctor.specialty || ''} onChange={e => setEditDoctor({ ...editDoctor, specialty: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setEditDoctor(null)} style={styles.btnSecondary}>Cancel</button>
              <button onClick={handleEditDoctorSave} style={styles.btnPrimary}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. APPOINTMENTS OVERSIGHT (Task 5 & Task 2)
// ═══════════════════════════════════════════════════════════════════════════════
function AppointmentsOversightPage({ adminFetch, showToast, initialStatus }) {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus || 'all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [districtSearch, setDistrictSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);

  const loadAppointments = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page, limit: 20,
        status: statusFilter,
        type: typeFilter,
        district: districtSearch
      });
      const data = await adminFetch(`/appointments?${params}`);
      if (data.success) {
        setAppointments(data.appointments || []);
        setPages(data.pages || 0);
      }
    } catch (_) {
      showToast('Failed to load appointments.', 'error');
    }
  }, [adminFetch, page, statusFilter, typeFilter, districtSearch, showToast]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const handleStatusUpdate = async (id, status) => {
    const data = await adminFetch(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    if (data.success) {
      showToast(`Appointment status updated to ${status}.`, 'success');
      loadAppointments();
    }
  };

  const columns = [
    {
      header: 'ID',
      render: (a) => <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>{a._id}</span>
    },
    {
      header: 'Doctor',
      render: (a) => (
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Dr. {a.doctorName}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{a.doctorSpecialty} • {a.doctorDistrict}</p>
        </div>
      )
    },
    {
      header: 'Type',
      render: (a) => (
        <span style={{
          padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
          background: a.type === 'video' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
          color: a.type === 'video' ? '#3b82f6' : '#10b981'
        }}>
          {a.type === 'video' ? 'VIDEO CALL' : 'FARM VISIT'}
        </span>
      )
    },
    {
      header: 'Fee',
      render: (a) => <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>৳{a.fee}</span>
    },
    {
      header: 'Status',
      render: (a) => (
        <span style={{
          padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
          background: a.status === 'completed' ? 'rgba(16,185,129,0.15)' :
            a.status === 'cancelled' ? 'rgba(239,68,68,0.15)' :
              a.status === 'confirmed' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)',
          color: a.status === 'completed' ? '#10b981' :
            a.status === 'cancelled' ? '#ef4444' :
              a.status === 'confirmed' ? '#3b82f6' : '#f59e0b'
        }}>
          {a.status?.toUpperCase()}
        </span>
      )
    },
    {
      header: 'Created',
      render: (a) => <span style={{ fontSize: 11, color: '#64748b' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
    }
  ];

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Appointments Oversight</h2>
          <p style={styles.pageSubtitle}>All veterinarian consultations across farmers and doctors</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select style={styles.select} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select style={styles.select} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="all">All Consultation Types</option>
          <option value="video">Video Call</option>
          <option value="farm_visit">Farm Visit</option>
        </select>
        <input
          style={{ ...styles.inputGroup, padding: '10px 14px', width: 220 }}
          placeholder="Filter by district..."
          value={districtSearch}
          onChange={e => { setDistrictSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div style={styles.card}>
        <DataTable
          columns={columns}
          data={appointments}
          emptyMessage="No appointments found."
          onRowAction={(a) => (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              {a.status === 'pending' && (
                <button onClick={() => handleStatusUpdate(a._id, 'confirmed')} style={{ ...styles.btnSecondary, padding: '4px 8px', fontSize: 11, color: '#3b82f6' }}>
                  Confirm
                </button>
              )}
              {a.status !== 'completed' && a.status !== 'cancelled' && (
                <button onClick={() => handleStatusUpdate(a._id, 'completed')} style={{ ...styles.btnSecondary, padding: '4px 8px', fontSize: 11, color: '#10b981' }}>
                  Mark Completed
                </button>
              )}
            </div>
          )}
        />
        <Pagination page={page} pages={pages} onPageChange={setPage} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. FARMS OVERSIGHT PAGE (Task 6)
// ═══════════════════════════════════════════════════════════════════════════════
function FarmsManagementPage({ adminFetch, showToast }) {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [flaggedFilter, setFlaggedFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);

  const [viewFarm, setViewFarm] = useState(null);
  const [flagModal, setFlagModal] = useState(null);
  const [flagNote, setFlagNote] = useState('');

  const loadFarms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: 15, search,
        flagged: flaggedFilter ? 'true' : ''
      });
      const data = await adminFetch(`/farms?${params}`);
      if (data.success) {
        setFarms(data.farms || []);
        setPages(data.pages || 0);
      }
    } catch (_) {
      showToast('Failed to load farms.', 'error');
    }
    setLoading(false);
  }, [adminFetch, page, search, flaggedFilter, showToast]);

  useEffect(() => { loadFarms(); }, [loadFarms]);

  // Load single farm detail
  const handleViewFarm = async (f) => {
    try {
      const data = await adminFetch(`/farms/${f._id}`);
      if (data.success) setViewFarm(data);
    } catch (_) { }
  };

  // Toggle flag with note
  const handleSaveFlag = async () => {
    if (!flagModal) return;
    const isFlagging = !flagModal.flagged;
    const data = await adminFetch(`/farms/${flagModal._id}/flag`, {
      method: 'PUT',
      body: JSON.stringify({ flagged: isFlagging, note: flagNote })
    });
    if (data.success) {
      showToast(data.message, 'success');
      setFlagModal(null);
      setFlagNote('');
      loadFarms();
    }
  };

  // Delete farm cascade
  const handleDeleteFarm = async (fId) => {
    if (!window.confirm('PERMANENTLY erase this farm and all its batches, check-in logs, and photos?')) return;
    const data = await adminFetch(`/farms/${fId}`, { method: 'DELETE' });
    if (data.success) {
      showToast(data.message, 'success');
      loadFarms();
    }
  };

  const columns = [
    {
      header: 'Farm Name',
      render: (f) => (
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{f.farmName}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{f.city || 'Dhaka'}, {f.country || 'Bangladesh'}</p>
        </div>
      )
    },
    {
      header: 'Owner',
      render: (f) => (
        <div>
          <p style={{ margin: 0, fontSize: 12, color: '#cbd5e1' }}>{f.ownerName || f.userId?.name || '—'}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{f.phoneNumber || f.userId?.mobile || ''}</p>
        </div>
      )
    },
    {
      header: 'Breed',
      render: (f) => <span style={{ fontSize: 12, color: '#94a3b8' }}>{f.chickenType || 'Broiler'}</span>
    },
    {
      header: 'Flocks',
      render: (f) => <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{f.batchCount || 0} batches</span>
    },
    {
      header: 'Oversight Status',
      render: (f) => (
        <span style={{
          padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
          background: f.flagged ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
          color: f.flagged ? '#ef4444' : '#10b981'
        }}>
          {f.flagged ? 'Attention Required (Flagged)' : 'Looks Good'}
        </span>
      )
    }
  ];

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Farms Oversight</h2>
          <p style={styles.pageSubtitle}>Monitor farm health, investigate support issues, and review flock metrics</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ ...styles.inputGroup, flex: 1, minWidth: 200 }}>
          <Search size={14} color="#64748b" />
          <input
            style={styles.input}
            placeholder="Search farms by name, owner, city..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button
          onClick={() => { setFlaggedFilter(!flaggedFilter); setPage(1); }}
          style={{
            ...styles.btnSecondary,
            background: flaggedFilter ? 'rgba(239,68,68,0.2)' : 'rgba(15,23,42,0.6)',
            borderColor: flaggedFilter ? '#ef4444' : 'rgba(51,65,85,0.4)',
            color: flaggedFilter ? '#ef4444' : '#94a3b8'
          }}
        >
          <AlertTriangle size={14} /> Filter Flagged Only
        </button>
      </div>

      <div style={styles.card}>
        <DataTable
          columns={columns}
          data={farms}
          emptyMessage="No farms found."
          onRowAction={(f) => (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button onClick={() => handleViewFarm(f)} style={styles.btnIcon} title="Investigate Farm">
                <Eye size={14} color="#3b82f6" />
              </button>
              <button
                onClick={() => { setFlagModal(f); setFlagNote(f.flaggedNote || ''); }}
                style={styles.btnIcon}
                title={f.flagged ? 'Clear Follow-up Flag' : 'Flag for Follow-up'}
              >
                <AlertTriangle size={14} color={f.flagged ? '#ef4444' : '#64748b'} />
              </button>
              <button onClick={() => handleDeleteFarm(f._id)} style={styles.btnIcon} title="Permanent Erasure">
                <Trash2 size={14} color="#ef4444" />
              </button>
            </div>
          )}
        />
        <Pagination page={page} pages={pages} onPageChange={setPage} />
      </div>

      {/* Farm Detail Modal */}
      {viewFarm && (
        <div style={styles.overlay} onClick={() => setViewFarm(null)}>
          <div style={{ ...styles.modal, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{viewFarm.farm.farmName}</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Owner: {viewFarm.farm.ownerName} • {viewFarm.farm.city}</p>
              </div>
              <button onClick={() => setViewFarm(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>Active Batches ({viewFarm.batches?.length || 0})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {viewFarm.batches?.map((b, i) => (
                <div key={i} style={{ padding: '10px 14px', background: 'rgba(15,23,42,0.8)', borderRadius: 10, border: '1px solid rgba(51,65,85,0.3)', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{b.batchName}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Age: {b.currentAgeDays} days • Initial: {b.initialChickens} birds</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>{b.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {flagModal && (
        <div style={styles.overlay} onClick={() => setFlagModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 16px' }}>
              {flagModal.flagged ? 'Clear Flag on Farm' : 'Flag Farm for Follow-up'}
            </h3>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Follow-up Notes / Reason for Flagging</label>
              <textarea
                style={{ ...styles.modalInput, height: 80 }}
                placeholder="e.g. Suspected high mortality reporting error, request field officer visit..."
                value={flagNote}
                onChange={e => setFlagNote(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setFlagModal(null)} style={styles.btnSecondary}>Cancel</button>
              <button onClick={handleSaveFlag} style={flagModal.flagged ? styles.btnSecondary : styles.btnDanger}>
                {flagModal.flagged ? 'Clear Flag' : 'Save Flag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. DIAGNOSTICS OVERSIGHT PAGE (Task 6 & Task 2)
// ═══════════════════════════════════════════════════════════════════════════════
function DiagnosticsOversightPage({ adminFetch, showToast, initialFlagged }) {
  const [diagnostics, setDiagnostics] = useState([]);
  const [distribution, setDistribution] = useState({});
  const [search, setSearch] = useState('');
  const [flaggedFilter, setFlaggedFilter] = useState(initialFlagged === 'true');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);

  const [flagModal, setFlagModal] = useState(null);
  const [flagNote, setFlagNote] = useState('');

  const loadDiagnostics = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page, limit: 20, search,
        flagged: flaggedFilter ? 'true' : ''
      });
      const data = await adminFetch(`/diagnostics?${params}`);
      if (data.success) {
        setDiagnostics(data.diagnostics || []);
        setDistribution(data.distribution || {});
        setPages(data.pages || 0);
      }
    } catch (_) {
      showToast('Failed to load diagnostics.', 'error');
    }
  }, [adminFetch, page, search, flaggedFilter, showToast]);

  useEffect(() => { loadDiagnostics(); }, [loadDiagnostics]);

  const handleSaveFlag = async () => {
    if (!flagModal) return;
    const isFlagging = !flagModal.flagged;
    const data = await adminFetch(`/diagnostics/${flagModal._id}/flag`, {
      method: 'PUT',
      body: JSON.stringify({ flagged: isFlagging, note: flagNote })
    });
    if (data.success) {
      showToast(data.message, 'success');
      setFlagModal(null);
      setFlagNote('');
      loadDiagnostics();
    }
  };

  const columns = [
    {
      header: 'Droppings Photo',
      render: (d) => (
        d.inputs?.imageUrl ? (
          <img src={d.inputs.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(51,65,85,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={18} color="#64748b" />
          </div>
        )
      )
    },
    {
      header: 'Detected Disease',
      render: (d) => (
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: d.result?.prediction === 'Healthy' ? '#10b981' : '#f43f5e' }}>
            {d.result?.prediction || 'Unclear'}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>File: {d.inputs?.filename || 'sample.jpg'}</p>
        </div>
      )
    },
    {
      header: 'Confidence Score',
      render: (d) => {
        const conf = Math.round((d.result?.confidence || 0) * 100);
        return (
          <div style={{ minWidth: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: conf >= 85 ? '#10b981' : conf >= 70 ? '#f59e0b' : '#ef4444' }}>
              <span>{conf}%</span>
              <span>{conf >= 85 ? 'High' : conf >= 70 ? 'Moderate' : 'Low'}</span>
            </div>
            <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(51,65,85,0.4)', marginTop: 4, overflow: 'hidden' }}>
              <div style={{ width: `${conf}%`, height: '100%', background: conf >= 85 ? '#10b981' : conf >= 70 ? '#f59e0b' : '#ef4444' }} />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Date & Time',
      render: (d) => <span style={{ fontSize: 11, color: '#64748b' }}>{new Date(d.timestamp).toLocaleString()}</span>
    },
    {
      header: 'Audit Flag',
      render: (d) => (
        <span style={{
          padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
          background: d.flagged ? 'rgba(239,68,68,0.2)' : 'transparent',
          color: d.flagged ? '#ef4444' : '#64748b'
        }}>
          {d.flagged ? '⚠️ Flagged for Model Review' : 'Normal'}
        </span>
      )
    }
  ];

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Diagnostics & Model Oversight</h2>
          <p style={styles.pageSubtitle}>All fecal droppings analyses, model confidence distribution, and manual error flagging</p>
        </div>
      </div>

      {/* Confidence Analytics Distribution Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div style={{ ...styles.card, margin: 0, padding: 16, borderLeft: '4px solid #10b981' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>High Confidence (≥85%)</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#10b981', margin: '6px 0 0' }}>{distribution.highConfidence || 0}</p>
        </div>
        <div style={{ ...styles.card, margin: 0, padding: 16, borderLeft: '4px solid #f59e0b' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Moderate (70% - 84%)</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', margin: '6px 0 0' }}>{distribution.mediumConfidence || 0}</p>
        </div>
        <div style={{ ...styles.card, margin: 0, padding: 16, borderLeft: '4px solid #ef4444' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Inconclusive / Low (&lt;70%)</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', margin: '6px 0 0' }}>{distribution.lowConfidence || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ ...styles.inputGroup, flex: 1, minWidth: 200 }}>
          <Search size={14} color="#64748b" />
          <input
            style={styles.input}
            placeholder="Search by disease name or filename..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button
          onClick={() => { setFlaggedFilter(!flaggedFilter); setPage(1); }}
          style={{
            ...styles.btnSecondary,
            background: flaggedFilter ? 'rgba(239,68,68,0.2)' : 'rgba(15,23,42,0.6)',
            borderColor: flaggedFilter ? '#ef4444' : 'rgba(51,65,85,0.4)',
            color: flaggedFilter ? '#ef4444' : '#94a3b8'
          }}
        >
          <AlertTriangle size={14} /> Filter Flagged for Review
        </button>
      </div>

      <div style={styles.card}>
        <DataTable
          columns={columns}
          data={diagnostics}
          emptyMessage="No diagnostic results recorded."
          onRowAction={(d) => (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setFlagModal(d); setFlagNote(d.flaggedNote || ''); }}
                style={styles.btnIcon}
                title={d.flagged ? 'Clear Model Error Flag' : 'Flag Suspected Model Error'}
              >
                <AlertTriangle size={14} color={d.flagged ? '#ef4444' : '#64748b'} />
              </button>
            </div>
          )}
        />
        <Pagination page={page} pages={pages} onPageChange={setPage} />
      </div>

      {/* Flag Modal */}
      {flagModal && (
        <div style={styles.overlay} onClick={() => setFlagModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 16px' }}>
              {flagModal.flagged ? 'Clear Diagnostic Flag' : 'Flag Diagnosis for Follow-up'}
            </h3>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Notes (e.g. suspected false positive, anomalous droppings appearance)</label>
              <textarea
                style={{ ...styles.modalInput, height: 80 }}
                placeholder="Explain the suspected model anomaly..."
                value={flagNote}
                onChange={e => setFlagNote(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setFlagModal(null)} style={styles.btnSecondary}>Cancel</button>
              <button onClick={handleSaveFlag} style={flagModal.flagged ? styles.btnSecondary : styles.btnDanger}>
                {flagModal.flagged ? 'Clear Flag' : 'Save Flag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. CONTENT MANAGEMENT PAGE (Task 7)
// ═══════════════════════════════════════════════════════════════════════════════
function ContentManagementPage({ adminFetch, showToast }) {
  const [activeTab, setActiveTab] = useState('breeds');
  const [breeds, setBreeds] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [weatherThresholds, setWeatherThresholds] = useState({});
  const [homepage, setHomepage] = useState({ heroHeadline: '', heroSubtext: '', aboutTitle: '', aboutText: '' });

  // 2-step publish modal for breed lifecycle templates (Task 7)
  const [publishModal, setPublishModal] = useState(null);
  const [publishStep, setPublishStep] = useState(1);

  // Edit Treatment modal
  const [editTreatment, setEditTreatment] = useState(null);

  const loadContent = useCallback(async () => {
    try {
      const [bData, tData, wData, hData] = await Promise.all([
        adminFetch('/content/breeds'),
        adminFetch('/content/treatments'),
        adminFetch('/content/weather-thresholds'),
        adminFetch('/content/homepage')
      ]);
      if (bData.success) setBreeds(bData.breeds || []);
      if (tData.success) setTreatments(tData.treatments || []);
      if (wData.success) setWeatherThresholds(wData.thresholds || {});
      if (hData.success) setHomepage(hData.content || {});
    } catch (_) {
      showToast('Failed to load content definitions.', 'error');
    }
  }, [adminFetch, showToast]);

  useEffect(() => { loadContent(); }, [loadContent]);

  // Two-step publish for breed template
  const handlePublishBreed = async () => {
    if (!publishModal) return;
    const data = await adminFetch(`/content/breeds/${publishModal.chickenType}/publish`, {
      method: 'POST',
      body: JSON.stringify(publishModal.templateData)
    });
    if (data.success) {
      showToast(data.message, 'success');
      setPublishModal(null);
      setPublishStep(1);
      loadContent();
    } else {
      showToast(data.message || 'Failed to publish.', 'error');
    }
  };

  // Save weather thresholds
  const handleSaveWeather = async () => {
    const data = await adminFetch('/content/weather-thresholds', {
      method: 'PUT',
      body: JSON.stringify(weatherThresholds)
    });
    if (data.success) showToast('Weather alert thresholds updated.', 'success');
  };

  // Save homepage copy
  const handleSaveHomepage = async () => {
    const data = await adminFetch('/content/homepage', {
      method: 'PUT',
      body: JSON.stringify(homepage)
    });
    if (data.success) showToast('Homepage headline & about copy updated.', 'success');
  };

  // Save treatment edit
  const handleSaveTreatment = async () => {
    if (!editTreatment) return;
    const data = await adminFetch(`/content/treatments/${editTreatment._id || editTreatment.diseaseKey}`, {
      method: 'PUT',
      body: JSON.stringify(editTreatment)
    });
    if (data.success) {
      showToast('Disease treatment map updated.', 'success');
      setEditTreatment(null);
      loadContent();
    }
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Content & Rules Engine Management</h2>
          <p style={styles.pageSubtitle}>Breed lifecycle templates, veterinary treatment maps, weather alerts, and homepage copy</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'rgba(15,23,42,0.6)', padding: 6, borderRadius: 14, border: '1px solid rgba(51,65,85,0.3)' }}>
        {[
          { id: 'breeds', label: 'Breed Lifecycle Templates', icon: Feather },
          { id: 'treatments', label: 'Disease Treatment Maps', icon: Activity },
          { id: 'weather', label: 'Weather Alert Thresholds', icon: Globe },
          { id: 'homepage', label: 'Homepage Copy Editor', icon: FileText }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
              background: activeTab === t.id ? 'linear-gradient(135deg, #10b981, #14b8a6)' : 'transparent',
              color: activeTab === t.id ? '#0f172a' : '#94a3b8'
            }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* 1. Breed Templates */}
      {activeTab === 'breeds' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {breeds.map(b => (
            <div key={b.chickenType} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#e2e8f0' }}>{b.chickenType} Flock Lifecycle</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                    Active Version: <span style={{ color: '#10b981', fontWeight: 700 }}>v{b.active?.version || '1.0.0'}</span>
                    {' • '}Cycle: {b.active?.cycleLengthDays} days
                    {' • '}Stages: {b.active?.stages?.length || 0}
                  </p>
                </div>
                <button
                  onClick={() => { setPublishModal({ chickenType: b.chickenType, templateData: { ...b.active } }); setPublishStep(1); }}
                  style={styles.btnPrimary}
                >
                  Publish New Version (2-Step)
                </button>
              </div>

              {/* Stages Pill Strip */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {b.active?.stages?.map((s, idx) => (
                  <div key={idx} style={{ padding: '6px 12px', background: 'rgba(15,23,42,0.8)', borderRadius: 8, border: '1px solid rgba(51,65,85,0.3)', fontSize: 11 }}>
                    <span style={{ fontWeight: 700, color: '#cbd5e1' }}>{s.name}</span>
                    <span style={{ color: '#64748b', marginLeft: 6 }}>Day {s.fromDay}–{s.toDay}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Disease Treatment Maps */}
      {activeTab === 'treatments' && (
        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Disease</th>
                  <th style={styles.th}>Treatable</th>
                  <th style={styles.th}>Active Ingredients</th>
                  <th style={styles.th}>Vet Referral</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {treatments.map((t, idx) => (
                  <tr key={idx} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: 700, color: '#e2e8f0' }}>{t.diseaseName || t.diseaseKey}</td>
                    <td style={styles.td}>
                      <span style={{ color: t.treatable ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: 11 }}>
                        {t.treatable ? 'Yes' : 'No (Supportive Only)'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: 12, color: '#cbd5e1' }}>
                        {Array.isArray(t.activeIngredients) ? t.activeIngredients.join(', ') : '—'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ color: t.vetReferralRequired ? '#f59e0b' : '#64748b', fontSize: 11, fontWeight: 600 }}>
                        {t.vetReferralRequired ? 'Required' : 'Optional'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <button onClick={() => setEditTreatment({ ...t })} style={styles.btnIcon} title="Edit Mapping">
                        <Edit3 size={14} color="#3b82f6" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Weather Alert Thresholds */}
      {activeTab === 'weather' && (
        <div style={{ ...styles.card, maxWidth: 640 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>Configurable Weather Alert Parameters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={styles.label}>Heat Stress Temp (°C)</label>
              <input
                type="number"
                style={styles.modalInput}
                value={weatherThresholds.heatStressTempC || 32}
                onChange={e => setWeatherThresholds({ ...weatherThresholds, heatStressTempC: e.target.value })}
              />
            </div>
            <div>
              <label style={styles.label}>Forecast Heat Max (°C)</label>
              <input
                type="number"
                style={styles.modalInput}
                value={weatherThresholds.heatStressForecastMaxC || 34}
                onChange={e => setWeatherThresholds({ ...weatherThresholds, heatStressForecastMaxC: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={styles.label}>Humidity / Ammonia Risk (%)</label>
              <input
                type="number"
                style={styles.modalInput}
                value={weatherThresholds.humidityRiskPct || 80}
                onChange={e => setWeatherThresholds({ ...weatherThresholds, humidityRiskPct: e.target.value })}
              />
            </div>
            <div>
              <label style={styles.label}>Cold Snap Temp (°C)</label>
              <input
                type="number"
                style={styles.modalInput}
                value={weatherThresholds.coldSnapTempC || 15}
                onChange={e => setWeatherThresholds({ ...weatherThresholds, coldSnapTempC: e.target.value })}
              />
            </div>
          </div>
          <button onClick={handleSaveWeather} style={styles.btnPrimary}>
            <Save size={14} /> Update Weather Thresholds
          </button>
        </div>
      )}

      {/* 4. Homepage Copy */}
      {activeTab === 'homepage' && (
        <div style={{ ...styles.card, maxWidth: 640 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>Live Homepage Copy (No Code Deploy Required)</h3>
          <div style={{ marginBottom: 14 }}>
            <label style={styles.label}>Hero Headline</label>
            <input
              style={styles.modalInput}
              value={homepage.heroHeadline || ''}
              onChange={e => setHomepage({ ...homepage, heroHeadline: e.target.value })}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={styles.label}>Hero Subtext</label>
            <textarea
              style={{ ...styles.modalInput, height: 70 }}
              value={homepage.heroSubtext || ''}
              onChange={e => setHomepage({ ...homepage, heroSubtext: e.target.value })}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={styles.label}>About Section Title</label>
            <input
              style={styles.modalInput}
              value={homepage.aboutTitle || ''}
              onChange={e => setHomepage({ ...homepage, aboutTitle: e.target.value })}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={styles.label}>About Section Body Text</label>
            <textarea
              style={{ ...styles.modalInput, height: 90 }}
              value={homepage.aboutText || ''}
              onChange={e => setHomepage({ ...homepage, aboutText: e.target.value })}
            />
          </div>
          <button onClick={handleSaveHomepage} style={styles.btnPrimary}>
            <Save size={14} /> Publish Homepage Copy
          </button>
        </div>
      )}

      {/* Two-Step Publish Modal for Breed Lifecycle Template (Task 7) */}
      {publishModal && (
        <div style={styles.overlay} onClick={() => setPublishModal(null)}>
          <div style={{ ...styles.modal, maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Feather size={18} color="#10b981" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
                  {publishStep === 1 ? 'Step 1: Review Breed Lifecycle Guidance' : 'Step 2: Confirm Live Deployment'}
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Target breed: {publishModal.chickenType}</p>
              </div>
            </div>

            {publishStep === 1 ? (
              <div>
                <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 14 }}>
                  You are editing the lifecycle guidance for <strong>{publishModal.chickenType}</strong>. Changes to stages or targets will directly drive daily check-in tasks and vaccination schedules for all active flocks.
                </p>
                <div style={{ marginBottom: 14 }}>
                  <label style={styles.label}>Target Harvest Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    style={styles.modalInput}
                    value={publishModal.templateData?.targetHarvestWeightKg || ''}
                    onChange={e => setPublishModal({
                      ...publishModal,
                      templateData: { ...publishModal.templateData, targetHarvestWeightKg: parseFloat(e.target.value) }
                    })}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={styles.label}>Cycle Length (Days)</label>
                  <input
                    type="number"
                    style={styles.modalInput}
                    value={publishModal.templateData?.cycleLengthDays || ''}
                    onChange={e => setPublishModal({
                      ...publishModal,
                      templateData: { ...publishModal.templateData, cycleLengthDays: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setPublishModal(null)} style={styles.btnSecondary}>Cancel</button>
                  <button onClick={() => setPublishStep(2)} style={styles.btnPrimary}>
                    Proceed to Step 2: Confirmation →
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ padding: '14px 16px', background: 'rgba(245,158,11,0.1)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.3)', marginBottom: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', margin: '0 0 6px' }}>Two-Step Approval Required</p>
                  <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                    Publishing will increment the template version and log before/after values to the AdminAuditLog. It will take effect immediately across all farmer dashboards.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setPublishStep(1)} style={styles.btnSecondary}>← Back to Review</button>
                  <button onClick={handlePublishBreed} style={styles.btnPrimary}>
                    Publish Template Live Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Treatment Modal */}
      {editTreatment && (
        <div style={styles.overlay} onClick={() => setEditTreatment(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 16px' }}>Edit Disease Treatment Mapping</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Disease Name</label>
              <input style={styles.modalInput} disabled value={editTreatment.diseaseName || editTreatment.diseaseKey} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Active Ingredients (Comma separated)</label>
              <input
                style={styles.modalInput}
                value={Array.isArray(editTreatment.activeIngredients) ? editTreatment.activeIngredients.join(', ') : editTreatment.activeIngredients || ''}
                onChange={e => setEditTreatment({ ...editTreatment, activeIngredients: e.target.value.split(',').map(s => s.trim()) })}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Supportive Care Guidance Text</label>
              <textarea
                style={{ ...styles.modalInput, height: 70 }}
                value={editTreatment.supportiveCare || ''}
                onChange={e => setEditTreatment({ ...editTreatment, supportiveCare: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setEditTreatment(null)} style={styles.btnSecondary}>Cancel</button>
              <button onClick={handleSaveTreatment} style={styles.btnPrimary}>Save Mapping</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. SETTINGS & ADMIN TEAM & AUDIT LOG (Task 8 & Task 1)
// ═══════════════════════════════════════════════════════════════════════════════
function SettingsPage({ adminFetch, showToast, initialSubtab }) {
  const { user } = useContext(AuthContext);
  const [subtab, setSubtab] = useState(initialSubtab || 'platform');

  // Platform settings state
  const [settings, setSettings] = useState({
    diagnosisConfidenceThreshold: 0.70,
    photoRetentionDays: 90,
    mortalityThresholdPct: 0.5,
    lowStockThreshold: 10
  });

  // Admin users state
  const [admins, setAdmins] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', mobile: '', password: '', role: 'support' });

  // Audit logs state
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logPages, setLogPages] = useState(0);

  const loadSettingsData = useCallback(async () => {
    try {
      const [sData, aData] = await Promise.all([
        adminFetch('/settings'),
        adminFetch('/settings/admins')
      ]);
      if (sData.success) setSettings(sData.settings || {});
      if (aData.success) setAdmins(aData.admins || []);
    } catch (_) {
      showToast('Failed to load settings.', 'error');
    }
  }, [adminFetch, showToast]);

  const loadAuditLogs = useCallback(async () => {
    try {
      const data = await adminFetch(`/audit-log?page=${logPage}&limit=25`);
      if (data.success) {
        setLogs(data.logs || []);
        setLogPages(data.pages || 0);
      }
    } catch (_) { }
  }, [adminFetch, logPage]);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  useEffect(() => {
    if (subtab === 'audit') loadAuditLogs();
  }, [subtab, loadAuditLogs]);

  // Save Settings
  const handleSaveSettings = async () => {
    const data = await adminFetch('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    if (data.success) {
      showToast('Settings saved. Farmer-facing services updated immediately.', 'success');
    } else {
      showToast(data.message || 'Failed to save settings.', 'error');
    }
  };

  // Invite Admin
  const handleCreateAdmin = async () => {
    if (!newAdmin.name || !newAdmin.mobile || !newAdmin.password) {
      showToast('All fields are required.', 'error');
      return;
    }
    const data = await adminFetch('/settings/admins', {
      method: 'POST',
      body: JSON.stringify(newAdmin)
    });
    if (data.success) {
      showToast(data.message, 'success');
      setShowInviteModal(false);
      setNewAdmin({ name: '', mobile: '', password: '', role: 'support' });
      loadSettingsData();
    } else {
      showToast(data.message || 'Failed to create staff member.', 'error');
    }
  };

  // Revoke Admin
  const handleRevokeRole = async (targetId, newRole) => {
    if (!window.confirm(`Change access role to ${newRole}?`)) return;
    const data = await adminFetch(`/settings/admins/${targetId}`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole })
    });
    if (data.success) {
      showToast(data.message, 'success');
      loadSettingsData();
    }
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>System Configuration & Administration</h2>
          <p style={styles.pageSubtitle}>Algorithm confidence tuning, administrative accounts, and immutable audit logs</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'rgba(15,23,42,0.6)', padding: 6, borderRadius: 14, border: '1px solid rgba(51,65,85,0.3)' }}>
        {[
          { id: 'platform', label: 'Platform & ML Thresholds', icon: Sliders },
          { id: 'admins', label: 'Admin Staff & Roles', icon: Shield },
          { id: 'audit', label: 'Admin Audit Log', icon: Clock }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setSubtab(t.id)}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
              background: subtab === t.id ? 'linear-gradient(135deg, #10b981, #14b8a6)' : 'transparent',
              color: subtab === t.id ? '#0f172a' : '#94a3b8'
            }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* 1. Platform Settings */}
      {subtab === 'platform' && (
        <div style={{ ...styles.card, maxWidth: 640 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>Tuneable Business & Model Thresholds</h3>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>
            Changes here directly change farmer-facing evaluation logic across diagnosis and flock health banners.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={styles.label}>Diagnosis Confidence Threshold (0.10 – 0.99)</label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="0.99"
              style={styles.modalInput}
              value={settings.diagnosisConfidenceThreshold}
              onChange={e => setSettings({ ...settings, diagnosisConfidenceThreshold: e.target.value })}
            />
            <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>
              Predictions with confidence below this threshold are marked "Inconclusive" with no drugs recommended.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={styles.label}>Low Stock Warning Threshold</label>
              <input
                type="number"
                style={styles.modalInput}
                value={settings.lowStockThreshold}
                onChange={e => setSettings({ ...settings, lowStockThreshold: e.target.value })}
              />
            </div>
            <div>
              <label style={styles.label}>Daily Mortality Alert %</label>
              <input
                type="number"
                step="0.1"
                style={styles.modalInput}
                value={settings.mortalityThresholdPct}
                onChange={e => setSettings({ ...settings, mortalityThresholdPct: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={styles.label}>Photo Retention Days</label>
            <input
              type="number"
              style={styles.modalInput}
              value={settings.photoRetentionDays}
              onChange={e => setSettings({ ...settings, photoRetentionDays: e.target.value })}
            />
          </div>

          <button onClick={handleSaveSettings} style={styles.btnPrimary}>
            <Save size={14} /> Save Platform Thresholds
          </button>
        </div>
      )}

      {/* 2. Admin Staff Management */}
      {subtab === 'admins' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Authorized personnel with admin or support tier access</p>
            {user?.role === 'admin' && (
              <button onClick={() => setShowInviteModal(true)} style={styles.btnPrimary}>
                <Plus size={14} /> Add Staff Account
              </button>
            )}
          </div>

          <div style={styles.card}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {admins.map(a => (
                <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(15,23,42,0.8)', borderRadius: 10, border: '1px solid rgba(51,65,85,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: a.role === 'admin' ? '#10b981' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#0f172a' }}>
                      {a.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{a.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{a.mobile}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      background: a.role === 'admin' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                      color: a.role === 'admin' ? '#10b981' : '#3b82f6'
                    }}>
                      {a.role}
                    </span>
                    {user?.role === 'admin' && String(a._id) !== String(user.id) && (
                      <button
                        onClick={() => handleRevokeRole(a._id, a.role === 'admin' ? 'support' : 'farmer')}
                        style={{ ...styles.btnSecondary, padding: '4px 8px', fontSize: 11, color: '#ef4444' }}
                      >
                        {a.role === 'admin' ? 'Demote to Support' : 'Revoke Staff Access'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invite Staff Modal */}
          {showInviteModal && (
            <div style={styles.overlay} onClick={() => setShowInviteModal(false)}>
              <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 16px' }}>Create Staff Account</h3>
                <div style={{ marginBottom: 12 }}>
                  <label style={styles.label}>Full Name</label>
                  <input style={styles.modalInput} value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={styles.label}>Mobile Number (11 digits)</label>
                  <input style={styles.modalInput} placeholder="01XXXXXXXXX" value={newAdmin.mobile} onChange={e => setNewAdmin({ ...newAdmin, mobile: e.target.value })} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={styles.label}>Initial Password</label>
                  <input type="password" style={styles.modalInput} value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={styles.label}>Privilege Level</label>
                  <select style={styles.modalInput} value={newAdmin.role} onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}>
                    <option value="support">Support Staff (Read-mostly inspection)</option>
                    <option value="admin">Administrator (Full Write & Erasure Privileges)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowInviteModal(false)} style={styles.btnSecondary}>Cancel</button>
                  <button onClick={handleCreateAdmin} style={styles.btnPrimary}>Create Account</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Immutable Audit Log */}
      {subtab === 'audit' && (
        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Admin</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Target</th>
                  <th style={styles.th}>Details / Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={{ ...styles.td, fontSize: 11, color: '#64748b' }}>
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td style={{ ...styles.td, fontWeight: 700, color: '#cbd5e1' }}>
                      {l.adminName || 'Admin'}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '2px 6px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace',
                        background: l.action?.includes('delete') ? 'rgba(239,68,68,0.15)' :
                          l.action?.includes('create') ? 'rgba(16,185,129,0.15)' : 'rgba(51,65,85,0.4)',
                        color: l.action?.includes('delete') ? '#ef4444' :
                          l.action?.includes('create') ? '#10b981' : '#94a3b8'
                      }}>
                        {l.action}
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontSize: 12, color: '#cbd5e1' }}>
                      {l.targetType}: {l.targetId || '—'}
                    </td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#64748b', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.metadata ? JSON.stringify(l.metadata) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={logPage} pages={logPages} onPageChange={setLogPage} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MASTER ADMIN PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminPanel({ onExit }) {
  const { user, logout } = useContext(AuthContext);
  const adminFetch = useAdminFetch();

  const [activePage, setActivePage] = useState('dashboard');
  const [pageParams, setPageParams] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [stats, setStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Inactivity Lock Protection (Task 1: session timeout)
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const lastActivityRef = useRef(Date.now());

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // Inactivity tracking (15 minutes of inactivity triggers lock)
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    const interval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime > 15 * 60 * 1000 && !isSessionLocked) {
        setIsSessionLocked(true);
      }
    }, 15000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(interval);
    };
  }, [isSessionLocked]);

  const loadDashboard = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await adminFetch('/dashboard');
      if (data.success) setStats(data.stats || {});
    } catch (_) {
      showToast('Failed to load dashboard metrics.', 'error');
    }
    setStatsLoading(false);
  }, [adminFetch, showToast]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Navigate helper to switch tabs and pass options
  const navigateTo = (pageId, params = {}) => {
    setActivePage(pageId);
    setPageParams(params);
    setMobileSidebarOpen(false);
  };

  // 9 Distinct Sidebar Navigation Items (Task 2)
  const sidebarItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'farms', label: 'Farms', icon: Warehouse },
    { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Access Protection
  if (!user || (user.role !== 'admin' && user.role !== 'support')) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#0a0e1a',
        color: '#e2e8f0', padding: 24, textAlign: 'center'
      }}>
        <Shield size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>403 Forbidden — Access Denied</h2>
        <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 400, marginBottom: 24 }}>
          Administrative privileges are required to access this panel.
        </p>
        <button onClick={onExit} style={styles.btnPrimary}>
          <ArrowLeft size={14} /> Back to AgriMind Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      {/* ─── Sidebar Navigation ─── */}
      <aside style={{
        width: sidebarCollapsed ? 72 : 260,
        background: 'linear-gradient(180deg, #0d1527 0%, #0a0e1a 100%)',
        borderRight: '1px solid rgba(51,65,85,0.3)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        transform: typeof window !== 'undefined' && window.innerWidth < 768 ? (mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none'
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: sidebarCollapsed ? '20px 12px' : '20px 20px',
          borderBottom: '1px solid rgba(51,65,85,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Shield size={20} color="#0f172a" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.01em' }}>AgriMind</p>
                <p style={{ margin: 0, fontSize: 10, color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>Admin Portal</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#64748b' }}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* 9 Navigation Items */}
        <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {sidebarItems.map(item => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                title={sidebarCollapsed ? item.label : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: sidebarCollapsed ? '12px' : '10px 14px',
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
                  background: isActive ? 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(20,184,166,0.1))' : 'transparent',
                  color: isActive ? '#10b981' : '#94a3b8',
                  borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent'
                }}
              >
                <item.icon size={18} />
                {!sidebarCollapsed && item.label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{
          padding: sidebarCollapsed ? '16px 8px' : '16px 16px',
          borderTop: '1px solid rgba(51,65,85,0.3)',
          display: 'flex', flexDirection: 'column', gap: 8
        }}>
          <button
            onClick={onExit}
            title="Return to Public App"
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              background: 'rgba(51,65,85,0.3)', color: '#cbd5e1',
              fontSize: 12, fontWeight: 600, transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={16} />
            {!sidebarCollapsed && 'Exit to AgriMind'}
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main style={{
        flex: 1,
        marginLeft: sidebarCollapsed ? 72 : 260,
        transition: 'margin-left 0.25s ease',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Header */}
        <header style={{
          padding: '14px 28px',
          borderBottom: '1px solid rgba(51,65,85,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(13,21,39,0.7)', backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 30
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#e2e8f0', textTransform: 'capitalize' }}>
              {sidebarItems.find(i => i.id === activePage)?.label || 'Overview'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              padding: '4px 12px', borderRadius: 8, fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
              background: user.role === 'admin' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
              color: user.role === 'admin' ? '#10b981' : '#3b82f6', border: `1px solid ${user.role === 'admin' ? '#10b981' : '#3b82f6'}30`
            }}>
              {user.role}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: '#0f172a'
              }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>{user.name}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: 28, flex: 1 }}>
          {activePage === 'dashboard' && (
            <DashboardPage stats={stats} loading={statsLoading} onRefresh={loadDashboard} navigateTo={navigateTo} />
          )}
          {activePage === 'users' && (
            <UserManagementPage adminFetch={adminFetch} showToast={showToast} />
          )}
          {activePage === 'marketplace' && (
            <MarketplaceManagementPage adminFetch={adminFetch} showToast={showToast} />
          )}
          {activePage === 'doctors' && (
            <DoctorManagementPage adminFetch={adminFetch} showToast={showToast} />
          )}
          {activePage === 'appointments' && (
            <AppointmentsOversightPage adminFetch={adminFetch} showToast={showToast} initialStatus={pageParams.status} />
          )}
          {activePage === 'farms' && (
            <FarmsManagementPage adminFetch={adminFetch} showToast={showToast} />
          )}
          {activePage === 'diagnostics' && (
            <DiagnosticsOversightPage adminFetch={adminFetch} showToast={showToast} initialFlagged={pageParams.flagged} />
          )}
          {activePage === 'content' && (
            <ContentManagementPage adminFetch={adminFetch} showToast={showToast} />
          )}
          {activePage === 'settings' && (
            <SettingsPage adminFetch={adminFetch} showToast={showToast} initialSubtab={pageParams.subtab} />
          )}
        </div>
      </main>

      {/* Inactivity Session Lock Modal (Task 1) */}
      {isSessionLocked && (
        <div style={{ ...styles.overlay, zIndex: 200, backdropFilter: 'blur(8px)' }}>
          <div style={{ ...styles.modal, maxWidth: 400, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Lock size={24} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0', margin: '0 0 8px' }}>Session Inactivity Lock</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, margin: '0 0 20px' }}>
              Your administrator session was paused due to inactivity to protect sensitive platform data.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={onExit} style={styles.btnSecondary}>Exit to Home</button>
              <button
                onClick={() => {
                  lastActivityRef.current = Date.now();
                  setIsSessionLocked(false);
                  showToast('Admin session unlocked.', 'success');
                }}
                style={styles.btnPrimary}
              >
                <Unlock size={14} /> Resume Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = {
  pageHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24, flexWrap: 'wrap', gap: 12
  },
  pageTitle: {
    margin: 0, fontSize: 22, fontWeight: 800, color: '#e2e8f0',
    letterSpacing: '-0.02em'
  },
  pageSubtitle: {
    margin: '4px 0 0', fontSize: 13, color: '#64748b'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 16, marginBottom: 24
  },
  statCard: {
    padding: 20, borderRadius: 16,
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(51,65,85,0.3)',
    backdropFilter: 'blur(8px)'
  },
  card: {
    padding: 20, borderRadius: 16,
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(51,65,85,0.3)',
    backdropFilter: 'blur(8px)',
    marginBottom: 20
  },
  table: {
    width: '100%', borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left', padding: '12px 14px',
    fontSize: 11, fontWeight: 700, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '1px solid rgba(51,65,85,0.3)'
  },
  tr: {
    borderBottom: '1px solid rgba(51,65,85,0.15)',
    transition: 'background 0.15s'
  },
  td: {
    padding: '12px 14px', fontSize: 13, color: '#94a3b8',
    verticalAlign: 'middle'
  },
  inputGroup: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', borderRadius: 12,
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(51,65,85,0.4)',
  },
  input: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    color: '#e2e8f0', fontSize: 13, fontWeight: 500
  },
  select: {
    padding: '10px 14px', borderRadius: 12,
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(51,65,85,0.4)',
    color: '#e2e8f0', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', outline: 'none'
  },
  btnPrimary: {
    padding: '10px 18px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #10b981, #14b8a6)',
    color: '#0f172a', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
    transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
  },
  btnSecondary: {
    padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(51,65,85,0.4)',
    background: 'rgba(15,23,42,0.6)', color: '#94a3b8',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
  },
  btnDanger: {
    padding: '10px 18px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#fff', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
    transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
  },
  btnIcon: {
    padding: 6, borderRadius: 8, border: 'none',
    background: 'rgba(15,23,42,0.6)', cursor: 'pointer',
    transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
  },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
  },
  modal: {
    background: '#0d1527', border: '1px solid rgba(51,65,85,0.4)',
    borderRadius: 20, padding: 28, width: '100%', maxWidth: 480,
    maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
  },
  label: {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6
  },
  modalInput: {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.4)',
    color: '#e2e8f0', fontSize: 13, fontWeight: 500,
    outline: 'none', boxSizing: 'border-box'
  }
};
