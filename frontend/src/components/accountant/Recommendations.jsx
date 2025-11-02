import React, { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, DollarSign, AlertCircle, ChevronRight, Loader } from 'lucide-react';
import { accountingAPI } from '../../services/api';

const Recommendations = ({ transactions }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState(null);

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      setLoading(true);
      const fetchRecommendations = async () => {
        try {
          // Get AI-powered recommendations
          const aiResponse = await accountingAPI.getFinancialRecommendations();
          if (aiResponse.success) {
            setAiRecommendations(aiResponse.recommendations);
            console.log('AI Recommendations:', aiResponse.recommendations);
          }

          // Fall back to default recommendations if AI fails
          const recommendationsFromAPI = await getRecommendationsFromAI();

          if (recommendationsFromAPI && Array.isArray(recommendationsFromAPI) && recommendationsFromAPI.length > 0) {
            setRecommendations(recommendationsFromAPI);
          } else {
            setDefaultRecommendations();
          }

          import("../../utils/toastNotification.js").then(({ showToast }) => {
            showToast("AI recommendations generated successfully", "success");
          });
        } catch (error) {
          console.error('Error fetching recommendations:', error);
          setDefaultRecommendations();
        } finally {
          setLoading(false);
        }
      };

      fetchRecommendations();
    } else {
      setDefaultRecommendations();
    }
  }, [transactions]);

  // Fungsi untuk set default recommendations
  const setDefaultRecommendations = () => {
    setRecommendations([
      {
        id: 1,
        title: 'Improve Cash Flow Management',
        description: 'Set up a system to track and forecast cash flow on a weekly basis.',
        impact: 'High',
        category: 'Process Improvement',
        benefit: 'Better financial visibility and planning'
      },
      {
        id: 2,
        title: 'Reduce Operational Expenses',
        description: 'Review and optimize recurring expenses such as subscriptions and utilities.',
        impact: 'Medium',
        category: 'Cost Reduction',
        benefit: 'Potential 10-15% savings on operational costs'
      }
    ]);
  };

  const recommendationsFromAI = async (transactions) => {
    // Use OpenRouter Qwen API through backend instead of direct Gemini call
    try {
      const aiResponse = await accountingAPI.getFinancialRecommendations();
      if (aiResponse.success && aiResponse.recommendations) {
        // Transform backend response to expected format
        const transformedRecommendations = [];

        // Handle different possible response formats from backend
        if (Array.isArray(aiResponse.recommendations)) {
          // If it's already an array of recommendations
          return aiResponse.recommendations.map((rec, index) => ({
            id: rec.id || index + 1,
            title: rec.title || rec.name || `Recommendation ${index + 1}`,
            description: rec.description || rec.details || rec.content || '',
            impact: rec.impact || rec.priority || 'Medium',
            category: rec.category || rec.type || 'General',
            savings: rec.savings || rec.benefit || rec.expected_savings || 'Potential benefits'
          }));
        } else if (typeof aiResponse.recommendations === 'object') {
          // If it's an object with categorized recommendations
          Object.entries(aiResponse.recommendations).forEach(([category, recs], catIndex) => {
            if (Array.isArray(recs)) {
              recs.forEach((rec, index) => {
                transformedRecommendations.push({
                  id: catIndex * 100 + index + 1,
                  title: rec.title || rec.name || `${category} Recommendation ${index + 1}`,
                  description: rec.description || rec.details || rec.content || '',
                  impact: rec.impact || rec.priority || 'Medium',
                  category: category,
                  savings: rec.savings || rec.benefit || rec.expected_savings || 'Potential benefits'
                });
              });
            }
          });
          return transformedRecommendations;
        }

        return [];
      }
      return [];
    } catch (error) {
      console.error("Failed to get AI recommendations:", error);
      return [];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Recommendations</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-blue-900/30 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">Process Improvements</h3>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-white">{recommendations.filter(r => r.category === 'Process Improvement').length}</p>
          <p className="text-sm text-blue-500 mt-2 flex items-center">
            <span>Efficiency opportunities</span>
          </p>
        </div>

        <div className="bg-gray-900 border border-blue-900/30 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">Cost Reduction</h3>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-white">{recommendations.filter(r => r.category === 'Cost Reduction').length}</p>
          <p className="text-sm text-green-500 mt-2 flex items-center">
            <span>Potential savings opportunities</span>
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
          AI-Generated Recommendations
        </h2>
        {loading ? (
          <div className="flex flex-col justify-center items-center py-10 space-y-2">
            <Loader className="animate-spin text-white h-6 w-6" />
            <div className="text-white text-sm">Generating strategic recommendations...</div>
          </div>
        ) : (
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <div key={recommendation.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-800/80 transition-colors">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-900/30">
                    <Lightbulb className="h-4 w-4 text-blue-400" />
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
                    <span className="text-xs font-medium text-green-400">{recommendation.savings}</span>
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
                    <strong>Savings:</strong> {selectedRecommendation.savings}
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
          Implementation Plan
        </h2>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-300">
            Our AI has analyzed your financial data and business operations to generate these recommendations.
            To maximize the benefits, we suggest implementing them in the following order:
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
              <strong>Pro Tip:</strong> Schedule a meeting with your team to review these recommendations and assign responsibilities for implementation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
