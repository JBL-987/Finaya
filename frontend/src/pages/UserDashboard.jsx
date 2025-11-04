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
import { authAPI, analysisAPI, accountingAPI } from '../services/api';
import { Skeleton } from '../components/ui/Skeleton';
import { formatCurrency, CURRENCIES, getCurrencySymbol, getCurrencyName } from '../services/currencies';
import { useCurrency } from '../contexts/CurrencyContext';

const UserDashboard = () => {
  const { selectedCurrency } = useCurrency();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [financialData, setFinancialData] = useState([]);
  const [financialReports, setFinancialReports] = useState(null);



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

        // Fetch financial data from Supabase
        await fetchFinancialData();
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Refresh data when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh financial data when page becomes visible
        fetchFinancialData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also refresh data periodically (every 30 seconds)
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchFinancialData();
      }
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  // Recalculate stats when currency changes or financial data updates
  useEffect(() => {
    if (analyses.length > 0 || financialData.length > 0) {
      generateDashboardStats(analyses);
    }
  }, [selectedCurrency, financialData, analyses]);

  const fetchFinancialData = async () => {
    try {
      // Fetch transactions from accounting API using authenticated service
      const transactionsData = await accountingAPI.getTransactions();
      if (transactionsData.success) {
        setFinancialData(transactionsData.transactions || []);
      }

      // Fetch financial reports using authenticated service
      const reportsData = await accountingAPI.getReport();
      if (reportsData.success) {
        setFinancialReports(reportsData);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      // Set empty arrays to prevent errors in stats calculation
      setFinancialData([]);
      setFinancialReports(null);
    }
  };

  const generateDashboardStats = (analysesData) => {
    // Currency-specific revenue logic
    let avgMonthlyRevenue = 0;
    if (selectedCurrency === 'IDR') {
      avgMonthlyRevenue = 15000; // Fixed value for Rupiah
    } else if (selectedCurrency === 'EUR') {
      avgMonthlyRevenue = 0; // No Euro data yet
    } else {
      // Default logic for other currencies
      avgMonthlyRevenue = analysesData.length > 0 ?
        analysesData.reduce((sum, a) => sum + (a.data?.metrics?.monthly_revenue || 0), 0) / analysesData.length : 0;
    }

    const stats = {
      totalAnalyses: analysesData.length,
      thisWeekAnalyses: analysesData.filter(a =>
        new Date(a.created_at) >= startOfWeek(new Date())
      ).length,
      avgMonthlyRevenue,
      topLocation: analysesData.length > 0 ?
        analysesData.reduce((acc, curr) => {
          const loc = curr.location_name || curr.location;
          acc[loc] = (acc[loc] || 0) + 1;
          return acc;
        }, {}) : {},
      totalTransactions: financialData.length,
      totalIncome: financialData.filter(t => t.transactionType === 'income').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
      totalExpenses: financialData.filter(t => t.transactionType === 'expense').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
      netProfit: 0
    };

    stats.netProfit = stats.totalIncome - stats.totalExpenses;
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
    <div className="min-h-screen bg-gray-900 text-white pt-20">
      {/* Header Section */}
      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400 mt-1">Welcome back, {user?.full_name || 'User'}</p>
            </div>
            {/* Currency controlled by global navbar selector */}
          </div>
        </div>
      </div>



      {/* Key Metrics Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
      <div className="min-h-screen bg-gray-900 text-yellow-400 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-900 text-yellow-400 flex items-center justify-center">
        <div className="text-center">
          <p>No user data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20">
      {/* Header Section */}
      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400 mt-1">Welcome back, {user?.full_name || 'User'}</p>
            </div>
            {/* Currency controlled by global navbar selector */}
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-yellow-400 rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Total Transactions</p>
                <p className="text-2xl font-bold text-white mt-1">{dashboardStats?.totalTransactions || 0}</p>
                <p className="text-white text-xs mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Financial records
                </p>
              </div>
              <BarChart3 className="h-6 w-6 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gray-900 border border-yellow-400 rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Total Income</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(Math.round(dashboardStats?.totalIncome || 0), selectedCurrency)}
                </p>
                <p className="text-white text-xs mt-1 flex items-center">
                  <Target className="w-3 h-3 mr-1" />
                  Revenue streams
                </p>
              </div>
              <Award className="h-6 w-6 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gray-900 border border-yellow-400 rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Net Profit</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(Math.round(dashboardStats?.netProfit || 0), selectedCurrency)}
                </p>
                <p className="text-white text-xs mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {(dashboardStats?.netProfit || 0) >= 0 ? 'Positive' : 'Negative'} performance
                </p>
              </div>
              <Star className="h-6 w-6 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gray-900 border border-yellow-400 rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Business Analyses</p>
                <p className="text-2xl font-bold text-white mt-1">{dashboardStats?.totalAnalyses || 0}</p>
                <p className="text-white text-xs mt-1 flex items-center">
                  <Layers className="w-3 h-3 mr-1" />
                  +{dashboardStats?.thisWeekAnalyses || 0} this week
                </p>
              </div>
              <Activity className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
          {/* Financial Overview Chart */}
          <div className="lg:col-span-2 xl:col-span-2 bg-gray-900 border border-yellow-400 rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Financial Overview</h3>
              <div className="flex space-x-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                  <span className="text-xs text-white">Income</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                  <span className="text-xs text-white">Expenses</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                  <span className="text-xs text-white">Profit</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
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
                    stroke="#fbbf24"
                    fillOpacity={1}
                    fill="url(#income)"
                    name="Income"
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#3b82f6"
                    fillOpacity={0.6}
                    fill="url(#expenses)"
                    name="Expenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-gray-900 border border-yellow-400 rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-semibold text-white mb-4">Financial Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'Income', value: dashboardStats?.totalIncome || 0, color: '#fbbf24' },
                      { name: 'Expenses', value: dashboardStats?.totalExpenses || 0, color: '#3b82f6' },
                      { name: 'Profit', value: Math.max(0, (dashboardStats?.netProfit || 0)), color: '#10b981' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { name: 'Income', value: dashboardStats?.totalIncome || 0, color: '#fbbf24' },
                      { name: 'Expenses', value: dashboardStats?.totalExpenses || 0, color: '#3b82f6' },
                      { name: 'Profit', value: Math.max(0, (dashboardStats?.netProfit || 0)), color: '#10b981' }
                    ].map((entry, index) => (
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
              {[
                { name: 'Income', value: dashboardStats?.totalIncome || 0, color: '#fbbf24' },
                { name: 'Expenses', value: dashboardStats?.totalExpenses || 0, color: '#3b82f6' },
                { name: 'Profit', value: Math.max(0, (dashboardStats?.netProfit || 0)), color: '#10b981' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                    <span className="text-white text-sm">{item.name}</span>
                  </div>
                  <span className="text-white text-sm">{formatCurrency(item.value, selectedCurrency)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Regression Analysis */}
          <div className="lg:col-span-2 xl:col-span-2 bg-gray-900 border border-yellow-400 rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Revenue Analysis</h3>
              <div className="flex items-center">
                <Zap className="w-4 h-4 text-yellow-400 mr-2" />
                <span className="text-xs text-white">Predicted vs Actual</span>
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

          {/* Financial Insights */}
          <div className="bg-gray-900 border border-yellow-400 rounded-lg p-6 shadow-md space-y-4">
            <h3 className="text-xl font-semibold text-white mb-6">Financial Insights</h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-yellow-400" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">Monthly Performance</p>
                  <p className="text-xs text-white">
                    {dashboardStats?.netProfit >= 0 ? '+' : ''}{formatCurrency(dashboardStats?.netProfit || 0, selectedCurrency)} this month
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Target className="h-4 w-4 text-yellow-400" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">Transaction Health</p>
                  <p className="text-xs text-white">
                    {dashboardStats?.totalTransactions || 0} transactions recorded
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
                  <p className="text-sm font-medium text-white">Account Status</p>
                  <p className="text-xs text-white">Active member</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Financial Activity */}
        <div className="bg-gray-900 border border-yellow-400 rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Recent Transactions & Analyses</h3>
            <button className="text-white hover:text-yellow-300 text-sm font-medium transition-colors">
              View All History
            </button>
          </div>

          {financialData.length === 0 && analyses.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <p className="text-white mb-2">No financial data yet</p>
              <p className="text-white text-sm">Start by adding transactions or running business analyses</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Recent Transactions */}
              {financialData.slice(0, 3).map((transaction) => (
                <div key={`transaction-${transaction.id}`} className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-all duration-300">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-yellow-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium truncate">{transaction.description}</p>
                      <span className="text-xs text-white">
                        {formatCurrency(transaction.amount, selectedCurrency)}
                      </span>
                    </div>
                    <p className="text-white text-sm truncate">{transaction.category}</p>
                    <div className="flex items-center mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        transaction.transactionType === 'income'
                          ? 'bg-yellow-500/20 text-white'
                          : 'bg-yellow-500/20 text-white'
                      }`}>
                        {transaction.transactionType}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <ChevronRight className="h-5 w-5 text-yellow-400" />
                  </div>
                </div>
              ))}

              {/* Recent Analyses */}
              {analyses.slice(0, 2).map((analysis) => (
                <div key={`analysis-${analysis.id}`} className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-all duration-300">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-yellow-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium truncate">{analysis.name}</p>
                      <span className="text-xs text-white">
                        {format(new Date(analysis.created_at), 'MMM dd')}
                      </span>
                    </div>
                    <p className="text-white text-sm truncate">{analysis.location}</p>
                    <div className="flex items-center mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-white">
                        {analysis.analysis_type}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <ChevronRight className="h-5 w-5 text-yellow-400" />
                  </div>
                </div>
              ))}

              {(financialData.length > 3 || analyses.length > 2) && (
                <div className="text-center pt-4">
                  <button className="text-white hover:text-yellow-300 text-sm font-medium transition-colors">
                    Load more activity...
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
