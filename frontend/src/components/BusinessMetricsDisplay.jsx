import {
  Users,
  TrendingUp,
  DollarSign,
  Calculator,
  Target,
  Clock,
  MapPin,
  Building,
  Route,
  Activity
} from 'lucide-react';
import { formatCurrency } from '../services/currencies';

const BusinessMetricsDisplay = ({ analysisResults }) => {
  if (!analysisResults?.metrics) return null;

  const { metrics, areaDistribution, businessParams, locationData } = analysisResults;

  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  };

  const formatCurrencyAmount = (amount) => {
    const currency = businessParams?.currency || 'IDR';
    return formatCurrency(amount, currency);
  };

  const formatDecimal = (num, decimals = 3) => {
    return parseFloat(num.toFixed(decimals));
  };

  const calculationSteps = [
    {
      step: 7,
      title: 'Current Gross Local Population (CGLP)',
      formula: 'Population Density × Area',
      calculation: `${formatNumber(locationData.populationDensityPerSqKm)} × ${locationData.areaSquareKm?.toFixed(4)}`,
      result: formatNumber(metrics.cglp),
      unit: 'people',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      step: 8,
      title: 'Real Population',
      formula: 'CGLP × Residential Area %',
      calculation: `${formatNumber(metrics.cglp)} × ${areaDistribution.residential}%`,
      result: formatNumber(metrics.realPopulation),
      unit: 'people',
      icon: Building,
      color: 'text-purple-400'
    },
    {
      step: 8.1,
      title: 'Road Area',
      formula: 'Total Area × Road %',
      calculation: `${(locationData.areaSquareKm * 1000000).toFixed(0)} × ${areaDistribution.road}%`,
      result: formatNumber(metrics.roadAreaSqm),
      unit: 'sqm',
      icon: Route,
      color: 'text-yellow-400'
    },
    {
      step: 8.2,
      title: 'People Density on Road (PDR)',
      formula: 'Real Population ÷ Road Area',
      calculation: `${formatNumber(metrics.realPopulation)} ÷ ${formatNumber(metrics.roadAreaSqm)}`,
      result: formatDecimal(metrics.pdr, 6),
      unit: 'people/sqm',
      icon: Activity,
      color: 'text-green-400'
    },
    {
      step: 9,
      title: 'Avg Population Capitalization (APC)',
      formula: 'Building Width × Road Width × PDR',
      calculation: `${businessParams.buildingWidth}m × 30m × ${formatDecimal(metrics.pdr, 6)}`,
      result: formatDecimal(metrics.apc),
      unit: 'people/second',
      icon: Calculator,
      color: 'text-orange-400'
    },
    {
      step: 10,
      title: 'Avg Population Traffic (APT)',
      formula: 'Daily Seconds × APC',
      calculation: `${businessParams.dailyOperatingHours * 3600}s × ${formatDecimal(metrics.apc)}`,
      result: formatNumber(metrics.apt),
      unit: 'people/day',
      icon: Clock,
      color: 'text-pink-400'
    },
    {
      step: 11,
      title: 'Visitor Capitalizations (VCDT)',
      formula: 'Visitor Rate × APT',
      calculation: `${businessParams.visitorRate}% × ${formatNumber(metrics.apt)}`,
      result: formatNumber(metrics.vcdt),
      unit: 'visitors/day',
      icon: Target,
      color: 'text-cyan-400'
    },
    {
      step: 12,
      title: 'Total People-Purchase Daily (TPPD)',
      formula: 'Purchase Rate × VCDT',
      calculation: `${businessParams.purchaseRate}% × ${formatNumber(metrics.vcdt)}`,
      result: formatNumber(metrics.tppd),
      unit: 'customers/day',
      icon: TrendingUp,
      color: 'text-emerald-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Summary */}
      <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl border border-green-800/30 p-6">
        <h3 className="text-xl font-semibold flex items-center text-white mb-4">
          <DollarSign className="w-5 h-5 mr-2 text-green-400" />
          Revenue Projections
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {formatCurrencyAmount(metrics.dailyRevenue)}
            </div>
            <div className="text-sm text-muted-foreground">Daily Revenue</div>
            <div className="text-xs text-green-300 mt-1">
              {formatNumber(metrics.tppd)} customers/day
            </div>
          </div>
          <div className="text-center p-4 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {formatCurrencyAmount(metrics.monthlyRevenue)}
            </div>
            <div className="text-sm text-muted-foreground">Monthly Revenue</div>
            <div className="text-xs text-blue-300 mt-1">
              30 days projection
            </div>
          </div>
          <div className="text-center p-4 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {formatCurrencyAmount(metrics.yearlyRevenue)}
            </div>
            <div className="text-sm text-muted-foreground">Yearly Revenue</div>
            <div className="text-xs text-purple-300 mt-1">
              365 days projection
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Calculations */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-xl font-semibold flex items-center text-card-foreground mb-6">
          <Calculator className="w-5 h-5 mr-2 text-blue-400" />
          Detailed Calculations
        </h3>
        
        <div className="space-y-4">
          {calculationSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full">
                      <Icon className={`w-4 h-4 ${step.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                          Step {step.step}
                        </span>
                        <h4 className="font-medium text-card-foreground">{step.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <span className="font-mono">{step.formula}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.calculation}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-lg font-bold ${step.color}`}>
                      {step.result}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {step.unit}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Business Parameters Used */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-xl font-semibold flex items-center text-card-foreground mb-4">
          <MapPin className="w-5 h-5 mr-2 text-blue-400" />
          Analysis Parameters
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Building Width:</span>
            <div className="font-medium text-card-foreground">{businessParams.buildingWidth}m</div>
          </div>
          <div>
            <span className="text-muted-foreground">Operating Hours:</span>
            <div className="font-medium text-card-foreground">{businessParams.dailyOperatingHours}h/day</div>
          </div>
          <div>
            <span className="text-muted-foreground">Visitor Rate:</span>
            <div className="font-medium text-card-foreground">{businessParams.visitorRate}%</div>
          </div>
          <div>
            <span className="text-muted-foreground">Purchase Rate:</span>
            <div className="font-medium text-card-foreground">{businessParams.purchaseRate}%</div>
          </div>
          <div>
            <span className="text-muted-foreground">Product Price:</span>
            <div className="font-medium text-card-foreground">{formatCurrencyAmount(businessParams.productPrice)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Population Density:</span>
            <div className="font-medium text-card-foreground">{formatNumber(businessParams.populationDensityPerSqKm)}/km²</div>
          </div>
          <div>
            <span className="text-muted-foreground">Analysis Area:</span>
            <div className="font-medium text-card-foreground">{locationData.areaSquareKm?.toFixed(4)} km²</div>
          </div>
          <div>
            <span className="text-muted-foreground">Road Width (avg):</span>
            <div className="font-medium text-card-foreground">30m</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessMetricsDisplay;
