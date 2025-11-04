import React, { useState, useEffect } from 'react';
import { AlertCircle, Target, TrendingUp, Wallet, Brain, Lightbulb, ChevronDown } from 'lucide-react';
import { getTransactionsForDocument } from '../../utils/documentUtils';
import { advisorAPI } from '../../services/api';
import { Skeleton } from '../ui/Skeleton';
import { useCurrency } from '../../contexts/CurrencyContext';

const FinancialPlanning = ({ transactions }) => {
  const { formatCurrency } = useCurrency();
  const [financialGoals, setFinancialGoals] = useState([]);
  const [cashFlow, setCashFlow] = useState({
    income: 0,
    expenses: 0,
    savings: 0,
    savingsRate: 0
  });
  const [netWorth, setNetWorth] = useState(0);
  const [emergencyFund, setEmergencyFund] = useState({
    monthsCovered: 0,
    recommended: 6,
    status: 'low'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiPlan, setAiPlan] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [selectedRiskTolerance, setSelectedRiskTolerance] = useState('moderate');
  const [monteCarloResults, setMonteCarloResults] = useState(null);
  const [generatingMonteCarlo, setGeneratingMonteCarlo] = useState(false);

  useEffect(() => {
    loadFinancialGoals();
  }, []);

  useEffect(() => {
    if (transactions && transactions.length > 0 && financialGoals.length > 0) {
      analyzeFinancialPlan(transactions);
      // Automatically generate AI plan when transactions and goals are available
      generateAIPlan();
    }
  }, [transactions, financialGoals]);

  // Auto-run Monte Carlo when AI plan is generated
  useEffect(() => {
    if (aiPlan && netWorth > 0 && !monteCarloResults) {
      generateMonteCarlo();
    }
  }, [aiPlan, netWorth]);

  const loadFinancialGoals = async () => {
    try {
      setIsLoading(true);
      const goals = await advisorAPI.getGoals();

      // Transform API goals to display format
      const transformedGoals = goals.map(goal => ({
        id: goal.id,
        name: goal.name,
        current: goal.current_amount || 0,
        target: goal.target_amount || 0,
        deadline: goal.deadline,
        progress: goal.target_amount > 0 ?
          Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0,
        status: goal.current_amount >= goal.target_amount ? 'achieved' : 'in-progress'
      }));

      setFinancialGoals(transformedGoals);
    } catch (error) {
      console.error('Failed to load financial goals:', error);
      setError('Failed to load financial goals');
    } finally {
      setIsLoading(false);
    }
  };

  const updateGoalProgress = async (goalId, newCurrentAmount) => {
    try {
      await advisorAPI.updateGoal(goalId, {
        current_amount: newCurrentAmount
      });
      // Reload goals after update
      await loadFinancialGoals();
    } catch (error) {
      console.error('Failed to update goal progress:', error);
    }
  };

  const setEmptyState = () => {
    setCashFlow({
      income: 0,
      expenses: 0,
      savings: 0,
      savingsRate: 0
    });
    setNetWorth(0);
    setEmergencyFund({
      monthsCovered: 0,
      recommended: 6,
      status: 'low'
    });
  };

  const analyzeFinancialPlan = async (transactions) => {
    try {
      console.log("Analyzing financial plan with transactions:", transactions.length);

      // Calculate financial metrics from transactions
      const totalIncome = transactions
        .filter(t => t.transactionType === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const totalExpenses = transactions
        .filter(t => t.transactionType === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      // Calculate assets (income + asset purchases)
      const totalAssets = transactions
        .filter(t => t.transactionType === 'income' || t.category?.toLowerCase().includes('asset'))
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      // Calculate liabilities (loans, debts)
      const totalLiabilities = transactions
        .filter(t => t.category?.toLowerCase().includes('liability') || t.category?.toLowerCase().includes('loan'))
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      // Calculate net worth
      const calculatedNetWorth = totalAssets - totalLiabilities;
      setNetWorth(calculatedNetWorth);

      // Calculate emergency fund (assuming 3-6 months of expenses)
      const monthlyExpenses = totalExpenses / 12;
      const emergencyFundMonths = monthlyExpenses > 0 ? Math.min(totalAssets / monthlyExpenses, 12) : 0;

      setEmergencyFund({
        monthsCovered: emergencyFundMonths,
        recommended: 6,
        status: emergencyFundMonths >= 6 ? 'healthy' : emergencyFundMonths >= 3 ? 'moderate' : 'low'
      });

      // Calculate cash flow
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0;

      setCashFlow({
        income: totalIncome,
        expenses: totalExpenses,
        savings: totalIncome - totalExpenses,
        savingsRate: savingsRate
      });

    } catch (error) {
      console.error("Error in analyzeFinancialPlan:", error);
      setError(`Failed to analyze financial plan: ${error.message}`);
    }
  };

  const generateAIPlan = async () => {
    if (cashFlow.income === 0) {
      setError("No income data available to generate plan");
      return;
    }

    try {
      setGeneratingPlan(true);

      // Calculate yearly income and monthly goals based on transactions
      const yearlyIncome = cashFlow.income;
      const monthlyGoals = {
        emergency_fund: emergencyFund.recommended - emergencyFund.monthsCovered,
        savings: Math.max(0, cashFlow.savings / 12),
        debt_reduction: cashFlow.income > 0 ? Math.min(cashFlow.income * 0.15, cashFlow.expenses * 0.1) : 0
      };

      const requestData = {
        yearly_income: yearlyIncome,
        monthly_goals: monthlyGoals,
        risk_tolerance: selectedRiskTolerance
      };

      const response = await advisorAPI.generateFinancialPlan(requestData);

      if (response.success && response.plan) {
        setAiPlan(response.plan);
        console.log("AI Financial plan generated:", response.plan);
      } else {
        console.error("Failed to generate AI plan:", response);
        setError("Failed to generate financial plan");
      }
    } catch (error) {
      console.error("Error generating AI plan:", error);
      setError("Failed to generate financial plan: " + error.message);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const generateMonteCarlo = async () => {
    if (netWorth <= 0) {
      setError("No investment capital available for Monte Carlo simulation");
      return;
    }

    try {
      setGeneratingMonteCarlo(true);

      const requestData = {
        initial_investment: netWorth,
        risk_level: selectedRiskTolerance,
        years: 10,
        simulations: 1000
      };

      const response = await advisorAPI.runMonteCarlo(requestData);

      if (response.success && response.results) {
        setMonteCarloResults(response.results);
        console.log("Monte Carlo simulation completed:", response.results);
      } else {
        console.error("Failed to run Monte Carlo simulation:", response);
        setError("Failed to run Monte Carlo simulation");
      }
    } catch (error) {
      console.error("Error running Monte Carlo simulation:", error);
      setError("Failed to run Monte Carlo simulation: " + error.message);
    } finally {
      setGeneratingMonteCarlo(false);
    }
  };



  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48 bg-gray-700" />
          <Skeleton className="h-4 w-32 bg-gray-700" />
        </div>

        {/* Net Worth Skeleton */}
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6">
          <Skeleton className="h-6 w-24 mb-6 bg-gray-700" />
          <div className="text-center">
            <Skeleton className="h-12 w-32 mx-auto mb-2 bg-gray-700" />
            <Skeleton className="h-4 w-48 mx-auto bg-gray-700" />
          </div>
        </div>

        {/* Cash Flow Analysis Skeleton */}
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6">
          <Skeleton className="h-6 w-40 mb-6 bg-gray-700" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <Skeleton className="h-4 w-24 mb-2 bg-gray-700" />
                <Skeleton className="h-8 w-20 bg-gray-700" />
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Fund Skeleton */}
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6">
          <Skeleton className="h-6 w-32 mb-6 bg-gray-700" />
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-4 w-28 mb-2 bg-gray-700" />
              <Skeleton className="h-8 w-24 mb-1 bg-gray-700" />
              <Skeleton className="h-3 w-20 bg-gray-700" />
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-28 mb-2 bg-gray-700" />
              <Skeleton className="h-8 w-8 mb-1 bg-gray-700" />
              <Skeleton className="h-3 w-24 bg-gray-700" />
            </div>
          </div>
        </div>

        {/* Financial Goals Skeleton */}
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6">
          <Skeleton className="h-6 w-32 mb-6 bg-gray-700" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <Skeleton className="h-5 w-32 bg-gray-700" />
                  <Skeleton className="h-4 w-20 bg-gray-700" />
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <Skeleton className="h-8 w-24 mb-1 bg-gray-700" />
                    <Skeleton className="h-3 w-28 bg-gray-700" />
                  </div>
                  <div className="w-1/2">
                    <Skeleton className="h-4 w-full mb-1 bg-gray-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Planning Skeleton */}
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6">
          <div className="flex items-center mb-6">
            <Skeleton className="h-6 w-6 mr-3 rounded bg-gray-700" />
            <Skeleton className="h-6 w-48 bg-gray-700" />
          </div>

          <div className="text-center py-8">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4 bg-gray-700" />
            <Skeleton className="h-6 w-64 mx-auto mb-2 bg-gray-700" />
            <Skeleton className="h-4 w-96 mx-auto mb-6 bg-gray-700" />
            <Skeleton className="h-12 w-40 mx-auto bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-400">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Financial Planning</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
        <h2 className="mb-6 text-xl font-bold text-white">Net Worth</h2>
        <div className="text-center">
          <p className="text-4xl font-bold text-white">{formatCurrency(netWorth)}</p>
          <p className="text-gray-400 mt-2">Your total assets minus liabilities</p>
        </div>
      </div>

      <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
        <h2 className="mb-6 text-xl font-bold text-white">Cash Flow Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Monthly Income</h3>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(cashFlow.income / 12)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Monthly Expenses</h3>
            <p className="text-2xl font-bold text-red-500">{formatCurrency(cashFlow.expenses / 12)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Savings Rate</h3>
            <p className="text-2xl font-bold text-blue-500">{cashFlow.savingsRate}%</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
        <h2 className="mb-6 text-xl font-bold text-white">Emergency Fund</h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-400 text-sm font-medium">Current Coverage</h3>
            <p className="text-2xl font-bold text-white">
              {emergencyFund.monthsCovered} months
            </p>
            <p className={`text-sm mt-1 ${
              emergencyFund.status === 'healthy' ? 'text-green-500' :
              emergencyFund.status === 'moderate' ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {emergencyFund.status === 'healthy' ? 'Healthy' :
               emergencyFund.status === 'moderate' ? 'Moderate' : 'Low'} coverage
            </p>
          </div>
          <div className="text-right">
            <h3 className="text-gray-400 text-sm font-medium">Recommended</h3>
            <p className="text-2xl font-bold text-white">{emergencyFund.recommended} months</p>
            <p className="text-sm text-gray-400 mt-1">of living expenses</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
        <h2 className="mb-6 text-xl font-bold text-white">Financial Goals</h2>
        <div className="space-y-4">
          {financialGoals.map((goal, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-300 font-medium">{goal.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  goal.status === 'achieved' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
                }`}>
                  {goal.status === 'achieved' ? 'Achieved' : 'In Progress'}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {goal.name === 'Savings Rate Target' ?
                      `${goal.current.toFixed(1)}%` :
                      goal.name === 'Emergency Fund' ?
                      `${goal.current.toFixed(1)} months` :
                      formatCurrency(goal.current)
                    }
                  </p>
                  <p className="text-xs text-gray-400">
                    Target: {goal.name === 'Savings Rate Target' ?
                      `${goal.target.toFixed(1)}%` :
                      goal.name === 'Emergency Fund' ?
                      `${goal.target.toFixed(1)} months` :
                      formatCurrency(goal.target)
                    }
                  </p>
                </div>
                <div className="w-1/2">
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        goal.progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 text-right mt-1">
                    {Math.min(goal.progress, 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI-Generated Comprehensive Plan - Only show when transactions are available */}
      {transactions && transactions.length > 0 && (
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
          <div className="flex items-center mb-6">
            <Brain className="h-6 w-6 text-blue-400 mr-3" />
            <h2 className="text-xl font-bold text-white">AI-Generated Financial Plan</h2>
          </div>

          {!aiPlan ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-400 mx-auto mb-4"></div>
              <p className="text-gray-300">Generating your personalized financial plan...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Plan Overview */}
              <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800/30">
                <h3 className="text-xl font-bold text-white mb-2">{aiPlan.title || 'Comprehensive Financial Plan'}</h3>
                <p className="text-gray-300">{aiPlan.summary || aiPlan.overview}</p>
              </div>

              {/* Key Recommendations */}
              {aiPlan.key_recommendations && aiPlan.key_recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Key Recommendations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiPlan.key_recommendations.map((rec, index) => (
                      <div key={index} className="bg-gray-800 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-2">{rec.title || `Recommendation ${index + 1}`}</h4>
                        <p className="text-gray-300 text-sm">{rec.description || rec.details}</p>
                        {rec.timeframe && (
                          <p className="text-blue-400 text-xs mt-2">Timeframe: {rec.timeframe}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Long-term Strategy */}
              {aiPlan.long_term_strategy && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Long-term Strategy</h3>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-300">{aiPlan.long_term_strategy}</p>
                  </div>
                </div>
              )}

              {/* Risk Assessment Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aiPlan.risk_assessment && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Risk Assessment</h3>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="mb-3">
                        <span className="text-gray-400 text-sm">Risk Profile: </span>
                        <span className={`font-medium ${
                          selectedRiskTolerance === 'conservative' ? 'text-green-400' :
                          selectedRiskTolerance === 'moderate' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {selectedRiskTolerance.charAt(0).toUpperCase() + selectedRiskTolerance.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-300">{aiPlan.risk_assessment}</p>
                    </div>
                  </div>
                )}

                {/* Projected Outcomes */}
                {aiPlan.projected_outcomes && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Projected Outcomes</h3>
                    <div className="bg-gray-800 rounded-lg p-4">
                      {Array.isArray(aiPlan.projected_outcomes) ? (
                        <ul className="space-y-2 text-gray-300">
                          {aiPlan.projected_outcomes.map((outcome, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-400 mr-2">•</span>
                              <span>{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-300">{aiPlan.projected_outcomes}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setAiPlan(null)}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Generate New Plan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Monte Carlo Simulation - Only show when net worth is available */}
      {netWorth > 0 && (
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
          <div className="flex items-center mb-6">
            <TrendingUp className="h-6 w-6 text-green-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Monte Carlo Simulation</h2>
          </div>

          {!monteCarloResults ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-400 mx-auto mb-4"></div>
              <p className="text-gray-300 mb-2">Running Monte Carlo simulation...</p>
              <p className="text-sm text-gray-400">Analyzing investment projections based on your net worth of {formatCurrency(netWorth)}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Simulation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-gray-400 text-sm font-medium mb-2">Median Projection (10 years)</h3>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(monteCarloResults.median_projection || 0)}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-gray-400 text-sm font-medium mb-2">Success Rate</h3>
                  <p className="text-2xl font-bold text-green-500">
                    {monteCarloResults.success_rate ? `${(monteCarloResults.success_rate * 100).toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-gray-400 text-sm font-medium mb-2">Expected Return</h3>
                  <p className="text-2xl font-bold text-blue-500">
                    {monteCarloResults.expected_return ? `${(monteCarloResults.expected_return * 100).toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Risk Analysis */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-4">Risk Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-gray-400 text-sm font-medium mb-2">Best Case (95th percentile)</h4>
                    <p className="text-xl font-bold text-green-400">
                      {formatCurrency(monteCarloResults.best_case || 0)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-gray-400 text-sm font-medium mb-2">Worst Case (5th percentile)</h4>
                    <p className="text-xl font-bold text-red-400">
                      {formatCurrency(monteCarloResults.worst_case || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Simulation Details */}
              {monteCarloResults.details && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-4">Simulation Details</h3>
                  <div className="text-gray-300 text-sm space-y-2">
                    <p>• Risk Level: {selectedRiskTolerance.charAt(0).toUpperCase() + selectedRiskTolerance.slice(1)}</p>
                    <p>• Initial Investment: {formatCurrency(netWorth)}</p>
                    <p>• Time Horizon: 10 years</p>
                    <p>• Simulations Run: 1,000</p>
                    {monteCarloResults.details.map((detail, index) => (
                      <p key={index}>• {detail}</p>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setMonteCarloResults(null)}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Run New Simulation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialPlanning;
