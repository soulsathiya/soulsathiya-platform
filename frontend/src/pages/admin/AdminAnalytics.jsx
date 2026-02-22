import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  CreditCard,
  Heart,
  IndianRupee,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const BarChartSimple = ({ data, valueKey = 'count', labelKey = 'week', color = 'bg-blue-500', maxHeight = 120 }) => {
  const maxValue = Math.max(...data.map(d => d[valueKey]), 1);
  
  return (
    <div className="flex items-end justify-between h-full gap-2 pt-4">
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center flex-1">
          <div
            className={`${color} rounded-t w-full min-w-[20px] transition-all duration-300`}
            style={{ height: `${(item[valueKey] / maxValue) * maxHeight}px` }}
          />
          <span className="text-xs text-slate-500 mt-2 truncate w-full text-center">
            {item[labelKey]}
          </span>
        </div>
      ))}
    </div>
  );
};

const PieChartSimple = ({ data, colors }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="-1 -1 2 2" className="w-32 h-32" style={{ transform: 'rotate(-90deg)' }}>
        {data.map((slice, i) => {
          const percent = slice.count / total;
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += percent;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = percent > 0.5 ? 1 : 0;

          return (
            <path
              key={i}
              d={`M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`}
              fill={colors[i % colors.length]}
            />
          );
        })}
      </svg>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-slate-300 text-sm capitalize">{item.tier}</span>
            <span className="text-slate-500 text-sm">({item.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/analytics`, {
        withCredentials: true
      });
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const tierColors = ['#64748b', '#22c55e', '#3b82f6', '#a855f7'];

  return (
    <div className="space-y-6" data-testid="admin-analytics-page">
      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Subscription Revenue</span>
            <CreditCard className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            ₹{analytics?.revenue?.subscriptions?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Boost Revenue</span>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            ₹{analytics?.revenue?.boosts?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Deep Exploration Revenue</span>
            <Heart className="w-5 h-5 text-pink-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            ₹{analytics?.revenue?.deep_exploration?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 bg-gradient-to-br from-green-900/30 to-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Total Revenue</span>
            <IndianRupee className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-400">
            ₹{analytics?.revenue?.total?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Users Per Week */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-500" />
            New Users Per Week
          </h3>
          <div className="h-40">
            {analytics?.users_per_week?.length > 0 ? (
              <BarChartSimple
                data={analytics.users_per_week}
                valueKey="count"
                labelKey="week"
                color="bg-blue-500"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Subscriptions by Tier */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-purple-500" />
            Subscriptions by Tier
          </h3>
          <div className="flex items-center justify-center py-4">
            {analytics?.subscriptions_by_tier?.length > 0 ? (
              <PieChartSimple
                data={analytics.subscriptions_by_tier}
                colors={tierColors}
              />
            ) : (
              <div className="text-slate-500">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Deep Unlocks Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Heart className="w-5 h-5 mr-2 text-pink-500" />
          Deep Exploration Unlocks Per Week
        </h3>
        <div className="h-40">
          {analytics?.deep_unlocks_per_week?.length > 0 ? (
            <BarChartSimple
              data={analytics.deep_unlocks_per_week}
              valueKey="count"
              labelKey="week"
              color="bg-pink-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-green-500" />
          Summary Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-slate-400">Total Weeks Analyzed</p>
            <p className="text-xl font-bold text-white">{analytics?.users_per_week?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Avg New Users/Week</p>
            <p className="text-xl font-bold text-white">
              {analytics?.users_per_week?.length > 0
                ? Math.round(analytics.users_per_week.reduce((a, b) => a + b.count, 0) / analytics.users_per_week.length)
                : 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Tiers</p>
            <p className="text-xl font-bold text-white">{analytics?.subscriptions_by_tier?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Avg Deep Unlocks/Week</p>
            <p className="text-xl font-bold text-white">
              {analytics?.deep_unlocks_per_week?.length > 0
                ? Math.round(analytics.deep_unlocks_per_week.reduce((a, b) => a + b.count, 0) / analytics.deep_unlocks_per_week.length)
                : 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
