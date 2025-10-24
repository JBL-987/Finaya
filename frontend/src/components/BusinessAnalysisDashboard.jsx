import { useState } from 'react';
import {
  BarChart3,
  Download,
  Share2,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import AreaDistributionChart from './AreaDistributionChart';
import BusinessMetricsDisplay from './BusinessMetricsDisplay';
import { formatCurrency } from '../services/currencies';

const BusinessAnalysisDashboard = ({ 
  analysisResults, 
  onRefreshAnalysis,
  isAnalyzing 
}) => {
  const [showAreaDistribution, setShowAreaDistribution] = useState(true);
  const [showBusinessMetrics, setShowBusinessMetrics] = useState(true);
  const [showRawData, setShowRawData] = useState(false);

  if (!analysisResults) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-card-foreground mb-2">
          No Analysis Results
        </h3>
        <p className="text-muted-foreground">
          Select a location and run the business analysis to see results here.
        </p>
      </div>
    );
  }

  const handleExportData = () => {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      location: analysisResults.locationData,
      areaDistribution: analysisResults.areaDistribution,
      businessMetrics: analysisResults.metrics,
      businessParameters: analysisResults.businessParams
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareResults = async () => {
    const currency = analysisResults.businessParams?.currency || 'IDR';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Business Analysis Results - Finaya',
          text: `Business analysis shows potential daily revenue of ${formatCurrency(analysisResults.metrics.dailyRevenue, currency)} with ${analysisResults.metrics.tppd} customers per day.`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `Business Analysis Results - Finay\n\nDaily Revenue: ${formatCurrency(analysisResults.metrics.dailyRevenue, currency)}\nDaily Customers: ${analysisResults.metrics.tppd}\n\nAnalyzed with Finaya AI`;
      
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Results copied to clipboard!');
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center text-card-foreground">
            <BarChart3 className="w-6 h-6 mr-3 text-blue-400" />
            Business Analysis Results
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onRefreshAnalysis}
              disabled={isAnalyzing}
              className="p-2 bg-primary hover:bg-primary/90 disabled:bg-muted rounded-lg transition-colors"
              title="Refresh Analysis"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleShareResults}
              className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white"
              title="Share Results"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportData}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
              title="Export Data"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 rounded-lg p-4 border border-green-800/30">
            <div className="text-sm text-green-300 mb-1">Daily Revenue</div>
            <div className="text-xl font-bold text-green-400">
              {formatCurrency(analysisResults.metrics.dailyRevenue, analysisResults.businessParams?.currency || 'IDR')}
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 rounded-lg p-4 border border-blue-800/30">
            <div className="text-sm text-blue-300 mb-1">Daily Customers</div>
            <div className="text-xl font-bold text-blue-400">
              {analysisResults.metrics.tppd}
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 rounded-lg p-4 border border-purple-800/30">
            <div className="text-sm text-purple-300 mb-1">Monthly Revenue</div>
            <div className="text-xl font-bold text-purple-400">
              {formatCurrency(analysisResults.metrics.monthlyRevenue, analysisResults.businessParams?.currency || 'IDR')}
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-900/30 to-orange-800/30 rounded-lg p-4 border border-orange-800/30">
            <div className="text-sm text-orange-300 mb-1">Area Analyzed</div>
            <div className="text-xl font-bold text-orange-400">
              {analysisResults.locationData.areaSquareKm?.toFixed(4)} km²
            </div>
          </div>
        </div>
      </div>

      {/* Area Distribution Section */}
      <div className="bg-card rounded-xl border border-border">
        <button
          onClick={() => setShowAreaDistribution(!showAreaDistribution)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-accent/50 transition-colors rounded-t-xl"
        >
          <h3 className="text-lg font-semibold text-card-foreground">Area Distribution Analysis</h3>
          {showAreaDistribution ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        {showAreaDistribution && (
          <div className="p-6 pt-0">
            <AreaDistributionChart
              areaDistribution={analysisResults.areaDistribution}
              locationData={analysisResults.locationData}
              imageMetadata={analysisResults.imageMetadata}
            />
          </div>
        )}
      </div>

      {/* Business Metrics Section */}
      <div className="bg-card rounded-xl border border-border">
        <button
          onClick={() => setShowBusinessMetrics(!showBusinessMetrics)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-accent/50 transition-colors rounded-t-xl"
        >
          <h3 className="text-lg font-semibold text-card-foreground">Business Profitability Metrics</h3>
          {showBusinessMetrics ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        {showBusinessMetrics && (
          <div className="p-6 pt-0">
            <BusinessMetricsDisplay analysisResults={analysisResults} />
          </div>
        )}
      </div>

      {/* Raw Data Section */}
      <div className="bg-card rounded-xl border border-border">
        <button
          onClick={() => setShowRawData(!showRawData)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-accent/50 transition-colors rounded-t-xl"
        >
          <h3 className="text-lg font-semibold text-card-foreground flex items-center">
            {showRawData ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            Raw Analysis Data
          </h3>
          {showRawData ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        {showRawData && (
          <div className="p-6 pt-0">
            <pre className="bg-background rounded-lg p-4 text-xs text-muted-foreground overflow-x-auto border border-border">
              {JSON.stringify(analysisResults, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessAnalysisDashboard;
