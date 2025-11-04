import React, { useState, useEffect } from 'react';
import { LineChart, TrendingUp, DollarSign, AlertCircle, ChevronRight, Loader, BarChart3, Percent, Activity, Target, PieChart, BarChart, ScatterChart } from 'lucide-react';
import { advisorAPI } from '../../services/api';
import { Skeleton } from '../ui/Skeleton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  ScatterController,
} from 'chart.js';
import { Pie, Bar, Line, Scatter } from 'react-chartjs-2';
import { formatCurrency as formatCurrencyService } from '../../services/currencies';
import { useCurrency } from '../../contexts/CurrencyContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  ScatterController
);

const Investment = ({ transactions }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [investmentParams, setInvestmentParams] = useState({
    risk_level: 'moderate',
    investment_horizon: 10,
    investment_amount: 500,
    currency: 'USD'
  });
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [monteCarloResults, setMonteCarloResults] = useState(null);
  const [runningSimulation, setRunningSimulation] = useState(false);
  const { selectedCurrency } = useCurrency();

  // Set loading to false after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      // Start with basic analysis and automatically generate AI-powered personalized recommendations
      analyzeBasicInvestmentData(transactions);
      generatePersonalizedRecommendations();
      // Monte Carlo will run automatically when recommendations are generated
    }
  }, [transactions]);

  const analyzeBasicInvestmentData = (transactions) => {
    // Calculate basic investment metrics from transactions
    const totalIncome = transactions
      .filter(t => t.transactionType === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const totalExpenses = transactions
      .filter(t => t.transactionType === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const availableInvestment = Math.max(0, totalIncome - totalExpenses);
    const monthlyIncome = totalIncome / 12;
    const monthlyExpenses = totalExpenses / 12;
    const disposableIncome = Math.max(0, monthlyIncome - monthlyExpenses);

    // Determine risk tolerance based on savings rate
    const savingsRate = monthlyIncome > 0 ? (disposableIncome / monthlyIncome) * 100 : 0;
    let riskTolerance = 'moderate';
    if (savingsRate > 30) riskTolerance = 'aggressive';
    else if (savingsRate < 10) riskTolerance = 'conservative';

    // Update investment params based on financial data
    setInvestmentParams(prev => ({
      ...prev,
      risk_level: riskTolerance,
      investment_amount: Math.min(disposableIncome * 0.2, 10000) || prev.investment_amount
    }));

    // Set basic recommendations initially
    setDefaultRecommendations();
  };

  // Fungsi untuk set default recommendations - removed mock data
  const setDefaultRecommendations = () => {
    setRecommendations([]);
  };

  const generatePersonalizedRecommendations = async () => {
    try {
      setGeneratingRecommendations(true);

      const response = await advisorAPI.getInvestmentRecommendations(investmentParams);

      if (response.success && response.recommendations) {
        console.log('Personalized recommendations received:', response.recommendations);

        // Transform AI recommendations to display format
        const transformedRecs = transformAIRecommendations(response.recommendations);
        setRecommendations(transformedRecs);
      } else {
        console.error('Invalid personalized recommendations response:', response);
        setDefaultRecommendations();
      }
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      setDefaultRecommendations();
    } finally {
      setGeneratingRecommendations(false);
    }
  };

  const transformAIRecommendations = (aiResponse) => {
    console.log('Transforming AI response:', aiResponse);

    if (typeof aiResponse === 'string') {
      // If AI returns text, try to parse recommendations from it
      return parseRecommendationsFromText(aiResponse);
    }

    if (Array.isArray(aiResponse)) {
      return aiResponse.map((rec, index) => ({
        id: rec.id || index + 1,
        title: rec.title || rec.name || `Recommendation ${index + 1}`,
        description: rec.description || rec.explanation || rec.strategy || '',
        impact: rec.impact || rec.priority || 'Medium',
        category: rec.category || rec.type || 'Portfolio',
        benefit: rec.benefit || rec.expected_return || 'Risk-adjusted returns',
        instrumentType: rec.instrument_type || rec.asset_class || 'diversified',
        portfolio_allocation: rec.allocation,
        risk_assessment: rec.risk_assessment
      }));
    }

    // Handle object response format from backend
    if (typeof aiResponse === 'object' && aiResponse !== null) {
      const recommendations = [];

      // Extract from asset_allocation
      if (aiResponse.asset_allocation && Array.isArray(aiResponse.asset_allocation)) {
        aiResponse.asset_allocation.forEach((item, index) => {
          recommendations.push({
            id: recommendations.length + 1,
            title: item.asset || `Asset Allocation ${index + 1}`,
            description: item.rationale || 'Strategic asset allocation recommendation',
            impact: 'High',
            category: 'Asset Allocation',
            benefit: `${item.percentage}% allocation`,
            instrumentType: item.asset?.toLowerCase().includes('stock') ? 'stock' :
                           item.asset?.toLowerCase().includes('bond') ? 'bond' : 'diversified',
            portfolio_allocation: item.percentage,
            risk_assessment: item.rationale
          });
        });
      }

      // Extract from specific_recommendations
      if (aiResponse.specific_recommendations && Array.isArray(aiResponse.specific_recommendations)) {
        aiResponse.specific_recommendations.forEach((item, index) => {
          recommendations.push({
            id: recommendations.length + 1,
            title: item.type || `Investment Type ${index + 1}`,
            description: item.rationale || 'Specific investment recommendation',
            impact: 'Medium',
            category: 'Investment Type',
            benefit: 'Targeted investment strategy',
            instrumentType: item.type?.toLowerCase().includes('etf') ? 'etf' :
                           item.type?.toLowerCase().includes('fund') ? 'mutual_fund' : 'diversified',
            portfolio_allocation: null,
            risk_assessment: item.rationale
          });
        });
      }

      // Extract from action_steps
      if (aiResponse.action_steps && Array.isArray(aiResponse.action_steps)) {
        aiResponse.action_steps.forEach((step, index) => {
          recommendations.push({
            id: recommendations.length + 1,
            title: `Action Step ${index + 1}`,
            description: step,
            impact: 'High',
            category: 'Action Plan',
            benefit: 'Implementation guidance',
            instrumentType: 'diversified',
            portfolio_allocation: null,
            risk_assessment: 'Essential next steps'
          });
        });
      }

      // If no recommendations extracted, create default ones
      if (recommendations.length === 0) {
        recommendations.push({
          id: 1,
          title: 'Diversify Portfolio',
          description: 'Spread investments across different asset classes to reduce risk',
          impact: 'High',
          category: 'Risk Management',
          benefit: 'Reduced portfolio volatility',
          instrumentType: 'diversified',
          portfolio_allocation: null,
          risk_assessment: 'Essential for risk management'
        });
      }

      console.log('Transformed recommendations:', recommendations);
      return recommendations;
    }

    return parseRecommendationsFromText(aiResponse.toString());
  };

  const parseRecommendationsFromText = (text) => {
    // Simple parsing for text-based AI responses
    const lines = text.split('\n').filter(line => line.trim());
    const recommendations = [];

    lines.forEach((line, index) => {
      if (line.length > 20 && !line.toLowerCase().includes('here are') && !line.toLowerCase().includes('based on')) {
        recommendations.push({
          id: index + 1,
          title: line.split(':')[0].trim() || `Recommendation ${index + 1}`,
          description: line.split(':').slice(1).join(':').trim() || line,
          impact: line.toLowerCase().includes('high') ? 'High' : line.toLowerCase().includes('low') ? 'Low' : 'Medium',
          category: 'AI Generated',
          benefit: 'Personalized strategy',
          instrumentType: 'diversified'
        });
      }
    });

    return recommendations.length > 0 ? recommendations : getDefaultRecommendations();
  };

  const getDefaultRecommendations = () => [];

  // Monte Carlo Simulation - Backend API call
  const runMonteCarloSimulation = async () => {
    if (!transactions || transactions.length === 0) return;

    try {
      setRunningSimulation(true);

      // Calculate initial investment amount from transactions
      const totalIncome = transactions
        .filter(t => t.transactionType === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const totalExpenses = transactions
        .filter(t => t.transactionType === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const initialInvestment = Math.max(0, totalIncome - totalExpenses);

      // Call backend Monte Carlo API
      const response = await advisorAPI.runMonteCarlo({
        initial_investment: initialInvestment,
        risk_level: investmentParams.risk_level,
        years: investmentParams.investment_horizon,
        simulations: 1000
      });

      if (response.success && response.results) {
        setMonteCarloResults(response.results);
      } else {
        console.error('Failed to run Monte Carlo simulation:', response);
      }

    } catch (error) {
      console.error('Error running Monte Carlo simulation:', error);
    } finally {
      setRunningSimulation(false);
    }
  };

  // Auto-run Monte Carlo when recommendations are generated
  useEffect(() => {
    console.log('Monte Carlo effect triggered:', { recommendationsLength: recommendations.length, hasMonteCarloResults: !!monteCarloResults });
    if (recommendations.length > 0 && !monteCarloResults && !runningSimulation) {
      console.log('Running Monte Carlo simulation...');
      runMonteCarloSimulation();
    }
  }, [recommendations]);

  const getInstrumentIcon = (instrumentType) => {
    switch (instrumentType) {
      case 'stock':
        return <TrendingUp className="h-4 w-4 text-blue-400" />;
      case 'bond':
        return <DollarSign className="h-4 w-4 text-green-400" />;
      case 'etf':
        return <BarChart3 className="h-4 w-4 text-purple-400" />;
      case 'crypto':
        return <Percent className="h-4 w-4 text-yellow-400" />;
      default:
        return <LineChart className="h-4 w-4 text-blue-400" />;
    }
  };

  const formatCurrency = (amount) => formatCurrencyService(amount, selectedCurrency);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48 bg-gray-700" />
          <Skeleton className="h-4 w-32 bg-gray-700" />
        </div>

        {/* Investment Parameters Skeleton */}
        <div className="rounded-xl bg-gray-900 border border-gray-700 p-6">
          <Skeleton className="h-6 w-64 mb-6 bg-gray-700" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2 bg-gray-700" />
              <Skeleton className="h-10 w-full bg-gray-700" />
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-2 bg-gray-700" />
              <Skeleton className="h-10 w-full bg-gray-700" />
            </div>
            <div>
              <Skeleton className="h-4 w-28 mb-2 bg-gray-700" />
              <Skeleton className="h-10 w-full bg-gray-700" />
            </div>
          </div>
          <div className="text-center">
            <Skeleton className="h-12 w-48 mx-auto bg-gray-700" />
          </div>
        </div>

        {/* Statistics Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-24 bg-gray-700" />
                <Skeleton className="h-5 w-5 bg-gray-700" />
              </div>
              <Skeleton className="h-8 w-12 bg-gray-700" />
              <Skeleton className="h-3 w-32 mt-2 bg-gray-700" />
            </div>
          ))}
        </div>

        {/* Recommendations Skeleton */}
        <div className="rounded-xl bg-gray-900 border border-gray-700 p-6">
          <Skeleton className="h-6 w-56 mb-6 bg-gray-700" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start">
                  <Skeleton className="h-8 w-8 rounded-full bg-gray-700" />
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-5 w-48 bg-gray-700" />
                      <Skeleton className="h-6 w-20 bg-gray-700 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full mb-1 bg-gray-700" />
                    <Skeleton className="h-4 w-3/4 bg-gray-700" />
                    <div className="mt-2 flex items-center justify-between">
                      <Skeleton className="h-3 w-16 bg-gray-700" />
                      <Skeleton className="h-3 w-24 bg-gray-700" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Skeleton */}
        <div className="rounded-xl bg-gray-900 border border-gray-700 p-6">
          <Skeleton className="h-6 w-40 mb-6 bg-gray-700" />
          <div className="bg-gray-800 rounded-lg p-4">
            <Skeleton className="h-4 w-full mb-2 bg-gray-700" />
            <Skeleton className="h-4 w-5/6 bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Investment Analysis</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-blue-900/30 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">Diversification</h3>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-white">{recommendations.filter(r => r.category === 'Diversification').length}</p>
          <p className="text-sm text-blue-500 mt-2 flex items-center">
            <span>Portfolio balance opportunities</span>
          </p>
        </div>

        <div className="bg-gray-900 border border-blue-900/30 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">Growth Potential</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-white">{recommendations.filter(r => r.category === 'Growth Opportunities').length}</p>
          <p className="text-sm text-green-500 mt-2 flex items-center">
            <span>High return investment options</span>
          </p>
        </div>

        <div className="bg-gray-900 border border-blue-900/30 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">High Priority</h3>
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-white">{recommendations.filter(r => r.impact === 'High').length}</p>
          <p className="text-sm text-yellow-500 mt-2 flex items-center">
            <span>Require immediate attention</span>
          </p>
        </div>
      </div>

      {/* Combined AI Recommendations and Monte Carlo Simulation */}
      <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
        <div className="flex items-center mb-6">
          <Activity className="h-6 w-6 text-purple-400 mr-3" />
          <h2 className="text-xl font-bold text-white">AI Investment Analysis & Monte Carlo Simulation</h2>
        </div>

        {/* AI Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 text-blue-400 mr-2" />
              AI-Generated Investment Recommendations
            </h3>
            <div className="space-y-4">
              {recommendations.map((recommendation) => (
                <div key={recommendation.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-800/80 transition-colors">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-900/30">
                        {getInstrumentIcon(recommendation.instrumentType)}
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-md font-medium text-white">{recommendation.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          recommendation.impact === 'High'
                            ? 'bg-yellow-900/30 text-yellow-400'
                            : recommendation.impact === 'Medium'
                            ? 'bg-blue-900/30 text-blue-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {recommendation.impact} Impact
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-300">{recommendation.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-400">{recommendation.category}</span>
                        <span className="text-xs font-medium text-green-400">{recommendation.benefit}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 ml-12">
                    <button
                      className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      onClick={() => setSelectedRecommendation(recommendation)}
                    >
                      <span>View details</span>
                      <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>
                  {selectedRecommendation?.id === recommendation.id && (
                    <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-800/30">
                      <h5 className="text-white font-bold mb-2">{selectedRecommendation.title}</h5>
                      <p className="text-gray-300">{selectedRecommendation.description}</p>
                      <p className="text-sm text-blue-300 mt-2">
                        <strong>Impact:</strong> {selectedRecommendation.impact} <br />
                        <strong>Category:</strong> {selectedRecommendation.category} <br />
                        <strong>Benefit:</strong> {selectedRecommendation.benefit} <br />
                        <strong>Instrument Type:</strong> {selectedRecommendation.instrumentType}
                      </p>
                      <button
                        className="mt-2 text-xs text-red-400 hover:underline"
                        onClick={() => setSelectedRecommendation(null)}
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monte Carlo Simulation Results */}
        {monteCarloResults && (
          <div className="border-t border-gray-700 pt-8">
            <div className="flex items-center mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Activity className="h-5 w-5 text-purple-400 mr-2" />
                Monte Carlo Simulation Results
              </h3>
            </div>

            {!runningSimulation ? (
              <div className="space-y-6">
                {/* Simulation Overview */}
                <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-800/30">
                  <h4 className="text-md font-bold text-white mb-3">Portfolio Projection Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(monteCarloResults?.median || 0)}</p>
                      <p className="text-sm text-gray-300">Median Projection</p>
                      <p className="text-xs text-gray-400">({monteCarloResults?.years || 10} years)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">{(monteCarloResults?.probabilityPositive || 0).toFixed(1)}%</p>
                      <p className="text-sm text-gray-300">Probability of Profit</p>
                      <p className="text-xs text-gray-400">Based on {monteCarloResults?.simulations || 1000} simulations</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">{(monteCarloResults?.avgReturn || 0).toFixed(1)}%</p>
                      <p className="text-sm text-gray-300">Expected Return</p>
                      <p className="text-xs text-gray-400">Annual average</p>
                    </div>
                  </div>
                </div>

                {/* Risk Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-3 flex items-center">
                      <Target className="h-4 w-4 text-green-400 mr-2" />
                      Best Case Scenario
                    </h5>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(monteCarloResults?.bestCase || 0)}</p>
                    <p className="text-sm text-gray-400">90th percentile outcome</p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-3 flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                      Risk Assessment
                    </h5>
                    <p className="text-2xl font-bold text-red-400">{formatCurrency(monteCarloResults?.percentile10 || 0)}</p>
                    <p className="text-sm text-gray-400">10th percentile (worst 10%)</p>
                  </div>
                </div>

                {/* Probability Distribution Visualization */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-4">Probability Distribution Chart</h5>
                  <div className="space-y-2">
                    {Object.entries(monteCarloResults.distribution)
                      .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
                      .slice(-10) // Show top 10 buckets
                      .map(([value, count]) => {
                        const percentage = (count / monteCarloResults.simulations) * 100;
                        return (
                          <div key={value} className="flex items-center space-x-3">
                            <div className="w-20 text-xs text-gray-400 text-right">
                              {formatCurrency(parseFloat(value))}
                            </div>
                            <div className="flex-1 bg-gray-700 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(percentage * 5, 100)}%` }}
                              ></div>
                            </div>
                            <div className="w-12 text-xs text-gray-400 text-right">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Distribution shows potential portfolio values after {monteCarloResults?.years || 10} years
                  </p>
                </div>

                {/* Risk Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <h6 className="text-gray-400 text-sm mb-1">Volatility</h6>
                    <p className="text-xl font-bold text-orange-400">{(monteCarloResults?.volatility || 0).toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">Annual standard deviation</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <h6 className="text-gray-400 text-sm mb-1">Sharpe Ratio</h6>
                    <p className="text-xl font-bold text-cyan-400">
                      {((monteCarloResults?.avgReturn || 0) / 100 / ((monteCarloResults?.volatility || 1) / 100)).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">Risk-adjusted return</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <h6 className="text-gray-400 text-sm mb-1">Max Drawdown</h6>
                    <p className="text-xl font-bold text-red-400">
                      {((1 - (monteCarloResults?.percentile10 || 0) / (monteCarloResults?.initialInvestment || 1)) * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Worst case loss</p>
                  </div>
                </div>

                <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800/30">
                  <h5 className="text-white font-medium mb-2">Monte Carlo Analysis Summary</h5>
                  <p className="text-gray-300 text-sm">
                    This simulation ran {(monteCarloResults?.simulations || 1000).toLocaleString()} different market scenarios
                    based on your {investmentParams.risk_level} risk profile over {monteCarloResults?.years || 10} years.
                    The results show the range of possible outcomes, helping you understand both the potential rewards
                    and risks of your investment strategy.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Running Monte Carlo simulation...</p>
                <p className="text-sm text-gray-400 mt-2">Analyzing 1,000+ market scenarios</p>
              </div>
            )}
          </div>
        )}

        {/* Investment Charts Section */}
        {recommendations.length > 0 && (
          <div className="border-t border-gray-700 pt-8">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              <BarChart className="h-5 w-5 text-green-400 mr-2" />
              Investment Portfolio Charts & Analytics
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Allocation Pie Chart */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4 flex items-center">
                  <PieChart className="h-4 w-4 text-blue-400 mr-2" />
                  Portfolio Allocation
                </h4>
                <div className="h-64">
                  <Pie
                    data={{
                      labels: recommendations
                        .filter(r => r.portfolio_allocation)
                        .map(r => r.title)
                        .slice(0, 5), // Show top 5 allocations
                      datasets: [{
                        data: recommendations
                          .filter(r => r.portfolio_allocation)
                          .map(r => r.portfolio_allocation)
                          .slice(0, 5),
                        backgroundColor: [
                          'rgba(59, 130, 246, 0.8)', // blue
                          'rgba(16, 185, 129, 0.8)', // green
                          'rgba(245, 158, 11, 0.8)', // yellow
                          'rgba(139, 92, 246, 0.8)', // purple
                          'rgba(239, 68, 68, 0.8)',   // red
                        ],
                        borderColor: [
                          'rgba(59, 130, 246, 1)',
                          'rgba(16, 185, 129, 1)',
                          'rgba(245, 158, 11, 1)',
                          'rgba(139, 92, 246, 1)',
                          'rgba(239, 68, 68, 1)',
                        ],
                        borderWidth: 2,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            color: 'rgba(156, 163, 175, 1)',
                            font: {
                              size: 12,
                            },
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `${context.label}: ${context.parsed}%`;
                            }
                          }
                        }
                      },
                      elements: {
                        point: {
                          radius: 0, // Remove points from pie chart
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Monte Carlo Distribution Bar Chart */}
              {monteCarloResults && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-4 flex items-center">
                    <BarChart className="h-4 w-4 text-purple-400 mr-2" />
                    Monte Carlo Distribution
                  </h4>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: Object.entries(monteCarloResults.distribution)
                          .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
                          .slice(-8) // Show last 8 buckets
                          .map(([value]) => formatCurrency(parseFloat(value))),
                        datasets: [{
                          label: 'Probability',
                          data: Object.entries(monteCarloResults.distribution)
                            .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
                            .slice(-8)
                            .map(([, count]) => (count / monteCarloResults.simulations) * 100),
                          backgroundColor: 'rgba(139, 92, 246, 0.6)',
                          borderColor: 'rgba(139, 92, 246, 1)',
                          borderWidth: 1,
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              color: 'rgba(156, 163, 175, 1)',
                              callback: function(value) {
                                return value + '%';
                              }
                            },
                            grid: {
                              color: 'rgba(75, 85, 99, 0.3)',
                            },
                          },
                          x: {
                            ticks: {
                              color: 'rgba(156, 163, 175, 1)',
                              maxRotation: 45,
                              minRotation: 45,
                            },
                            grid: {
                              color: 'rgba(75, 85, 99, 0.3)',
                            },
                          },
                        },
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return `Probability: ${context.parsed.y.toFixed(1)}%`;
                              }
                            }
                          }
                        },
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Investment Growth Projection Line Chart */}
              {monteCarloResults && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-4 flex items-center">
                    <LineChart className="h-4 w-4 text-green-400 mr-2" />
                    Growth Projection Over Time
                  </h4>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: Array.from({length: monteCarloResults.years + 1}, (_, i) => `Year ${i}`),
                        datasets: [
                          {
                            label: 'Median Growth',
                            data: Array.from({length: monteCarloResults.years + 1}, (_, i) => {
                              // Simple compound growth calculation for visualization
                              const growthRate = monteCarloResults.avgReturn / 100;
                              return monteCarloResults.initialInvestment * Math.pow(1 + growthRate, i);
                            }),
                            borderColor: 'rgba(16, 185, 129, 1)',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            fill: true,
                          },
                          {
                            label: 'Conservative (10th percentile)',
                            data: Array.from({length: monteCarloResults.years + 1}, (_, i) => {
                              const conservativeRate = (monteCarloResults.avgReturn - monteCarloResults.volatility) / 100;
                              return monteCarloResults.initialInvestment * Math.pow(1 + conservativeRate, i);
                            }),
                            borderColor: 'rgba(239, 68, 68, 1)',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                          },
                          {
                            label: 'Optimistic (90th percentile)',
                            data: Array.from({length: monteCarloResults.years + 1}, (_, i) => {
                              const optimisticRate = (monteCarloResults.avgReturn + monteCarloResults.volatility) / 100;
                              return monteCarloResults.initialInvestment * Math.pow(1 + optimisticRate, i);
                            }),
                            borderColor: 'rgba(59, 130, 246, 1)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            ticks: {
                              color: 'rgba(156, 163, 175, 1)',
                              callback: function(value) {
                                return formatCurrency(value);
                              }
                            },
                            grid: {
                              color: 'rgba(75, 85, 99, 0.3)',
                            },
                          },
                          x: {
                            ticks: {
                              color: 'rgba(156, 163, 175, 1)',
                            },
                            grid: {
                              color: 'rgba(75, 85, 99, 0.3)',
                            },
                          },
                        },
                        plugins: {
                          legend: {
                            labels: {
                              color: 'rgba(156, 163, 175, 1)',
                            },
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                              }
                            }
                          }
                        },
                        elements: {
                          point: {
                            radius: 0, // Remove points from line chart for smooth lines
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Risk vs Return Scatter Plot */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4 flex items-center">
                  <ScatterChart className="h-4 w-4 text-orange-400 mr-2" />
                  Risk vs Return Analysis
                </h4>
                <div className="h-64">
                  <Scatter
                    data={{
                      datasets: [
                        {
                          label: 'High Risk/High Return',
                          data: [
                            { x: 12 + Math.random() * 4, y: 10 + Math.random() * 3 },
                            { x: 11 + Math.random() * 4, y: 9 + Math.random() * 3 },
                            { x: 13 + Math.random() * 4, y: 11 + Math.random() * 3 },
                            { x: 10 + Math.random() * 4, y: 8 + Math.random() * 3 },
                          ],
                          backgroundColor: 'rgba(239, 68, 68, 0.7)',
                          pointRadius: 5,
                        },
                        {
                          label: 'Medium Risk/Medium Return',
                          data: [
                            { x: 6 + Math.random() * 3, y: 6 + Math.random() * 2 },
                            { x: 7 + Math.random() * 3, y: 7 + Math.random() * 2 },
                            { x: 5 + Math.random() * 3, y: 5 + Math.random() * 2 },
                            { x: 8 + Math.random() * 3, y: 8 + Math.random() * 2 },
                          ],
                          backgroundColor: 'rgba(245, 158, 11, 0.7)',
                          pointRadius: 5,
                        },
                        {
                          label: 'Low Risk/Low Return',
                          data: [
                            { x: 2 + Math.random() * 2, y: 2 + Math.random() * 1.5 },
                            { x: 3 + Math.random() * 2, y: 3 + Math.random() * 1.5 },
                            { x: 1 + Math.random() * 2, y: 1 + Math.random() * 1.5 },
                            { x: 4 + Math.random() * 2, y: 4 + Math.random() * 1.5 },
                          ],
                          backgroundColor: 'rgba(16, 185, 129, 0.7)',
                          pointRadius: 5,
                        },
                        {
                          label: 'Your Portfolio',
                          data: monteCarloResults ? [{
                            x: monteCarloResults.volatility,
                            y: monteCarloResults.avgReturn
                          }] : [{ x: 6, y: 6 }],
                          backgroundColor: 'rgba(245, 158, 11, 1)',
                          pointRadius: 8,
                          pointStyle: 'star',
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Risk (Volatility %)',
                            color: 'rgba(156, 163, 175, 1)',
                          },
                          ticks: {
                            color: 'rgba(156, 163, 175, 1)',
                            callback: function(value) {
                              return value + '%';
                            }
                          },
                          grid: {
                            color: 'rgba(75, 85, 99, 0.3)',
                          },
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Expected Return %',
                            color: 'rgba(156, 163, 175, 1)',
                          },
                          ticks: {
                            color: 'rgba(156, 163, 175, 1)',
                            callback: function(value) {
                              return value + '%';
                            }
                          },
                          grid: {
                            color: 'rgba(75, 85, 99, 0.3)',
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          labels: {
                            color: 'rgba(156, 163, 175, 1)',
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `${context.dataset.label}: Risk ${context.parsed.x}%, Return ${context.parsed.y}%`;
                            }
                          }
                        }
                      },
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Higher risk typically correlates with higher potential returns. Your portfolio position is marked with a star.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Show message if no data yet */}
        {recommendations.length === 0 && !monteCarloResults && !runningSimulation && (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">AI analysis will automatically generate when you have transaction data</p>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
        <h2 className="mb-6 text-xl font-bold text-white">
          Investment Strategy
        </h2>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-300">
            Our AI has analyzed your portfolio data and market conditions to generate these investment recommendations.
            To optimize your investment strategy, we suggest implementing them in the following order:
          </p>
          {loading ? (
            <div className="flex flex-col justify-center items-center py-10 space-y-2">
              <Loader className="animate-spin text-white h-6 w-6" />
              <div className="text-white text-sm">Analyzing with Qwen AI...</div>
            </div>
          ) : (
          <ol className="mt-4 space-y-2 pl-5 list-decimal text-gray-300">
            {recommendations
              .sort((a, b) => {
                if (a.impact === 'High' && b.impact !== 'High') return -1;
                if (a.impact !== 'High' && b.impact === 'High') return 1;
                return 0;
              })
              .map((rec, index) => (
                <li key={rec.id}>{rec.title}</li>
              ))}
          </ol>
          )}
          <div className="mt-4 p-3 bg-yellow-900/20 rounded-lg border border-yellow-800/30">
            <p className="text-sm text-yellow-400">
              <strong>Pro Tip:</strong> Consider consulting with a financial advisor before making significant changes to your investment portfolio.
            </p>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Investment;
