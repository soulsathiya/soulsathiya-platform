import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  CreditCard,
  Heart,
  Flag,
  BarChart3,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronDown,
  BadgeCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const navItems = [
  { path: '/admin/dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { path: '/admin/users',         label: 'Users',          icon: Users           },
  { path: '/admin/profiles',      label: 'Profiles',       icon: UserCircle      },
  { path: '/admin/kyc',           label: 'KYC Verify',     icon: BadgeCheck      },
  { path: '/admin/subscriptions', label: 'Subscriptions',  icon: CreditCard      },
  { path: '/admin/deep',          label: 'Deep Exploration',icon: Heart          },
  { path: '/admin/reports',       label: 'Reports',        icon: Flag            },
  { path: '/admin/analytics',     label: 'Analytics',      icon: BarChart3       },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(location.state?.admin || null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(!location.state?.admin);

  useEffect(() => {
    if (location.state?.admin) return;

    const checkAuth = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/admin/me`, {
          withCredentials: true
        });
        setAdmin(response.data);
        setLoading(false);
      } catch (error) {
        navigate('/admin/login');
      }
    };

    checkAuth();
  }, [location.state, navigate]);

  const handleLogout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/admin/logout`, {}, { withCredentials: true });
      toast.success('Logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-red-500';
      case 'moderator': return 'bg-yellow-500';
      case 'support': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <Link to="/admin/dashboard" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">SoulSathiya</h1>
                  <p className="text-xs text-slate-400">Admin Panel</p>
                </div>
              </Link>
              <button
                className="lg:hidden text-slate-400 hover:text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Admin Profile */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10 bg-slate-600">
                <AvatarFallback className="bg-blue-600 text-white">
                  {admin?.full_name?.[0] || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {admin?.full_name}
                </p>
                <Badge className={`${getRoleBadgeColor(admin?.role)} text-white text-xs`}>
                  {admin?.role?.replace('_', ' ')}
                </Badge>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-white transition-colors"
                data-testid="admin-logout-btn"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <button
              className="lg:hidden text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 lg:flex-none">
              <h2 className="text-lg font-semibold text-white ml-4 lg:ml-0">
                {navItems.find(item => item.path === location.pathname)?.label || 'Admin'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-400 hidden sm:block">
                {admin?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet context={{ admin }} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
