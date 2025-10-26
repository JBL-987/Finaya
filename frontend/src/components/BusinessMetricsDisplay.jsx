import { TrendingUp, Users, DollarSign, MapPin, Clock, Building, Route, Activity, Calculator, Target } from 'lucide-react';
import { formatCurrency, formatNumber, formatDecimal } from '../services/currencies';

const BusinessMetricsDisplay = ({ analysisResults }) => {
  if (!analysisResults || !analysisResults.metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No business metrics available</p>
      </div>
    );
  }

  const { metrics, businessParams } = analysisResults;
  const currency = businessParams?.currency || 'IDR';

  const metricsData = [
    {
      icon: Users,
      label: 'Daily Customers',
      value: (metrics.tppd !== undefined ? metrics.tppd.toLocaleString() : '0'),
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/30',
      borderColor: 'border-blue-800/30'
    },
    {
      icon: DollarSign,
      label: 'Daily Revenue',
      value: (metrics.dailyRevenue !== undefined ? formatCurrency(metrics.dailyRevenue, currency) : '0'),
      color: 'text-green-400',
      bgColor: 'bg-green-900/30',
      borderColor: 'border-green-800/30'
    },
    {
      icon: TrendingUp,
      label: 'Monthly Revenue',
      value: (metrics.monthlyRevenue !== undefined ? formatCurrency(metrics.monthlyRevenue, currency) : '0'),
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/30',
      borderColor: 'border-purple-800/30'
    },
    {
      icon: MapPin,
      label: 'Area Analyzed',
      value: `${metrics.area_data?.area_sq_km?.toFixed(4) || '0'} km²`,
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/30',
      borderColor: 'border-orange-800/30'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((metric, index) => (
          <div
            key={index}
            className={`${metric.bgColor} ${metric.borderColor} rounded-lg p-4 border`}
          >
            <div className="flex items-center justify-between mb-2">
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
              <span className="text-xs text-gray-400 uppercase tracking-wide">
                {metric.label}
              </span>
            </div>
            <div className={`text-xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Population Analysis */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-400" />
            Population Analysis
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Current Gross Local Population:</span>
              <span className="text-white font-medium">
                {metrics.cglp?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Population in Residential Areas:</span>
              <span className="text-white font-medium">
                {metrics.pops?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">People Density on Road:</span>
              <span className="text-white font-medium">
                {metrics.pdr?.toFixed(6) || '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Traffic Analysis */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
            Traffic Analysis
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Average Population Capitalization:</span>
              <span className="text-white font-medium">
                {metrics.apc?.toFixed(3) || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Average Population Traffic:</span>
              <span className="text-white font-medium">
                {metrics.apt?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Visitor Capitalization:</span>
              <span className="text-white font-medium">
                {metrics.vcdt?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Business Parameters */}
      {businessParams && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2 text-yellow-400" />
            Business Parameters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-400">Building Width</div>
              <div className="text-lg font-medium text-white">
                {businessParams.buildingWidth} m
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">Operating Hours</div>
              <div className="text-lg font-medium text-white">
                {businessParams.operatingHours} hours
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">Product Price</div>
              <div className="text-lg font-medium text-white">
                {formatCurrency(businessParams.productPrice, currency)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculation Steps */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Calculator className="w-5 h-5 mr-2 text-indigo-400" />
          Detailed Calculation Steps
        </h3>
        <div className="space-y-4">
          {[
            {
              step: 7,
              title: 'Current Gross Local Population (CGLP)',
              formula: 'Population Density × Area',
              calculation: `${formatNumber(16000)} × ${analysisResults.locationData?.areaSquareKm?.toFixed(4) || '0'}`,
              result: formatNumber(metrics.cglp),
              unit: 'people',
              icon: Users,
              color: 'text-blue-400'
            },
            {
              step: 8,
              title: 'Real Population',
              formula: 'CGLP × Residential Area %',
              calculation: `${formatNumber(metrics.cglp)} × ${analysisResults.areaDistribution?.residential || 0}%`,
              result: formatNumber(metrics.pops),
              unit: 'people',
              icon: Building,
              color: 'text-purple-400'
            },
            {
              step: 8.1,
              title: 'Road Area',
              formula: 'Total Area × Road %',
              calculation: `${((analysisResults.locationData?.areaSquareKm || 0) * 1000000).toFixed(0)} × ${analysisResults.areaDistribution?.road || 0}%`,
              result: formatNumber(metrics.road_area_sqm),
              unit: 'sqm',
              icon: Route,
              color: 'text-yellow-400'
            },
            {
              step: 8.2,
              title: 'People Density on Road (PDR)',
              formula: 'Real Population ÷ Road Area',
              calculation: `${formatNumber(metrics.pops)} ÷ ${formatNumber(metrics.road_area_sqm)}`,
              result: formatDecimal(metrics.pdr, 6),
              unit: 'people/sqm',
              icon: Activity,
              color: 'text-green-400'
            },
            {
              step: 9,
              title: 'Avg Population Capitalization (APC)',
              formula: 'Building Width × Road Width × PDR',
              calculation: `${businessParams?.buildingWidth || 0}m × 30m × ${formatDecimal(metrics.pdr, 6)}`,
              result: formatDecimal(metrics.apc, 3),
              unit: 'people/second',
              icon: Calculator,
              color: 'text-orange-400'
            },
            {
              step: 10,
              title: 'Avg Population Traffic (APT)',
              formula: 'Daily Seconds × APC',
              calculation: `${(businessParams?.operatingHours || 0) * 3600}s × ${formatDecimal(metrics.apc, 3)}`,
              result: formatNumber(metrics.apt),
              unit: 'people/day',
              icon: Clock,
              color: 'text-pink-400'
            },
            {
              step: 11,
              title: 'Visitor Capitalizations (VCDT)',
              formula: 'Visitor Rate × APT',
              calculation: `0.1% × ${formatNumber(metrics.apt)}`,
              result: formatNumber(metrics.vcdt),
              unit: 'visitors/day',
              icon: Target,
              color: 'text-cyan-400'
            },
            {
              step: 12,
              title: 'Total People-Purchase Daily (TPPD)',
              formula: 'Purchase Rate × VCDT',
              calculation: `90% × ${formatNumber(metrics.vcdt)}`,
              result: formatNumber(metrics.tppd),
              unit: 'customers/day',
              icon: TrendingUp,
              color: 'text-emerald-400'
            }
          ].map((step) => (
            <div key={step.step} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <step.icon className={`w-5 h-5 mr-2 ${step.color}`} />
                  <span className="text-white font-medium">Step {step.step}: {step.title}</span>
                </div>
                <span className="text-gray-400 text-sm">{step.unit}</span>
              </div>
              <div className="text-sm text-gray-400 mb-1">Formula: {step.formula}</div>
              <div className="text-sm text-gray-300 mb-1">Calculation: {step.calculation}</div>
              <div className={`text-lg font-bold ${step.color}`}>Result: {step.result}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessMetricsDisplay;
