import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  MoreVertical,
  Eye,
  UserX,
  UserCheck,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, type: '', user: null });
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/users`, {
        params: { skip: page * limit, limit, search: search || undefined },
        withCredentials: true
      });
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const viewUser = async (userId) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/users/${userId}`, {
        withCredentials: true
      });
      setSelectedUser(response.data);
      setViewModalOpen(true);
    } catch (error) {
      toast.error('Failed to load user details');
    }
  };

  const handleAction = async () => {
    const { type, user } = confirmModal;
    setActionLoading(true);

    try {
      let endpoint = '';
      switch (type) {
        case 'suspend':
          endpoint = `/api/admin/users/${user.user_id}/suspend`;
          break;
        case 'activate':
          endpoint = `/api/admin/users/${user.user_id}/activate`;
          break;
        case 'verify':
          endpoint = `/api/admin/users/${user.user_id}/verify`;
          break;
        case 'delete':
          await axios.delete(`${BACKEND_URL}/api/admin/users/${user.user_id}`, {
            withCredentials: true
          });
          toast.success('User deleted');
          setConfirmModal({ open: false, type: '', user: null });
          fetchUsers();
          return;
        default:
          return;
      }

      await axios.post(`${BACKEND_URL}${endpoint}`, {}, { withCredentials: true });
      toast.success(`User ${type}ed successfully`);
      setConfirmModal({ open: false, type: '', user: null });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${type} user`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (user) => {
    if (user.is_banned) return <Badge className="bg-red-500">Banned</Badge>;
    if (user.is_active === false) return <Badge className="bg-yellow-500">Suspended</Badge>;
    if (user.is_verified) return <Badge className="bg-green-500">Verified</Badge>;
    return <Badge className="bg-slate-500">Active</Badge>;
  };

  const getTierBadge = (tier) => {
    const colors = {
      basic: 'bg-green-600',
      premium: 'bg-blue-600',
      elite: 'bg-purple-600'
    };
    if (!tier) return null;
    return <Badge className={colors[tier] || 'bg-slate-600'}>{tier}</Badge>;
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
    <div className="space-y-4" data-testid="admin-users-page">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={handleSearch}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            data-testid="user-search-input"
          />
        </div>
        <div className="text-sm text-slate-400 self-center">
          Total: {total} users
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50">
                <th className="text-left p-4 text-sm font-medium text-slate-300">Name</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Email</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Tier</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Status</th>
                <th className="text-left p-4 text-sm font-medium text-slate-300">Joined</th>
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.user_id} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-sm">
                          {user.full_name?.[0] || '?'}
                        </div>
                        <span className="text-white font-medium">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{user.email}</td>
                    <td className="p-4">{getTierBadge(user.subscription_tier)}</td>
                    <td className="p-4">{getStatusBadge(user)}</td>
                    <td className="p-4 text-slate-400 text-sm">{formatDate(user.created_at)}</td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem
                            onClick={() => viewUser(user.user_id)}
                            className="text-slate-200 hover:bg-slate-700"
                          >
                            <Eye className="w-4 h-4 mr-2" /> View Profile
                          </DropdownMenuItem>
                          {user.is_active !== false ? (
                            <DropdownMenuItem
                              onClick={() => setConfirmModal({ open: true, type: 'suspend', user })}
                              className="text-yellow-400 hover:bg-slate-700"
                            >
                              <UserX className="w-4 h-4 mr-2" /> Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setConfirmModal({ open: true, type: 'activate', user })}
                              className="text-green-400 hover:bg-slate-700"
                            >
                              <UserCheck className="w-4 h-4 mr-2" /> Activate
                            </DropdownMenuItem>
                          )}
                          {!user.is_verified && (
                            <DropdownMenuItem
                              onClick={() => setConfirmModal({ open: true, type: 'verify', user })}
                              className="text-blue-400 hover:bg-slate-700"
                            >
                              <ShieldCheck className="w-4 h-4 mr-2" /> Verify
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setConfirmModal({ open: true, type: 'delete', user })}
                            className="text-red-400 hover:bg-slate-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
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

      {/* View User Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Full Name</label>
                  <p className="text-white">{selectedUser.user?.full_name}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Email</label>
                  <p className="text-white">{selectedUser.user?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Subscription</label>
                  <p className="text-white capitalize">{selectedUser.user?.subscription_tier || 'Free'}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Verified</label>
                  <p className="text-white">{selectedUser.user?.is_verified ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {selectedUser.profile && (
                <>
                  <h4 className="text-lg font-semibold text-white border-t border-slate-700 pt-4">Profile</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400">Gender</label>
                      <p className="text-white capitalize">{selectedUser.profile.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">City</label>
                      <p className="text-white">{selectedUser.profile.city || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Occupation</label>
                      <p className="text-white">{selectedUser.profile.occupation || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Education</label>
                      <p className="text-white">{selectedUser.profile.education || 'N/A'}</p>
                    </div>
                  </div>
                </>
              )}

              {selectedUser.photos?.length > 0 && (
                <>
                  <h4 className="text-lg font-semibold text-white border-t border-slate-700 pt-4">Photos</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedUser.photos.map((photo, idx) => (
                      <div key={idx} className="aspect-square bg-slate-700 rounded-lg overflow-hidden">
                        <img src={photo.s3_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {selectedUser.psychometric && (
                <>
                  <h4 className="text-lg font-semibold text-white border-t border-slate-700 pt-4">Psychometric</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400">Archetype</label>
                      <p className="text-white capitalize">{selectedUser.psychometric.archetype_primary || 'N/A'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Action Modal */}
      <Dialog open={confirmModal.open} onOpenChange={(open) => !open && setConfirmModal({ open: false, type: '', user: null })}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
              Confirm {confirmModal.type}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to {confirmModal.type} user "{confirmModal.user?.full_name}"?
              {confirmModal.type === 'delete' && ' This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmModal({ open: false, type: '', user: null })}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading}
              className={confirmModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
