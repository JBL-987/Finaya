import { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  Activity,
  Award,
  Target,
  Zap,
  Clock,
  MapPin,
  Layers,
  ChevronRight,
  Star
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { authAPI, analysisAPI } from '../services/api';
import { Skeleton } from '../components/ui/Skeleton';
import { formatCurrency } from '../services/currencies';

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(
    localStorage.getItem('selectedCurrency') || 'USD'
  );

  useEffect(() => {
    localStorage.setItem('selectedCurrency', selectedCurrency);
  }, [selectedCurrency]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [userData, analysesData] = await Promise.all([
          authAPI.getCurrentUser(),
          analysisAPI.getAll(0, 20) // Get more analyses for charts
        ]);

        setUser(userData);
        setAnalyses(analysesData);
        generateDashboardStats(analysesData);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const generateDashboardStats = (analysesData) => {
    const stats = {
      totalAnalyses: analysesData.length,
      thisWeekAnalyses: analysesData.filter(a =>
        new Date(a.created_at) >= startOfWeek(new Date())
      ).length,
      avgMonthlyRevenue: analysesData.length > 0 ?
        analysesData.reduce((sum, a) => sum + (a.data?.metrics?.monthly_revenue || 0), 0) / analysesData.length : 0,
      topLocation: analysesData.length > 0 ?
        analysesData.reduce((acc, curr) => {
          const loc = curr.location_name || curr.location;
          acc[loc] = (acc[loc] || 0) + 1;
          return acc;
        }, {}) : {}
    };

    stats.topLocation = Object.entries(stats.topLocation)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    setDashboardStats(stats);
  };

  // Mock data for charts
  const activityData = analyses.slice(-7).map((analysis, index) => ({
    date: format(new Date(analysis.created_at), 'MMM dd'),
    analyses: 1,
    revenue: analysis.data?.metrics?.monthly_revenue || Math.random() * 50000,
    cumulative: analyses.slice(0, index + 1).length
  }));

  const revenueData = analyses.slice(-6).map((analysis, index) => ({
    month: format(subDays(new Date(), 30 * (5 - index)), 'MMM yyyy'),
    predicted: analysis.data?.metrics?.monthly_revenue || 0,
    actual: analysis.data?.metrics?.monthly_revenue * (0.8 + Math.random() * 0.4) || 0
  }));

  const analysisTypeData = analyses.reduce((acc, analysis) => {
    const type = analysis.analysis_type || 'business_profitability';
    const existing = acc.find(item => item.type === type);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({
        type,
        count: 1,
        color: type === 'business_profitability' ? '#f59e0b' :
               type === 'financial' ? '#3b82f6' : '#10b981'
      });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header Section */}
        <div className="bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            {/* Empty header content */}
          </div>
        </div>



      {/* Key Metrics Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24 bg-gray-700" />
                    <Skeleton className="h-8 w-16 bg-gray-700" />
                    <Skeleton className="h-3 w-32 bg-gray-700" />
                  </div>
                  <Skeleton className="h-8 w-8 bg-gray-700" />
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
            {/* Activity Trend Chart */}
            <div className="lg:col-span-2 xl:col-span-2 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-32 bg-gray-700" />
                <div className="flex space-x-4">
                  <Skeleton className="h-3 w-16 bg-gray-700" />
                  <Skeleton className="h-3 w-16 bg-gray-700" />
                </div>
              </div>
              <div className="h-64">
                <Skeleton className="h-full w-full bg-gray-700" />
              </div>
            </div>

            {/* Analysis Type Distribution */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <Skeleton className="h-6 w-40 mb-4 bg-gray-700" />
              <div className="h-64 mb-4">
                <Skeleton className="h-full w-full bg-gray-700 rounded-full" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Skeleton className="h-3 w-3 rounded-full mr-2 bg-gray-700" />
                      <Skeleton className="h-3 w-24 bg-gray-700" />
                    </div>
                    <Skeleton className="h-3 w-6 bg-gray-700" />
                  </div>
                ))}
              </div>
            </div>

            {/* Regression Analysis */}
            <div className="lg:col-span-2 xl:col-span-2 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-36 bg-gray-700" />
                <Skeleton className="h-3 w-20 bg-gray-700" />
              </div>
              <div className="h-64">
                <Skeleton className="h-full w-full bg-gray-700" />
              </div>
            </div>

            {/* Quick Stats Sidebar */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 space-y-4">
              <Skeleton className="h-6 w-28 mb-6 bg-gray-700" />

              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full bg-gray-700" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20 bg-gray-700" />
                      <Skeleton className="h-3 w-16 bg-gray-700" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="border-t border-gray-700 pt-4 space-y-3">
                <Skeleton className="h-10 w-full bg-gray-700 rounded-lg" />
                <Skeleton className="h-10 w-full bg-gray-700 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-32 bg-gray-700" />
              <Skeleton className="h-4 w-24 bg-gray-700" />
            </div>

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full bg-gray-700" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32 bg-gray-700" />
                      <Skeleton className="h-3 w-16 bg-gray-700" />
                    </div>
                    <Skeleton className="h-3 w-24 mt-1 bg-gray-700" />
                    <Skeleton className="h-4 w-20 mt-2 bg-gray-700" />
                  </div>
                  <Skeleton className="h-5 w-5 bg-gray-700" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Error: {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p>No user data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header Section */}
      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Empty header content */}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total Analyses</p>
                <p className="text-3xl font-bold text-white mt-1">{dashboardStats?.totalAnalyses || 0}</p>
                <p className="text-blue-400 text-xs mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{dashboardStats?.thisWeekAnalyses || 0} this week
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Avg. Revenue</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(Math.round(dashboardStats?.avgMonthlyRevenue || 0), selectedCurrency)}
                </p>
                <p className="text-green-400 text-xs mt-1 flex items-center">
                  <Target className="w-3 h-3 mr-1" />
                  Monthly projection
                </p>
              </div>
              <Award className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm font-medium">Active Locations</p>
                <p className="text-3xl font-bold text-white mt-1">{new Set(analyses.map(a => a.location)).size}</p>
                <p className="text-yellow-400 text-xs mt-1 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {dashboardStats?.topLocation}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Analysis Types</p>
                <p className="text-3xl font-bold text-white mt-1">{analysisTypeData.length}</p>
                <p className="text-purple-400 text-xs mt-1 flex items-center">
                  <Layers className="w-3 h-3 mr-1" />
                  Business focus
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
          {/* Activity Trend Chart */}
          <div className="lg:col-span-2 xl:col-span-2 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Activity Trends</h3>
              <div className="flex space-x-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-400">Analyses</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-400">Revenue</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="analyses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="analyses"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#analyses)"
                  />
                  <Bar dataKey="revenue" fill="#10b981" opacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analysis Type Distribution */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Analysis Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={analysisTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {analysisTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {analysisTypeData.map((type, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: type.color }}></div>
                    <span className="text-gray-300 text-sm capitalize">
                      {type.type.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-gray-400 text-sm">{type.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Regression Analysis */}
          <div className="lg:col-span-2 xl:col-span-2 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Revenue Analysis</h3>
              <div className="flex items-center">
                <Zap className="w-4 h-4 text-yellow-400 mr-2" />
                <span className="text-xs text-gray-400">Predicted vs Actual</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="predicted" fill="#3b82f6" name="Predicted" />
                  <Bar dataKey="actual" fill="#10b981" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 space-y-4">
            <h3 className="text-xl font-semibold text-white mb-6">Quick Overview</h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-400" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">Last Analysis</p>
                  <p className="text-xs text-gray-400">
                    {analyses.length > 0 ?
                      format(new Date(analyses[0].created_at), 'MMM dd, yyyy') :
                      'No analyses yet'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Target className="h-4 w-4 text-green-400" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">Success Rate</p>
                  <p className="text-xs text-gray-400">
                    {analyses.length > 0 ? '100%' : '0%'} completion rate
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Award className="h-4 w-4 text-yellow-400" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">Member Status</p>
                  <p className="text-xs text-gray-400">Active since {format(new Date(user.created_at), 'MMM yyyy')}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-700 pt-4 space-y-3">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Activity className="w-4 h-4 mr-2" />
                Start New Analysis
              </button>
              <button
                onClick={() => window.location.href = '/financial'}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Financial Advisor
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Recent Analyses</h3>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              View All History
            </button>
          </div>

          {analyses.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No analyses yet</p>
              <p className="text-gray-500 text-sm">Start your first business analysis to see insights here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium truncate">{analysis.name}</p>
                      <span className="text-xs text-gray-400">
                        {format(new Date(analysis.created_at), 'MMM dd')}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm truncate">{analysis.location}</p>
                    <div className="flex items-center mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        {analysis.analysis_type}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
              ))}

              {analyses.length > 5 && (
                <div className="text-center pt-4">
                  <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                    Load more analyses...
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
