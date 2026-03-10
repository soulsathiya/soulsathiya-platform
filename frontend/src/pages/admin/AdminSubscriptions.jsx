import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  MoreVertical,
  Crown,
  Calendar,
  Ban,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [confirmModal, setConfirmModal] = useState({ open: false, type: '', user: null, data: null });
  const [extendDays, setExtendDays] = useState('30');
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 20;

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/subscriptions`, {
        params: { skip: page * limit, limit },
        withCredentials: true
      });
      setSubscriptions(response.data.subscriptions);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleChangeTier = async (userId, tier) => {
    setActionLoading(true);
    try {
      await axios.put(
        `${BACKEND_URL}/api/admin/subscriptions/${userId}/tier`,
        null,
        { params: { tier }, withCredentials: true }
      );
      toast.success(`Tier changed to ${tier}`);
      fetchSubscriptions();
    } catch (error) {
      toast.error('Failed to change tier');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtend = async () => {
    const days = parseInt(extendDays);
    if (isNaN(days) || days <= 0) {
      toast.error('Please enter a valid number of days');
      return;
    }
    setActionLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/subscriptions/${confirmModal.user.user_id}/extend`,
        null,
        { params: { days }, withCredentials: true }
      );
      toast.success(`Subscription extended by ${days} days`);
      setConfirmModal({ open: false, type: '', user: null, data: null });
      fetchSubscriptions();
    } catch (error) {
      toast.error('Failed to extend subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/subscriptions/${confirmModal.user.user_id}/cancel`,
        {},
        { withCredentials: true }
      );
      toast.success('Subscription cancelled');
      setConfirmModal({ open: false, type: '', user: null, data: null });
      fetchSubscriptions();
    } catch (error) {
      toast.error('Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const getTierBadge = (tier) => {
    const config = {
      basic: { color: 'bg-green-600', label: 'Basic' },
      premium: { color: 'bg-blue-600', label: 'Premium' },
      elite: { color: 'bg-purple-600', label: 'Elite' }
    };
    const { color, label } = config[tier] || { color: 'bg-slate-600', label: tier };
    return <Badge className={`${color} text-white`}>{label}</Badge>;
  };

  const getStatusBadge = (status) => {
    const config = {
      active: 'bg-green-600',
      cancelled: 'bg-red-600',
      expired: 'bg-yellow-600'
    };
    return <Badge className={`${config[status] || 'bg-slate-600'} text-white`}>{status}</Badge>;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4" data-testid="admin-subscriptions-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">Subscriptions</h2>
          <p className="text-sm text-slate-400">Manage user subscriptions and tiers</p>
        </div>
        <div className="text-sm text-slate-400">
          Total: {total} subscribed users
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50">
                <th className="text-left p-4 text-sm font-medium text-slate-300">User</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Plan</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Status</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Started</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Expires</th>
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
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.user_id} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">{sub.full_name}</p>
                        <p className="text-sm text-slate-400">{sub.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      {getTierBadge(sub.subscription_tier)}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(sub.subscription_status)}
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {formatDate(sub.tier_updated_at || sub.created_at)}
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {formatDate(sub.subscription_expires_at)}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="text-slate-200 hover:bg-slate-700">
                              <Crown className="w-4 h-4 mr-2" /> Change Tier
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="bg-slate-800 border-slate-700">
                              {['basic', 'premium', 'elite'].map((tier) => (
                                <DropdownMenuItem
                                  key={tier}
                                  onClick={() => handleChangeTier(sub.user_id, tier)}
                                  className="text-slate-200 hover:bg-slate-700 capitalize"
                                >
                                  {tier}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuItem
                            onClick={() => setConfirmModal({ open: true, type: 'extend', user: sub })}
                            className="text-blue-400 hover:bg-slate-700"
                          >
                            <Calendar className="w-4 h-4 mr-2" /> Extend
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setConfirmModal({ open: true, type: 'cancel', user: sub })}
                            className="text-red-400 hover:bg-slate-700"
                          >
                            <Ban className="w-4 h-4 mr-2" /> Cancel
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

      {/* Extend Subscription Modal */}
      <Dialog open={confirmModal.open && confirmModal.type === 'extend'} onOpenChange={(open) => !open && setConfirmModal({ open: false, type: '', user: null })}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              Extend Subscription
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Extend subscription for {confirmModal.user?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Number of days</label>
              <Input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                placeholder="30"
                className="bg-slate-900 border-slate-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmModal({ open: false, type: '', user: null })}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtend}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Extend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Modal */}
      <Dialog open={confirmModal.open && confirmModal.type === 'cancel'} onOpenChange={(open) => !open && setConfirmModal({ open: false, type: '', user: null })}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to cancel the subscription for {confirmModal.user?.full_name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmModal({ open: false, type: '', user: null })}
              className="border-slate-600 text-slate-300"
            >
              No, Keep it
            </Button>
            <Button
              onClick={handleCancel}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptions;
