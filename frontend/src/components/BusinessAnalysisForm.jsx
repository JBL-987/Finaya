import { useState } from 'react';
import {
  Calculator,
  Building,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  MapPin,
  Camera,
  Loader,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CURRENCIES, formatCurrency } from '../services/currencies';

const BusinessAnalysisForm = ({ 
  onAnalyze, 
  isAnalyzing, 
  selectedLocation,
  analysisResults 
}) => {
  const [formData, setFormData] = useState({
    buildingWidth: 3.8,
    dailyOperatingHours: 12,
    visitorRate: 0.1,
    purchaseRate: 90,
    productPrice: 50000,
    currency: 'IDR',
    populationDensityPerSqKm: 16000
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleAnalyze = () => {
    if (!selectedLocation) {
      alert('Please select a location on the map first');
      return;
    }
    onAnalyze(formData);
  };

  const formatCurrencyAmount = (amount) => {
    return formatCurrency(amount, formData.currency);
  };

  const getInputStep = (currencyCode) => {
    // For high-denomination currencies like IDR, VND, etc., use larger steps
    return ['IDR', 'VND', 'KRW', 'JPY', 'IRR', 'HUF', 'CLP', 'COP', 'PYG', 'UGX', 'TZS', 'KZT', 'UZS', 'MMK', 'KHR', 'LAK', 'LBP', 'RSD', 'ISK'].includes(currencyCode) ? '1000' : '0.01';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center text-gray-900">
          <Calculator className="w-5 h-5 mr-2 text-yellow-600" />
          Business Profitability Analysis
        </h3>
        {selectedLocation && (
          <div className="flex items-center text-sm text-green-600">
            <MapPin className="w-4 h-4 mr-1" />
            Location Selected
          </div>
        )}
      </div>

      {/* Location Info */}
      {selectedLocation && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-medium text-gray-900 mb-2">Selected Location</h4>
          <p className="text-sm text-gray-600">
            {selectedLocation.address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}
          </p>
        </div>
      )}

      {/* Basic Parameters */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900 flex items-center">
          <Building className="w-4 h-4 mr-2 text-yellow-600" />
          Business Parameters
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Building Width (meters)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.buildingWidth}
              onChange={(e) => handleInputChange('buildingWidth', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 transition-all"
              placeholder="3.8"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Operating Hours
            </label>
            <input
              type="number"
              step="0.5"
              value={formData.dailyOperatingHours}
              onChange={(e) => handleInputChange('dailyOperatingHours', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 transition-all"
              placeholder="12"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency & Product Price
            </label>
            <div className="flex space-x-2">
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value, productPrice: '' }))}
                className="w-24 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 transition-all"
              >
                {Object.keys(CURRENCIES).map(code => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step={getInputStep(formData.currency)}
                value={formData.productPrice}
                onChange={(e) => handleInputChange('productPrice', e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 transition-all"
                placeholder={CURRENCIES[formData.currency]?.placeholder || '0.00'}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {CURRENCIES[formData.currency]?.name} ({CURRENCIES[formData.currency]?.symbol})
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Population Density (per km²)
            </label>
            <input
              type="number"
              value={formData.populationDensityPerSqKm}
              onChange={(e) => handleInputChange('populationDensityPerSqKm', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 transition-all"
              placeholder="16000"
            />
          </div>
        </div>
      </div>

      {/* Advanced Parameters */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-yellow-600 hover:text-yellow-700 transition-colors font-medium"
        >
          <TrendingUp className="w-4 h-4 mr-1" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Parameters
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4 ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-1" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visitor Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.visitorRate}
                onChange={(e) => handleInputChange('visitorRate', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 transition-all"
                placeholder="0.1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Percentage of people who will visit your store
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Rate (%)
              </label>
              <input
                type="number"
                step="1"
                value={formData.purchaseRate}
                onChange={(e) => handleInputChange('purchaseRate', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 transition-all"
                placeholder="90"
              />
              <p className="text-xs text-gray-500 mt-1">
                Percentage of visitors who will make a purchase
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing || !selectedLocation}
        className={`w-full rounded-full border border-transparent transition-all duration-300 ease-out transform hover:scale-105 flex items-center justify-center gap-2 py-3 px-4 font-medium shadow-lg hover:shadow-xl ${
          isAnalyzing || !selectedLocation
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-yellow-600 text-white hover:bg-white hover:text-yellow-600 hover:border-yellow-600'
        }`}
      >
        {isAnalyzing ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Analyzing Location...
          </>
        ) : (
          <>
            <Camera className="w-5 h-5" />
            Analyze Business Potential
          </>
        )}
      </button>

      {/* Quick Results Preview */}
      {analysisResults && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-yellow-600" />
            Quick Results
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Daily Customers:</span>
              <div className="font-semibold text-gray-900">{analysisResults.metrics?.tppd || 0}</div>
            </div>
            <div>
              <span className="text-gray-600">Daily Revenue:</span>
              <div className="font-semibold text-yellow-600">
                {formatCurrencyAmount(analysisResults.metrics?.dailyRevenue || 0)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Monthly Revenue:</span>
              <div className="font-semibold text-yellow-700">
                {formatCurrencyAmount(analysisResults.metrics?.monthlyRevenue || 0)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Yearly Revenue:</span>
              <div className="font-semibold text-yellow-800">
                {formatCurrencyAmount(analysisResults.metrics?.yearlyRevenue || 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessAnalysisForm;