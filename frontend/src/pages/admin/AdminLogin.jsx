import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Loader2, Key, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [passwordChangeData, setPasswordChangeData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/admin/me`, { withCredentials: true });
        if (response.data.require_password_change) {
          setShowPasswordChange(true);
          setAdminData(response.data);
          setCheckingAuth(false);
        } else {
          navigate('/admin/dashboard');
        }
      } catch {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/login`,
        formData,
        { withCredentials: true }
      );

      if (response.data.admin?.require_password_change) {
        setShowPasswordChange(true);
        setAdminData(response.data.admin);
        setPasswordChangeData(prev => ({ ...prev, oldPassword: formData.password }));
        toast.info('Please change your password to continue');
      } else {
        toast.success('Login successful!');
        navigate('/admin/dashboard', { state: { admin: response.data.admin } });
      }
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const message = (Array.isArray(detail) ? detail[0]?.msg : detail) || error?.message || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordChangeData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);

    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/change-password`,
        null,
        { 
          params: {
            old_password: passwordChangeData.oldPassword,
            new_password: passwordChangeData.newPassword
          },
          withCredentials: true 
        }
      );

      toast.success('Password changed successfully!');
      navigate('/admin/dashboard', { state: { admin: adminData } });
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const message = (Array.isArray(detail) ? detail[0]?.msg : detail) || error?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (showPasswordChange) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 rounded-xl mb-4">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Change Password</h1>
            <p className="text-slate-400">Please set a new secure password to continue</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200">
                For security reasons, you must change your password on first login.
              </p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-slate-200">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password (min 8 chars)"
                    className="pl-10 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                    value={passwordChangeData.newPassword}
                    onChange={(e) => setPasswordChangeData({ ...passwordChangeData, newPassword: e.target.value })}
                    required
                    minLength={8}
                    data-testid="new-password-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-200">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    className="pl-10 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                    value={passwordChangeData.confirmPassword}
                    onChange={(e) => setPasswordChangeData({ ...passwordChangeData, confirmPassword: e.target.value })}
                    required
                    data-testid="confirm-password-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                disabled={loading}
                data-testid="change-password-submit"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Changing Password...</>
                ) : (
                  'Change Password & Continue'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SoulSathiya Admin</h1>
          <p className="text-slate-400">Sign in to access the admin panel</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@soulsathiya.com"
                  className="pl-10 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="admin-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  data-testid="admin-password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
              data-testid="admin-login-submit"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Protected area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
