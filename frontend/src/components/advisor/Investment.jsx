import React, { useState, useEffect } from 'react';
import { LineChart, TrendingUp, DollarSign, AlertCircle, ChevronRight, Loader, BarChart3, Percent } from 'lucide-react';
import { advisorAPI } from '../../services/api';
import { Skeleton } from '../ui/Skeleton';

const Investment = ({ transactions }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [investmentParams, setInvestmentParams] = useState({
    risk_level: 'moderate',
    investment_horizon: 10,
    investment_amount: 500
  });
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      // Start with basic analysis, but offer AI-powered personalized recommendations
      analyzeBasicInvestmentData(transactions);
    } else {
      setDefaultRecommendations();
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

    // Update investment params based on financial data
    setInvestmentParams(prev => ({
      ...prev,
      investment_amount: Math.min(availableInvestment * 0.2, 10000) || prev.investment_amount
    }));

    // Set basic recommendations initially
    setDefaultRecommendations();
  };

  // Fungsi untuk set default recommendations
  const setDefaultRecommendations = () => {
    setRecommendations([
      {
        id: 1,
        title: 'Diversify Portfolio',
        description: 'Consider allocating assets across different investment categories to reduce risk.',
        impact: 'High',
        category: 'Diversification',
        benefit: 'Reduced volatility and more stable returns',
        instrumentType: 'etf'
      },
      {
        id: 2,
        title: 'Explore Growth Opportunities',
        description: 'Research emerging markets or sectors with high growth potential.',
        impact: 'Medium',
        category: 'Growth Opportunities',
        benefit: 'Potential for higher returns',
        instrumentType: 'stock'
      }
    ]);
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

  const getDefaultRecommendations = () => [
    {
      id: 1,
      title: 'Diversify Portfolio',
      description: 'Spread investments across different asset classes to reduce risk and improve returns.',
      impact: 'High',
      category: 'Diversification',
      benefit: 'Reduced volatility',
      instrumentType: 'etf'
    },
    {
      id: 2,
      title: 'Long-term Holding Strategy',
      description: 'Focus on long-term investments that benefit from compound growth and market trends.',
      impact: 'Medium',
      category: 'Long-term Strategy',
      benefit: 'Compound growth potential',
      instrumentType: 'index'
    }
  ];

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Investment Analysis</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Investment Parameters and Generation */}
      <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold text-white">Personalized Investment Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Risk Level</label>
            <select
              value={investmentParams.risk_level}
              onChange={(e) => setInvestmentParams(prev => ({ ...prev, risk_level: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Investment Horizon (Years)</label>
            <input
              type="number"
              min="1"
              max="50"
              value={investmentParams.investment_horizon}
              onChange={(e) => setInvestmentParams(prev => ({ ...prev, investment_horizon: parseInt(e.target.value) }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Investment Amount ($)</label>
            <input
              type="number"
              min="100"
              step="100"
              value={investmentParams.investment_amount}
              onChange={(e) => setInvestmentParams(prev => ({ ...prev, investment_amount: parseFloat(e.target.value) }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="text-center">
          <button
            onClick={generatePersonalizedRecommendations}
            disabled={generatingRecommendations}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              generatingRecommendations
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {generatingRecommendations ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Generating AI Recommendations...
              </div>
            ) : (
              'Get AI-Powered Recommendations'
            )}
          </button>
          <p className="text-xs text-gray-400 mt-2">
            Based on your financial data and selected parameters, AI will provide personalized portfolio recommendations
          </p>
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

      <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
        <h2 className="mb-6 text-xl font-bold text-white">
          AI-Generated Investment Recommendations
        </h2>
        {loading ? (
          <div className="flex flex-col justify-center items-center py-10 space-y-2">
            <Loader className="animate-spin text-white h-6 w-6" />
            <div className="text-white text-sm">Analyzing with Qwen AI...</div>
          </div>
        ) : (
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
                    <h3 className="text-md font-medium text-white">{recommendation.title}</h3>
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
                  <h4 className="text-white font-bold mb-2">{selectedRecommendation.title}</h4>
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
          <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
            <p className="text-sm text-blue-300">
              <strong>Pro Tip:</strong> Consider consulting with a financial advisor before making significant changes to your investment portfolio.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
        <h2 className="mb-6 text-xl font-bold text-white">
          Investment Instruments
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <TrendingUp className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-white font-medium">Stocks</h3>
            </div>
            <p className="text-sm text-gray-300">
              Ownership shares in publicly traded companies. Higher risk with potential for higher returns through price appreciation and dividends.
            </p>
            <span className="mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400">
              Growth Potential
            </span>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <DollarSign className="h-5 w-5 text-green-400 mr-2" />
              <h3 className="text-white font-medium">Bonds</h3>
            </div>
            <p className="text-sm text-gray-300">
              Fixed-income debt securities. Lower risk with predictable returns through regular interest payments and principal repayment at maturity.
            </p>
            <span className="mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
              Income Generation
            </span>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <BarChart3 className="h-5 w-5 text-purple-400 mr-2" />
              <h3 className="text-white font-medium">ETFs</h3>
            </div>
            <p className="text-sm text-gray-300">
              Exchange-Traded Funds that track indexes, sectors, or assets. Offers diversification with the flexibility of trading like stocks.
            </p>
            <span className="mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium bg-purple-900/30 text-purple-400">
              Diversification
            </span>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Percent className="h-5 w-5 text-yellow-400 mr-2" />
              <h3 className="text-white font-medium">Cryptocurrencies</h3>
            </div>
            <p className="text-sm text-gray-300">
              Digital or virtual currencies using cryptography for security. High volatility with potential for significant returns.
            </p>
            <span className="mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400">
              High Risk/Reward
            </span>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <LineChart className="h-5 w-5 text-red-400 mr-2" />
              <h3 className="text-white font-medium">Real Estate</h3>
            </div>
            <p className="text-sm text-gray-300">
              Physical property or REITs (Real Estate Investment Trusts). Provides passive income through rent and potential capital appreciation.
            </p>
            <span className="mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-400">
              Tangible Asset
            </span>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <LineChart className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-white font-medium">Mutual Funds</h3>
            </div>
            <p className="text-sm text-gray-300">
              Professionally managed investment funds pooled from multiple investors. Offers diversification and professional management.
            </p>
            <span className="mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400">
              Professional Management
            </span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
          <p className="text-sm text-blue-300">
            <strong>Investment Tip:</strong> A well-diversified portfolio typically includes a mix of these instruments based on your risk tolerance, time horizon, and financial goals.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Investment;
