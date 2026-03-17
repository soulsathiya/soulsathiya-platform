import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Shield, CheckCircle, XCircle, Clock, Eye, Filter,
  ChevronLeft, ChevronRight, Search, RefreshCw, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge }  from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:  { cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pending'  },
    approved: { cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Approved' },
    rejected: { cls: 'bg-red-500/20 text-red-400 border-red-500/30',   label: 'Rejected' },
  };
  const s = map[status] || { cls: 'bg-slate-600/30 text-slate-400 border-slate-600', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function MethodBadge({ method }) {
  if (!method) return <span className="text-slate-500 text-xs">—</span>;
  return method === 'digilocker'
    ? <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">🏛️ DigiLocker</span>
    : <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">📄 Manual</span>;
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ user, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason.trim()) { toast.error('Please enter a rejection reason.'); return; }
    setLoading(true);
    await onConfirm(user.user_id, reason.trim());
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Reject KYC</h3>
            <p className="text-sm text-slate-400">{user.full_name}</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Rejection Reason</label>
          <textarea
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Document is blurry. Please resubmit with a clearer image."
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 resize-none focus:outline-none focus:border-red-400 transition-colors"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate-600 text-slate-300">
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading || !reason.trim()}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white">
            {loading ? 'Rejecting…' : 'Confirm Reject'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Document preview modal ────────────────────────────────────────────────────
function PreviewModal({ url, label, onClose }) {
  const isPdf = url?.includes('.pdf') || url?.toLowerCase().includes('pdf');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-4 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">{label}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold">✕</button>
        </div>
        <div className="rounded-xl overflow-hidden bg-black max-h-[70vh] flex items-center justify-center">
          {isPdf
            ? <iframe src={url} title={label} className="w-full h-[60vh] border-0" />
            : <img src={url} alt={label} className="max-w-full max-h-[60vh] object-contain" />
          }
        </div>
        <p className="text-xs text-slate-500 text-center">
          This link expires in 5 minutes for security.
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminKYC() {
  const { admin } = useOutletContext() || {};

  const [rows,       setRows]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [statusFilt, setStatusFilt] = useState('pending');
  const [methodFilt, setMethodFilt] = useState('');
  const [page,       setPage]       = useState(1);
  const [rejectUser, setRejectUser] = useState(null);
  const [preview,    setPreview]    = useState(null);   // { url, label }

  const limit = 15;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchKYC = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (statusFilt) params.status = statusFilt;
      if (methodFilt) params.method = methodFilt;
      const { data } = await axios.get(`${BACKEND_URL}/api/admin/kyc`, {
        params, withCredentials: true,
      });
      setRows(data.results || []);
      setTotal(data.total  || 0);
    } catch {
      toast.error('Failed to load KYC submissions.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilt, methodFilt]);

  useEffect(() => { fetchKYC(); }, [fetchKYC]);

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = async (userId) => {
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/admin/kyc/${userId}/approve`, {},
        { withCredentials: true }
      );
      toast.success(data.message || 'KYC approved');
      fetchKYC();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Approve failed.');
    }
  };

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleReject = async (userId, reason) => {
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/admin/kyc/${userId}/reject`,
        { reason },
        { withCredentials: true }
      );
      toast.success(data.message || 'KYC rejected');
      setRejectUser(null);
      fetchKYC();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Reject failed.');
    }
  };

  // ── Open signed-URL preview ───────────────────────────────────────────────
  const openDoc = async (userId, type) => {
    try {
      const endpoint = type === 'document'
        ? `/api/admin/kyc/${userId}/document-url`
        : `/api/admin/kyc/${userId}/selfie-url`;
      const { data } = await axios.get(`${BACKEND_URL}${endpoint}`, { withCredentials: true });
      setPreview({ url: data.url, label: type === 'document' ? 'KYC Document' : 'Selfie' });
    } catch {
      toast.error('Could not load preview. The file may not exist.');
    }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" /> KYC Verification
          </h1>
          <p className="text-slate-400 text-sm mt-1">{total} submission{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={fetchKYC} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 p-4 bg-slate-800 rounded-xl border border-slate-700">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Filter className="w-4 h-4" /> Filters:
        </div>

        {/* Status */}
        <div className="flex gap-2">
          {['', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => { setStatusFilt(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilt === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Method */}
        <div className="flex gap-2 ml-auto">
          {['', 'manual', 'digilocker'].map(m => (
            <button key={m} onClick={() => { setMethodFilt(m); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                methodFilt === m
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}>
              {m === '' ? 'Any Method' : m === 'digilocker' ? '🏛️ DigiLocker' : '📄 Manual'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No KYC submissions found for the selected filters.</p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Method</th>
                  <th className="text-left px-4 py-3">Submitted</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Documents</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {rows.map(row => (
                  <tr key={row.user_id} className="hover:bg-slate-700/30 transition-colors">

                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {row.picture
                          ? <img src={row.picture} alt={row.full_name} className="w-9 h-9 rounded-full object-cover border border-slate-600" />
                          : <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                              <User className="w-4 h-4 text-slate-400" />
                            </div>
                        }
                        <div>
                          <p className="text-sm font-semibold text-white">{row.full_name || '—'}</p>
                          <p className="text-xs text-slate-500">{row.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Method */}
                    <td className="px-4 py-3">
                      <MethodBadge method={row.kyc_method} />
                    </td>

                    {/* Submitted */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-slate-400">
                        {row.kyc_submitted_at
                          ? new Date(row.kyc_submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'
                        }
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <StatusBadge status={row.kyc_status} />
                        {row.kyc_status === 'rejected' && row.kyc_rejection_reason && (
                          <p className="text-xs text-red-400/80 max-w-[160px] truncate" title={row.kyc_rejection_reason}>
                            ↳ {row.kyc_rejection_reason}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Documents */}
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {row.kyc_method === 'manual' && (
                          <>
                            <button onClick={() => openDoc(row.user_id, 'document')}
                              title="View Document"
                              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2 py-1 rounded-lg transition-all">
                              <Eye className="w-3.5 h-3.5" /> Doc
                            </button>
                            <button onClick={() => openDoc(row.user_id, 'selfie')}
                              title="View Selfie"
                              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-2 py-1 rounded-lg transition-all">
                              <Eye className="w-3.5 h-3.5" /> Selfie
                            </button>
                          </>
                        )}
                        {row.kyc_method === 'digilocker' && (
                          <span className="text-xs text-slate-500 italic">Auto-verified</span>
                        )}
                        {!row.kyc_method && <span className="text-xs text-slate-600">—</span>}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {row.kyc_status !== 'approved' && (
                          <button onClick={() => handleApprove(row.user_id)}
                            className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/25 px-2.5 py-1.5 rounded-lg transition-all">
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        {row.kyc_status !== 'rejected' && (
                          <button onClick={() => setRejectUser(row)}
                            className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/25 px-2.5 py-1.5 rounded-lg transition-all">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        )}
                        {row.kyc_status === 'approved' && row.kyc_status !== 'rejected' && (
                          <span className="text-xs text-emerald-500/70 italic">Verified ✔</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ─────────────────────────────────────────────── */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-400 self-center px-2">Page {page} / {pages}</span>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {rejectUser && (
        <RejectModal
          user={rejectUser}
          onClose={() => setRejectUser(null)}
          onConfirm={handleReject}
        />
      )}
      {preview && (
        <PreviewModal
          url={preview.url}
          label={preview.label}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
