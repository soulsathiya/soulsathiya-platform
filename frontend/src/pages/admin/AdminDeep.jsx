import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  Eye,
  Ban,
  MoreVertical,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDeep = () => {
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedPair, setSelectedPair] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, pair: null });
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 20;

  const fetchPairs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/deep`, {
        params: { skip: page * limit, limit },
        withCredentials: true
      });
      setPairs(response.data.pairs);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Failed to load deep exploration pairs');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPairs();
  }, [fetchPairs]);

  const handleRevoke = async () => {
    setActionLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/deep/${confirmModal.pair.pair_id}/revoke`,
        {},
        { withCredentials: true }
      );
      toast.success('Deep exploration access revoked');
      setConfirmModal({ open: false, pair: null });
      fetchPairs();
    } catch (error) {
      toast.error('Failed to revoke access');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (pair) => {
    if (pair.status === 'revoked') return <Badge className="bg-red-500">Revoked</Badge>;
    if (pair.report) return <Badge className="bg-green-500">Completed</Badge>;
    if (pair.completed_users?.length === 2) return <Badge className="bg-blue-500">Ready for Report</Badge>;
    if (pair.completed_users?.length === 1) return <Badge className="bg-yellow-500">1/2 Completed</Badge>;
    return <Badge className="bg-slate-500">Started</Badge>;
  };

  const getPaymentBadge = (status) => {
    const config = {
      paid: 'bg-green-600',
      free: 'bg-purple-600',
      pending: 'bg-yellow-600'
    };
    return <Badge className={`${config[status] || 'bg-slate-600'} text-white`}>{status}</Badge>;
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
    <div className="space-y-4" data-testid="admin-deep-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">Deep Exploration Monitoring</h2>
          <p className="text-sm text-slate-400">Monitor and manage couple compatibility assessments</p>
        </div>
        <div className="text-sm text-slate-400">
          Total: {total} pairs
        </div>
      </div>

      {/* Pairs Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50">
                <th className="text-left p-4 text-sm font-medium text-slate-300">Pair ID</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Users</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Payment</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Progress</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Score</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Unlocked</th>
                <th className="text-right p-4 text-sm font-medium text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : pairs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No deep exploration pairs found
                  </td>
                </tr>
              ) : (
                pairs.map((pair) => (
                  <tr key={pair.pair_id} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="p-4">
                      <span className="text-slate-300 font-mono text-sm">{pair.pair_id.slice(0, 12)}...</span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs">
                            {pair.user_a?.full_name?.[0] || '?'}
                          </div>
                          <span className="text-white text-sm">{pair.user_a?.full_name || 'Unknown'}</span>
                          {pair.completed_users?.includes(pair.user_a_id) && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                            {pair.user_b?.full_name?.[0] || '?'}
                          </div>
                          <span className="text-white text-sm">{pair.user_b?.full_name || 'Unknown'}</span>
                          {pair.completed_users?.includes(pair.user_b_id) && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getPaymentBadge(pair.payment_status || 'free')}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(pair)}
                    </td>
                    <td className="p-4">
                      {pair.report?.deep_score ? (
                        <span className="text-white font-semibold">{pair.report.deep_score}%</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {formatDate(pair.unlocked_at)}
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
                            onClick={() => { setSelectedPair(pair); setViewModalOpen(true); }}
                            className="text-slate-200 hover:bg-slate-700"
                          >
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          {pair.status !== 'revoked' && (
                            <DropdownMenuItem
                              onClick={() => setConfirmModal({ open: true, pair })}
                              className="text-red-400 hover:bg-slate-700"
                            >
                              <Ban className="w-4 h-4 mr-2" /> Revoke Access
                            </DropdownMenuItem>
                          )}
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

      {/* View Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Heart className="w-5 h-5 mr-2 text-pink-500" />
              Deep Exploration Details
            </DialogTitle>
          </DialogHeader>
          {selectedPair && (
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-3">Pair Members</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white">
                        {selectedPair.user_a?.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedPair.user_a?.full_name}</p>
                        <p className="text-xs text-slate-400">{selectedPair.user_a?.email}</p>
                      </div>
                    </div>
                    {selectedPair.completed_users?.includes(selectedPair.user_a_id) ? (
                      <Badge className="bg-green-600">Completed</Badge>
                    ) : (
                      <Badge className="bg-yellow-600">Pending</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        {selectedPair.user_b?.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedPair.user_b?.full_name}</p>
                        <p className="text-xs text-slate-400">{selectedPair.user_b?.email}</p>
                      </div>
                    </div>
                    {selectedPair.completed_users?.includes(selectedPair.user_b_id) ? (
                      <Badge className="bg-green-600">Completed</Badge>
                    ) : (
                      <Badge className="bg-yellow-600">Pending</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Payment Status</label>
                  <p className="text-white capitalize">{selectedPair.payment_status || 'Free (Elite)'}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Tier at Unlock</label>
                  <p className="text-white capitalize">{selectedPair.tier_at_unlock || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Unlocked At</label>
                  <p className="text-white">{formatDate(selectedPair.unlocked_at)}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Deep Score</label>
                  <p className="text-white font-semibold">
                    {selectedPair.report?.deep_score ? `${selectedPair.report.deep_score}%` : 'Not generated'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400">Pair ID</label>
                <p className="text-slate-300 font-mono text-sm break-all">{selectedPair.pair_id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Access Modal */}
      <Dialog open={confirmModal.open} onOpenChange={(open) => !open && setConfirmModal({ open: false, pair: null })}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Revoke Deep Exploration Access
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to revoke deep exploration access for this pair? They will no longer be able to access their report.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmModal({ open: false, pair: null })}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRevoke}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Revoke Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDeep;
