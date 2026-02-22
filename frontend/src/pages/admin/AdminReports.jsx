import React, { useState, useEffect, useCallback } from 'react';
import {
  Flag,
  MoreVertical,
  AlertTriangle,
  Ban,
  ShieldAlert,
  CheckCircle,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState({ open: false, type: '', report: null });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 20;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = { skip: page * limit, limit };
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await axios.get(`${BACKEND_URL}/api/admin/reports`, {
        params,
        withCredentials: true
      });
      setReports(response.data.reports);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateStatus = async (reportId, status, action = null) => {
    setActionLoading(true);
    try {
      await axios.put(
        `${BACKEND_URL}/api/admin/reports/${reportId}`,
        null,
        { params: { status, action }, withCredentials: true }
      );
      toast.success('Report updated');
      fetchReports();
    } catch (error) {
      toast.error('Failed to update report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async () => {
    const { type, report } = actionModal;
    if (!actionReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    
    setActionLoading(true);
    try {
      let endpoint = '';
      switch (type) {
        case 'warn':
          endpoint = `/api/admin/users/${report.reported_user_id}/warn`;
          break;
        case 'suspend':
          endpoint = `/api/admin/users/${report.reported_user_id}/suspend`;
          break;
        case 'ban':
          endpoint = `/api/admin/users/${report.reported_user_id}/ban`;
          break;
        default:
          return;
      }

      await axios.post(
        `${BACKEND_URL}${endpoint}`,
        null,
        { params: { reason: actionReason }, withCredentials: true }
      );
      
      // Update report status
      await handleUpdateStatus(report.report_id, 'resolved', type);
      
      toast.success(`User ${type}ed successfully`);
      setActionModal({ open: false, type: '', report: null });
      setActionReason('');
    } catch (error) {
      toast.error(`Failed to ${type} user`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-600', label: 'Pending' },
      reviewing: { color: 'bg-blue-600', label: 'Reviewing' },
      resolved: { color: 'bg-green-600', label: 'Resolved' },
      dismissed: { color: 'bg-slate-600', label: 'Dismissed' }
    };
    const { color, label } = config[status] || { color: 'bg-slate-600', label: status };
    return <Badge className={`${color} text-white`}>{label}</Badge>;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4" data-testid="admin-reports-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">User Reports</h2>
          <p className="text-sm text-slate-400">Review and manage reported users</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white hover:bg-slate-700">All Reports</SelectItem>
              <SelectItem value="pending" className="text-white hover:bg-slate-700">Pending</SelectItem>
              <SelectItem value="reviewing" className="text-white hover:bg-slate-700">Reviewing</SelectItem>
              <SelectItem value="resolved" className="text-white hover:bg-slate-700">Resolved</SelectItem>
              <SelectItem value="dismissed" className="text-white hover:bg-slate-700">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-slate-400">Total: {total}</span>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50">
                <th className="text-left p-4 text-sm font-medium text-slate-300">Reporter</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Reported User</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Reason</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Status</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Date</th>
                <th className="text-right p-4 text-sm font-medium text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No reports found
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.report_id} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">{report.reporter?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{report.reporter?.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">{report.reported_user?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{report.reported_user?.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-300 text-sm max-w-xs truncate" title={report.reason}>
                        {report.reason}
                      </p>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem
                            onClick={() => { setSelectedReport(report); setViewModalOpen(true); }}
                            className="text-slate-200 hover:bg-slate-700"
                          >
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          {report.status === 'pending' && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(report.report_id, 'reviewing')}
                              className="text-blue-400 hover:bg-slate-700"
                            >
                              <Flag className="w-4 h-4 mr-2" /> Mark Reviewing
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setActionModal({ open: true, type: 'warn', report })}
                            className="text-yellow-400 hover:bg-slate-700"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" /> Warn User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setActionModal({ open: true, type: 'suspend', report })}
                            className="text-orange-400 hover:bg-slate-700"
                          >
                            <ShieldAlert className="w-4 h-4 mr-2" /> Suspend User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setActionModal({ open: true, type: 'ban', report })}
                            className="text-red-400 hover:bg-slate-700"
                          >
                            <Ban className="w-4 h-4 mr-2" /> Ban User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(report.report_id, 'dismissed')}
                            className="text-slate-400 hover:bg-slate-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> Dismiss
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between p-4 border-t border-slate-700">
            <span className="text-sm text-slate-400">
              Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="border-slate-600 text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * limit >= total}
                className="border-slate-600 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View Report Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Flag className="w-5 h-5 mr-2 text-red-500" />
              Report Details
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-4 space-y-3">
                <div>
                  <label className="text-xs text-slate-500 uppercase">Reporter</label>
                  <p className="text-white">{selectedReport.reporter?.full_name}</p>
                  <p className="text-sm text-slate-400">{selectedReport.reporter?.email}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Reported User</label>
                  <p className="text-white">{selectedReport.reported_user?.full_name}</p>
                  <p className="text-sm text-slate-400">{selectedReport.reported_user?.email}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400">Reason</label>
                <p className="text-white bg-slate-900 rounded-lg p-3 mt-1">{selectedReport.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Reported On</label>
                  <p className="text-white mt-1">{formatDate(selectedReport.created_at)}</p>
                </div>
              </div>

              {selectedReport.action_taken && (
                <div>
                  <label className="text-sm text-slate-400">Action Taken</label>
                  <p className="text-white capitalize">{selectedReport.action_taken}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Modal */}
      <Dialog open={actionModal.open} onOpenChange={(open) => !open && setActionModal({ open: false, type: '', report: null })}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              {actionModal.type === 'warn' && <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />}
              {actionModal.type === 'suspend' && <ShieldAlert className="w-5 h-5 mr-2 text-orange-500" />}
              {actionModal.type === 'ban' && <Ban className="w-5 h-5 mr-2 text-red-500" />}
              {actionModal.type?.charAt(0).toUpperCase() + actionModal.type?.slice(1)} User
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {actionModal.type === 'warn' && 'Send a warning to this user.'}
              {actionModal.type === 'suspend' && 'Temporarily suspend this user account.'}
              {actionModal.type === 'ban' && 'Permanently ban this user from the platform.'}
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Reason</label>
            <Input
              placeholder={`Reason for ${actionModal.type}...`}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="bg-slate-900 border-slate-600 text-white"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setActionModal({ open: false, type: '', report: null }); setActionReason(''); }}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading}
              className={
                actionModal.type === 'warn' ? 'bg-yellow-600 hover:bg-yellow-700' :
                actionModal.type === 'suspend' ? 'bg-orange-600 hover:bg-orange-700' :
                'bg-red-600 hover:bg-red-700'
              }
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${actionModal.type?.charAt(0).toUpperCase() + actionModal.type?.slice(1)} User`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;
