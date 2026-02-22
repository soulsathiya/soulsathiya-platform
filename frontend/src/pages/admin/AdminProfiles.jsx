import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  MoreVertical,
  Check,
  Flag,
  Trash2,
  Eye,
  Image,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
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

const AdminProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [flagModal, setFlagModal] = useState({ open: false, profile: null });
  const [flagReason, setFlagReason] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, type: '', data: null });
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 20;

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { skip: page * limit, limit };
      if (statusFilter === 'flagged') params.status = 'flagged';
      
      const response = await axios.get(`${BACKEND_URL}/api/admin/profiles`, {
        params,
        withCredentials: true
      });
      setProfiles(response.data.profiles);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleApprove = async (profileId) => {
    setActionLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/admin/profiles/${profileId}/approve`, {}, {
        withCredentials: true
      });
      toast.success('Profile approved');
      fetchProfiles();
    } catch (error) {
      toast.error('Failed to approve profile');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    setActionLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/profiles/${flagModal.profile.profile_id}/flag`,
        null,
        { params: { reason: flagReason }, withCredentials: true }
      );
      toast.success('Profile flagged');
      setFlagModal({ open: false, profile: null });
      setFlagReason('');
      fetchProfiles();
    } catch (error) {
      toast.error('Failed to flag profile');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setActionLoading(true);
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/photos/${confirmModal.data}`, {
        withCredentials: true
      });
      toast.success('Photo removed');
      setConfirmModal({ open: false, type: '', data: null });
      if (viewModalOpen && selectedProfile) {
        // Refresh the selected profile
        const response = await axios.get(`${BACKEND_URL}/api/admin/users/${selectedProfile.user_id}`, {
          withCredentials: true
        });
        setSelectedProfile({ ...selectedProfile, photos: response.data.photos || [] });
      }
      fetchProfiles();
    } catch (error) {
      toast.error('Failed to remove photo');
    } finally {
      setActionLoading(false);
    }
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
    <div className="space-y-4" data-testid="admin-profiles-page">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white hover:bg-slate-700">All Profiles</SelectItem>
            <SelectItem value="flagged" className="text-white hover:bg-slate-700">Flagged Only</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-slate-400 self-center">
          Total: {total} profiles
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            No profiles found
          </div>
        ) : (
          profiles.map((profile) => (
            <div
              key={profile.profile_id}
              className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden"
            >
              {/* Photos Row */}
              <div className="flex h-24 bg-slate-900">
                {profile.photos?.slice(0, 3).map((photo, idx) => (
                  <div key={idx} className="flex-1 relative">
                    <img
                      src={photo.s3_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {(!profile.photos || profile.photos.length === 0) && (
                  <div className="flex-1 flex items-center justify-center text-slate-600">
                    <Image className="w-8 h-8" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{profile.user?.full_name || 'Unknown'}</h3>
                    <p className="text-sm text-slate-400">{profile.user?.email}</p>
                  </div>
                  {profile.is_flagged && (
                    <Badge className="bg-red-500">Flagged</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-slate-400">City:</span>
                    <span className="text-slate-200 ml-1">{profile.city || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Gender:</span>
                    <span className="text-slate-200 ml-1 capitalize">{profile.gender || 'N/A'}</span>
                  </div>
                </div>

                {profile.is_flagged && profile.flag_reason && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-4">
                    <p className="text-xs text-red-400">
                      <strong>Flag reason:</strong> {profile.flag_reason}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSelectedProfile(profile); setViewModalOpen(true); }}
                    className="flex-1 border-slate-600 text-slate-300"
                  >
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  {profile.is_flagged ? (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(profile.profile_id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFlagModal({ open: true, profile })}
                      className="flex-1 border-yellow-600 text-yellow-500 hover:bg-yellow-600/20"
                    >
                      <Flag className="w-4 h-4 mr-1" /> Flag
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between p-4">
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

      {/* View Profile Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Profile Details</DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Full Name</label>
                  <p className="text-white">{selectedProfile.user?.full_name}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Email</label>
                  <p className="text-white">{selectedProfile.user?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Gender</label>
                  <p className="text-white capitalize">{selectedProfile.gender || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">City</label>
                  <p className="text-white">{selectedProfile.city || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Occupation</label>
                  <p className="text-white">{selectedProfile.occupation || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Education</label>
                  <p className="text-white">{selectedProfile.education || 'N/A'}</p>
                </div>
              </div>

              {selectedProfile.bio && (
                <div>
                  <label className="text-sm text-slate-400">Bio</label>
                  <p className="text-white">{selectedProfile.bio}</p>
                </div>
              )}

              {selectedProfile.photos?.length > 0 && (
                <>
                  <h4 className="text-lg font-semibold text-white border-t border-slate-700 pt-4">
                    Photos ({selectedProfile.photos.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedProfile.photos.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        <div className="aspect-square bg-slate-700 rounded-lg overflow-hidden">
                          <img src={photo.s3_url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <button
                          onClick={() => setConfirmModal({ open: true, type: 'removePhoto', data: photo.photo_id })}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Flag Profile Modal */}
      <Dialog open={flagModal.open} onOpenChange={(open) => !open && setFlagModal({ open: false, profile: null })}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Flag Profile</DialogTitle>
            <DialogDescription className="text-slate-400">
              Please provide a reason for flagging this profile.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Reason for flagging..."
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            className="bg-slate-900 border-slate-600 text-white"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setFlagModal({ open: false, profile: null }); setFlagReason(''); }}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleFlag}
              disabled={actionLoading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Flag Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Photo Modal */}
      <Dialog open={confirmModal.open && confirmModal.type === 'removePhoto'} onOpenChange={(open) => !open && setConfirmModal({ open: false, type: '', data: null })}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Remove Photo
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to remove this photo? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmModal({ open: false, type: '', data: null })}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRemovePhoto}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProfiles;
