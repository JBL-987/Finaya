import React, { useState, useEffect } from 'react';
import { AlertCircle, PieChart, TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { advisorAPI } from '../../services/api';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency as formatCurrencyService } from '../../services/currencies';
import { useCurrency } from '../../contexts/CurrencyContext';

const TaxStrategy = ({ transactions }) => {
  const [taxLiabilities, setTaxLiabilities] = useState([{
    type: 'No tax data',
    amount: 0,
    percentage: 0
  }]);
  const [deductions, setDeductions] = useState([{
    category: 'No deductions',
    amount: 0,
    limit: 0
  }]);
  const [taxSavings, setTaxSavings] = useState(0);
  const [estimatedTax, setEstimatedTax] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // Start with false for faster loading
  const [error, setError] = useState(null);
  const [taxParams, setTaxParams] = useState({
    income_amount: 0,
    expense_breakdown: {},
    filing_status: 'single'
  });
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [aiTaxStrategy, setAiTaxStrategy] = useState(null);
  const [monteCarloResults, setMonteCarloResults] = useState(null);
  const [generatingMonteCarlo, setGeneratingMonteCarlo] = useState(false);
  const { selectedCurrency } = useCurrency();

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      // Only show loading during AI generation, not initial render
      analyzeTaxStrategy(transactions);
      // Automatically generate AI tax strategy when transactions are available
      generateAITaxStrategy();
    }
  }, [transactions]);

  // Auto-run Monte Carlo when AI tax strategy is generated
  useEffect(() => {
    if (aiTaxStrategy && taxParams.income_amount > 0 && !monteCarloResults) {
      generateMonteCarlo();
    }
  }, [aiTaxStrategy, taxParams.income_amount]);

  const setEmptyState = () => {
    setTaxLiabilities([]);
    setDeductions([]);
    setTaxSavings(0);
    setEstimatedTax(0);
  };

  const analyzeTaxStrategy = (transactions) => {
    try {
      console.log('Analyzing basic tax strategy from transactions...');

      // Calculate basic tax metrics from transactions
      const totalIncome = transactions
        .filter(t => t.transactionType === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const totalExpenses = transactions
        .filter(t => t.transactionType === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      // Determine filing status based on income patterns (simplified)
      const defaultFilingStatus = totalIncome > 100000 ? 'married_filing_jointly' : 'single';

      // Categorize expenses for tax purposes
      const businessExpenses = transactions
        .filter(t => t.category?.toLowerCase().includes('business') || t.category?.toLowerCase().includes('office'))
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const medicalExpenses = transactions
        .filter(t => t.category?.toLowerCase().includes('medical') || t.category?.toLowerCase().includes('health'))
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const charitableExpenses = transactions
        .filter(t => t.category?.toLowerCase().includes('charitable') || t.category?.toLowerCase().includes('donation'))
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const expenseBreakdown = {
        business: businessExpenses || totalExpenses * 0.3,
        personal: totalExpenses * 0.5,
        medical: medicalExpenses || totalExpenses * 0.08,
        charitable: charitableExpenses || totalExpenses * 0.05
      };

      setTaxParams({
        income_amount: Math.max(totalIncome, 0),
        expense_breakdown: expenseBreakdown,
        filing_status: defaultFilingStatus
      });

      // Set up basic tax calculations
      fallbackTaxStrategy(transactions);
    } catch (error) {
      console.error('Error in basic tax analysis:', error);
      fallbackTaxStrategy(transactions);
    }
  };

  const generateAITaxStrategy = async () => {
    try {
      setGeneratingStrategy(true);

      const requestData = {
        income_amount: taxParams.income_amount,
        expense_breakdown: taxParams.expense_breakdown,
        filing_status: taxParams.filing_status
      };

      console.log('Generating AI tax strategy with params:', requestData);

      const response = await advisorAPI.getTaxStrategy(requestData);

      if (response.success && response.strategy) {
        console.log('AI Tax strategy received:', response.strategy);

        const strategy = response.strategy;

        // Parse and set AI-generated tax strategy
        setAiTaxStrategy(strategy);

        // Update deductions from AI strategy
        if (strategy.deductions && Array.isArray(strategy.deductions)) {
          setDeductions(strategy.deductions.map(ded => ({
            category: ded.category || ded.name || 'Unknown',
            amount: ded.amount || 0,
            limit: ded.limit || ded.amount || 0
          })));
        }

        // Add credits as deductions
        if (strategy.credits && Array.isArray(strategy.credits)) {
          const creditsAsDeductions = strategy.credits.map(credit => ({
            category: `Credit: ${credit.name || 'Unknown'}`,
            amount: credit.amount || 0,
            limit: credit.amount || 0
          }));
          setDeductions(prev => [...prev, ...creditsAsDeductions]);
        }

        // Calculate potential tax savings
        const potentialSavings = strategy.estimated_savings || strategy.total_savings || 0;
        setTaxSavings(potentialSavings);

      } else {
        console.error('Invalid AI tax strategy response:', response);
        setError('Failed to generate AI tax strategy');
      }
    } catch (error) {
      console.error('Error generating AI tax strategy:', error);
      setError('Failed to analyze tax strategy: ' + error.message);
    } finally {
      setGeneratingStrategy(false);
    }
  };

  const fallbackTaxStrategy = (transactions) => {
    const totalIncome = transactions
      .filter(t => t.transactionType === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const totalExpenses = transactions
      .filter(t => t.transactionType === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const taxableIncome = Math.max(0, totalIncome - totalExpenses);
    const taxRate = 0.25;
    const calculatedTax = taxableIncome * taxRate;
    setEstimatedTax(calculatedTax);

    // Remove mock tax liabilities - only show if AI provides them
    setTaxLiabilities([]);

    // Remove mock deductions - only show if AI provides them
    setDeductions([]);
    setTaxSavings(0);
  };

  const generateMonteCarlo = async () => {
    if (taxParams.income_amount <= 0) {
      setError("No income data available for Monte Carlo simulation");
      return;
    }

    try {
      setGeneratingMonteCarlo(true);

      const requestData = {
        initial_investment: taxParams.income_amount,
        risk_level: 'moderate', // Default for tax strategy
        years: 10,
        simulations: 1000
      };

      const response = await advisorAPI.runMonteCarlo(requestData);

      if (response.success && response.results) {
        setMonteCarloResults(response.results);
        console.log("Monte Carlo simulation completed for tax strategy:", response.results);
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

  const formatCurrency = (amount) => formatCurrencyService(amount, selectedCurrency);

  // Removed heavy skeleton loading - component loads instantly now

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
        <h1 className="text-2xl font-bold text-white">Tax Strategy</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            {isLoading ? (
              <Skeleton className="h-5 w-5" />
            ) : (
              <PieChart className="h-5 w-5 text-blue-500" />
            )}
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <h3 className="text-gray-300 font-medium">Estimated Tax</h3>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-20 mb-2" />
          ) : (
            <p className="text-2xl font-bold text-white">{formatCurrency(estimatedTax)}</p>
          )}
          {isLoading ? (
            <Skeleton className="h-3 w-16" />
          ) : (
            <p className="text-sm text-gray-400 mt-2">Based on 25% rate</p>
          )}
        </div>
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            {isLoading ? (
              <Skeleton className="h-5 w-5" />
            ) : (
              <TrendingUp className="h-5 w-5 text-green-500" />
            )}
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <h3 className="text-gray-300 font-medium">Tax Savings</h3>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-20 mb-2" />
          ) : (
            <p className="text-2xl font-bold text-white">{formatCurrency(taxSavings)}</p>
          )}
          {isLoading ? (
            <Skeleton className="h-3 w-20" />
          ) : (
            <p className="text-sm text-gray-400 mt-2">From deductions</p>
          )}
        </div>
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            {isLoading ? (
              <Skeleton className="h-5 w-5" />
            ) : (
              <BarChart3 className="h-5 w-5 text-purple-500" />
            )}
            {isLoading ? (
              <Skeleton className="h-4 w-28" />
            ) : (
              <h3 className="text-gray-300 font-medium">Total Deductions</h3>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <p className="text-2xl font-bold text-white">
              {formatCurrency(deductions.reduce((sum, d) => sum + Math.min(d.amount, d.limit), 0))}
            </p>
          )}
          {isLoading ? (
            <Skeleton className="h-3 w-24" />
          ) : (
            <p className="text-sm text-gray-400 mt-2">Across categories</p>
          )}
        </div>
      </div>

      {taxLiabilities.length > 0 && (
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
          <h2 className="mb-6 text-xl font-bold text-white">Tax Liabilities by Type</h2>
          <div className="space-y-4">
            {taxLiabilities.map((liability, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-gray-300 font-medium">{liability.type}</h3>
                  <span className="text-gray-400">{formatCurrency(liability.amount)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{ width: `${liability.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 text-right mt-1">{liability.percentage}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {deductions.length > 0 && (
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
          <h2 className="mb-6 text-xl font-bold text-white">Deductions Analysis</h2>
          <div className="space-y-4">
            {deductions.map((deduction, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-gray-300 font-medium">{deduction.category}</h3>
                  <span className="text-gray-400">{formatCurrency(deduction.amount)}</span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-1/2">
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-green-500 h-2.5 rounded-full"
                        style={{ width: `${Math.min((deduction.amount / deduction.limit) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 text-right mt-1">
                      {deduction.limit > 0 ? Math.min((deduction.amount / deduction.limit) * 100, 100).toFixed(0) : 0}%
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    {deduction.amount > deduction.limit ? (
                      <ArrowUpRight className="h-4 w-4 text-red-500 inline mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-green-500 inline mr-1" />
                    )}
                    <span className="text-gray-400">Limit: {formatCurrency(deduction.limit)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI-Powered Tax Strategy */}
      <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold text-white">AI-Powered Tax Optimization</h2>

        {generatingStrategy ? (
          <div className="space-y-6">
            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800/30">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div>
              <Skeleton className="h-5 w-40 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>
        ) : !aiTaxStrategy ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No tax strategy available yet. Upload financial data to generate AI-powered tax recommendations.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* AI Strategy Overview */}
            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800/30">
              <h3 className="text-xl font-bold text-white mb-2">{aiTaxStrategy.title || 'Optimized Tax Strategy'}</h3>
              <p className="text-gray-300">{aiTaxStrategy.summary || aiTaxStrategy.overview}</p>
            </div>

            {/* Key Recommendations */}
            {aiTaxStrategy.recommendations && aiTaxStrategy.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Key Tax Recommendations</h3>
                <div className="space-y-3">
                  {aiTaxStrategy.recommendations.map((rec, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">{rec.title || rec.action}</h4>
                      <p className="text-gray-300 text-sm mb-2">{rec.description || rec.details}</p>
                      {rec.potential_savings && (
                        <p className="text-green-400 text-sm">Potential Savings: {formatCurrency(rec.potential_savings)}</p>
                      )}
                      {rec.timeframe && (
                        <p className="text-blue-400 text-xs mt-1">Timeframe: {rec.timeframe}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tax Efficiency Score */}
            {(aiTaxStrategy.tax_efficiency_score || aiTaxStrategy.effective_tax_rate) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiTaxStrategy.effective_tax_rate && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">Effective Tax Rate</h3>
                    <p className="text-2xl font-bold text-blue-400">{(aiTaxStrategy.effective_tax_rate * 100).toFixed(1)}%</p>
                    <p className="text-gray-400 text-sm">After deductions and credits</p>
                  </div>
                )}

                {aiTaxStrategy.tax_efficiency_score && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">Tax Efficiency Score</h3>
                    <p className="text-2xl font-bold text-green-400">{aiTaxStrategy.tax_efficiency_score}/100</p>
                    <p className="text-gray-400 text-sm">Higher score means better optimization</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setAiTaxStrategy(null)}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Generate New Strategy
            </button>
          </div>
        )}
      </div>

      {/* Monte Carlo Simulation - Only show when income data is available */}
      {taxParams.income_amount > 0 && (
        <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
          <div className="flex items-center mb-6">
            <TrendingUp className="h-6 w-6 text-green-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Tax Strategy Monte Carlo Simulation</h2>
          </div>

          {!monteCarloResults ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-400 mx-auto mb-4"></div>
              <p className="text-gray-300 mb-2">Running Monte Carlo simulation...</p>
              <p className="text-sm text-gray-400">Analyzing tax strategy projections based on your income of {formatCurrency(taxParams.income_amount)}</p>
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
                  <h3 className="text-lg font-bold text-white mb-4">Tax Strategy Simulation Details</h3>
                  <div className="text-gray-300 text-sm space-y-2">
                    <p>• Risk Level: Moderate (Tax Strategy)</p>
                    <p>• Initial Investment: {formatCurrency(taxParams.income_amount)}</p>
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

export default TaxStrategy;
