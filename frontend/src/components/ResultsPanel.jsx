import { TrendingUp, Users, DollarSign, Calculator, MapPin, Save, X } from 'lucide-react';
import { formatCurrency } from '../services/currencies';

const ResultsPanel = ({
  analysisResults,
  businessParams,
  showResults,
  onClose,
  onSave
}) => {
  if (!showResults || !analysisResults) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-3 sm:p-4 z-30 max-h-64 sm:max-h-80 overflow-y-auto shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold flex items-center text-white">
          <TrendingUp className="h-5 w-5 mr-2 text-yellow-400" />
          Profitability Analysis Results
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={onSave}
            className="rounded-full bg-yellow-600 text-white border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-white hover:text-yellow-600 hover:border-yellow-600 flex items-center justify-center gap-2 px-4 py-2 font-medium shadow-lg hover:shadow-xl text-sm"
            title="Save"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-yellow-900/20 p-3 rounded-lg text-center border border-yellow-600">
          <Users className="h-6 w-6 mx-auto mb-1 text-yellow-400" />
          <div className="text-xl font-bold text-white">{analysisResults.metrics?.tppd !== undefined ? Number(analysisResults.metrics.tppd) : 'N/A'}</div>
          <div className="text-xs text-gray-300">Customers/Day</div>
        </div>

        <div className="bg-yellow-900/20 p-3 rounded-lg text-center border border-yellow-600">
          <DollarSign className="h-6 w-6 mx-auto mb-1 text-yellow-400" />
          <div className="text-xl font-bold text-white">
            {analysisResults.metrics?.dailyRevenue !== undefined ? formatCurrency(Number(analysisResults.metrics.dailyRevenue), businessParams.currency) : 'N/A'}
          </div>
          <div className="text-xs text-gray-300">Daily Revenue</div>
        </div>

        <div className="bg-yellow-900/20 p-3 rounded-lg text-center border border-yellow-600">
          <TrendingUp className="h-6 w-6 mx-auto mb-1 text-yellow-400" />
          <div className="text-xl font-bold text-white">
            {analysisResults.metrics?.monthlyRevenue !== undefined ? formatCurrency(Number(analysisResults.metrics.monthlyRevenue), businessParams.currency) : 'N/A'}
          </div>
          <div className="text-xs text-gray-300">Monthly Revenue</div>
        </div>

        <div className="bg-yellow-900/20 p-3 rounded-lg text-center border border-yellow-600">
          <Calculator className="h-6 w-6 mx-auto mb-1 text-yellow-400" />
          <div className="text-xl font-bold text-white">
            {(() => {
              const monthlyRevenue = Number(analysisResults.metrics?.monthlyRevenue) || 0;
              const score = Math.min(10, Math.max(1, Math.round((monthlyRevenue / 1000000) * 2)));
              return `${score}/10`;
            })()}
          </div>
          <div className="text-xs text-gray-300">Profitability Score</div>
        </div>
      </div>

      {/* Detailed Finaya Chart Parameters */}
      <div className="bg-gray-800 p-3 rounded-lg mb-3 border border-gray-700">
        <h4 className="font-semibold text-yellow-400 mb-2 text-sm flex items-center">
          <Calculator className="h-4 w-4 mr-1" />
          Finaya Chart's Calculation Details
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="bg-gray-900 p-2 rounded border border-gray-600">
            <div className="text-gray-300">CGLP (Population)</div>
            <div className="text-white font-semibold">{analysisResults.metrics?.cglp ? Number(analysisResults.metrics.cglp) : 'N/A'}</div>
          </div>
          <div className="bg-gray-900 p-2 rounded border border-gray-600">
            <div className="text-gray-300">Residential Pop</div>
            <div className="text-white font-semibold">{analysisResults.metrics?.pops ? Number(analysisResults.metrics.pops) : 'N/A'}</div>
          </div>
          <div className="bg-gray-900 p-2 rounded border border-gray-600">
            <div className="text-gray-300">PDR (Density)</div>
            <div className="text-white font-semibold">{analysisResults.metrics?.pdr || 'N/A'}</div>
          </div>
          <div className="bg-gray-900 p-2 rounded border border-gray-600">
            <div className="text-gray-300">APC</div>
            <div className="text-white font-semibold">{analysisResults.metrics?.apc || 'N/A'}</div>
          </div>
          <div className="bg-gray-900 p-2 rounded border border-gray-600">
            <div className="text-gray-300">APT (Traffic)</div>
            <div className="text-white font-semibold">{analysisResults.metrics?.apt ? Number(analysisResults.metrics.apt) : 'N/A'}</div>
          </div>
          <div className="bg-gray-900 p-2 rounded border border-gray-600">
            <div className="text-gray-300">VCDT (Visitors)</div>
            <div className="text-white font-semibold">{analysisResults.metrics?.vcdt ? Number(analysisResults.metrics.vcdt) : 'N/A'}</div>
          </div>
          <div className="bg-gray-900 p-2 rounded border border-gray-600">
            <div className="text-gray-300">Area (km²)</div>
            <div className="text-white font-semibold">{analysisResults.locationData?.areaSquareKm?.toFixed(6) || 'N/A'}</div>
          </div>
          <div className="bg-gray-900 p-2 rounded border border-gray-600">
            <div className="text-gray-300">Road Area (m²)</div>
            <div className="text-white font-semibold">{analysisResults.metrics?.roadAreaSqm ? Number(analysisResults.metrics.roadAreaSqm) : 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Area Distribution */}
      <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
        <h4 className="font-semibold text-yellow-400 mb-2 text-sm flex items-center">
          <MapPin className="h-4 w-4 mr-1" />
          Area Distribution (AI Analysis)
        </h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-gray-900 p-2 rounded border border-gray-600 text-center">
            <div className="text-gray-300">Residential</div>
            <div className="text-white font-semibold">{analysisResults.areaDistribution?.residential || 'N/A'}%</div>
          </div>
          <div className="bg-gray-900 p-2 rounded border border-gray-600 text-center">
            <div className="text-gray-300">Roads</div>
            <div className="text-white font-semibold">{analysisResults.areaDistribution?.road || 'N/A'}%</div>
          </div>
          <div className="bg-gray-900 p-2 rounded border border-gray-600 text-center">
            <div className="text-gray-300">Open Space</div>
            <div className="text-white font-semibold">{analysisResults.areaDistribution?.openSpace || 'N/A'}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
