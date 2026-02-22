import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Heart,
  FileText,
  CreditCard,
  Zap,
  IndianRupee,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

const TierCard = ({ tier, count, color }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
    <div className="flex items-center space-x-3">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <span className="text-slate-300 capitalize">{tier}</span>
    </div>
    <span className="font-semibold text-white">{count}</span>
  </div>
);

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/dashboard/metrics`, {
        withCredentials: true
      });
      setMetrics(response.data);
    } catch (error) {
      toast.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const tierColors = {
    free: 'bg-slate-500',
    basic: 'bg-green-500',
    premium: 'bg-blue-500',
    elite: 'bg-purple-500'
  };

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={metrics?.total_users?.toLocaleString() || 0}
          icon={Users}
          color="bg-blue-600"
        />
        <StatCard
          title="Active Users"
          value={metrics?.active_users?.toLocaleString() || 0}
          icon={UserCheck}
          color="bg-green-600"
          subtitle="Last 30 days"
        />
        <StatCard
          title="Matches Made"
          value={metrics?.total_matches?.toLocaleString() || 0}
          icon={Heart}
          color="bg-pink-600"
        />
        <StatCard
          title="Revenue This Month"
          value={`₹${(metrics?.revenue_this_month || 0).toLocaleString()}`}
          icon={IndianRupee}
          color="bg-amber-600"
        />
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Deep Exploration Unlocked"
          value={metrics?.deep_exploration_unlocked || 0}
          icon={Heart}
          color="bg-purple-600"
        />
        <StatCard
          title="Deep Reports Completed"
          value={metrics?.deep_reports_completed || 0}
          icon={FileText}
          color="bg-indigo-600"
        />
        <StatCard
          title="Boost Purchases"
          value={metrics?.boost_purchases || 0}
          icon={Zap}
          color="bg-orange-600"
        />
      </div>

      {/* Subscriptions by Tier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
            Subscriptions by Tier
          </h3>
          <div className="space-y-1">
            {Object.entries(metrics?.subscriptions_by_tier || {}).map(([tier, count]) => (
              <TierCard
                key={tier}
                tier={tier}
                count={count}
                color={tierColors[tier] || 'bg-slate-500'}
              />
            ))}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Conversion Rate</span>
              <span className="text-white font-semibold">
                {metrics?.total_users > 0
                  ? ((Object.values(metrics?.subscriptions_by_tier || {}).reduce((a, b) => a + b, 0) - (metrics?.subscriptions_by_tier?.free || 0)) / metrics.total_users * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Avg Revenue/User</span>
              <span className="text-white font-semibold">
                ₹{metrics?.total_users > 0
                  ? Math.round(metrics?.revenue_this_month / metrics.total_users)
                  : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Deep Report Rate</span>
              <span className="text-white font-semibold">
                {metrics?.deep_exploration_unlocked > 0
                  ? ((metrics?.deep_reports_completed / metrics.deep_exploration_unlocked) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
