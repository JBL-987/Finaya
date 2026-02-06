import { TrendingUp, Users, DollarSign, Calculator, MapPin, Save, X, Brain, Download } from 'lucide-react';
import { formatCurrency } from '../services/currencies';
import { useCurrency } from '../contexts/CurrencyContext';
import { usePDFExport } from '../hooks/usePDFExport';

const ResultsPanel = ({
  analysisResults,
  businessParams,
  showResults,
  onClose,
  onSave
}) => {
  const { selectedCurrency } = useCurrency();
  const { exportPDF, isExporting } = usePDFExport();

  if (!showResults || !analysisResults) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div id="analysis-report" className="bg-neutral-950 border border-neutral-800 rounded-lg shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header - Sticky */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 bg-neutral-950 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center text-white">
              <TrendingUp className="h-6 w-6 mr-2 text-yellow-400" />
              Comprehensive Business Analysis
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportPDF('analysis-report', `Finaya_Report_${analysisResults.id || 'Draft'}.pdf`)}
                disabled={isExporting}
                className="rounded-full bg-neutral-900 text-white border border-yellow-400/50 transition-all duration-300 ease-out transform hover:scale-105 hover:bg-yellow-400 hover:text-black flex items-center justify-center gap-2 px-4 py-2 font-medium shadow-lg hover:shadow-xl text-sm"
              >
                {isExporting ? <span className="animate-spin">⏳</span> : <Download className="h-4 w-4" />}
                <span>{isExporting ? 'Generating...' : 'Export Report'}</span>
              </button>
              <button
                onClick={onSave}
                className="rounded-full bg-yellow-600 text-white border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-white hover:text-yellow-600 hover:border-yellow-600 flex items-center justify-center gap-2 px-4 py-2 font-medium shadow-lg hover:shadow-xl text-sm"
              >
                <Save className="h-4 w-4" />
                <span>Save Analysis</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-neutral-400 hover:text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-black">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Metrics & Calculations (Full Width) */}
            <div className="lg:col-span-12 space-y-6">
              {/* Main Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-neutral-900/50 p-3 rounded-lg text-center border border-yellow-600/30">
                  <Users className="h-6 w-6 mx-auto mb-1 text-yellow-400" />
                  <div className="text-xl font-bold text-white">{analysisResults.metrics?.tppd !== undefined ? Number(analysisResults.metrics.tppd) : 'N/A'}</div>
                  <div className="text-[10px] uppercase tracking-wider text-neutral-400">Total Purchases/Day</div>
                </div>

                <div className="bg-neutral-900/50 p-3 rounded-lg text-center border border-yellow-600/30">
                  <DollarSign className="h-6 w-6 mx-auto mb-1 text-yellow-400" />
                  <div className="text-xl font-bold text-white">
                    {analysisResults.metrics?.dailyRevenue !== undefined ? formatCurrency(Number(analysisResults.metrics.dailyRevenue), selectedCurrency) : 'N/A'}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-neutral-400">Daily Revenue</div>
                </div>

                <div className="bg-neutral-900/50 p-3 rounded-lg text-center border border-yellow-600/30">
                  <TrendingUp className="h-6 w-6 mx-auto mb-1 text-yellow-400" />
                  <div className="text-xl font-bold text-white">
                    {analysisResults.metrics?.monthlyRevenue !== undefined ? formatCurrency(Number(analysisResults.metrics.monthlyRevenue), selectedCurrency) : 'N/A'}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-neutral-400">Monthly Revenue</div>
                </div>

                <div className="bg-neutral-900/50 p-3 rounded-lg text-center border border-yellow-600/30">
                  <Calculator className="h-6 w-6 mx-auto mb-1 text-yellow-400" />
                  <div className="text-xl font-bold text-white">
                    {analysisResults.metrics?.locationScore !== undefined ? Number(analysisResults.metrics.locationScore).toFixed(2) : 'N/A'}
                    <span className="text-sm font-normal text-gray-400">/10</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-neutral-400">Profit Score</div>
                </div>
              </div>

              {/* Scientific Validity & Risk */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                  <h4 className="font-bold text-white mb-4 text-sm flex items-center uppercase tracking-widest">
                    <Brain className="h-4 w-4 mr-2 text-yellow-400" />
                    Scientific Validity
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                       <span className="text-sm text-gray-400">Confidence Level</span>
                       <span className={`px-2 py-1 rounded text-xs font-bold ${
                         analysisResults.metrics?.confidenceLevel === 'High' ? 'bg-green-900 text-green-300' :
                         analysisResults.metrics?.confidenceLevel === 'Medium' ? 'bg-yellow-900 text-yellow-300' :
                         'bg-red-900 text-red-300'
                       }`}>
                         {analysisResults.metrics?.confidenceLevel || 'N/A'}
                       </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1 uppercase">Model Assumptions</span>
                      <p className="text-xs text-gray-300 italic leading-relaxed">
                        "{analysisResults.metrics?.assumptions || 'Standard urban density model applied.'}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                  <h4 className="font-bold text-white mb-4 text-sm flex items-center uppercase tracking-widest">
                    <TrendingUp className="h-4 w-4 mr-2 text-yellow-400" />
                    Risk Evaluation
                  </h4>
                  <div className="flex flex-col h-full justify-center">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Calculated Risk Score</span>
                      <span className="text-xl font-bold text-white">{((analysisResults.metrics?.riskScore || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2.5 mb-4">
                      <div 
                        className={`h-2.5 rounded-full ${
                          (analysisResults.metrics?.riskScore || 0) > 0.5 ? 'bg-red-500' : 
                          (analysisResults.metrics?.riskScore || 0) > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                        }`} 
                        style={{ width: `${Math.min(100, (analysisResults.metrics?.riskScore || 0) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Lower risk score indicates higher stability. Based on competitor density and population metrics.
                    </p>
                  </div>
                </div>
              </div>

              {/* Calculation Details */}
              <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                <h4 className="font-bold text-white mb-4 text-sm flex items-center uppercase tracking-widest">
                  <Calculator className="h-4 w-4 mr-2 text-yellow-400" />
                  Technical Breakdown
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-black p-3 rounded-lg border border-neutral-800">
                    <div className="text-[10px] text-neutral-400 uppercase">CGLP Population</div>
                    <div className="text-sm font-bold text-white">{analysisResults.metrics?.cglp ? Number(analysisResults.metrics.cglp).toLocaleString() : 'N/A'}</div>
                  </div>
                  <div className="bg-black p-3 rounded-lg border border-neutral-800">
                    <div className="text-[10px] text-neutral-400 uppercase">Residential Pop</div>
                    <div className="text-sm font-bold text-white">{analysisResults.metrics?.pops ? Number(analysisResults.metrics.pops).toLocaleString() : 'N/A'}</div>
                  </div>
                  <div className="bg-black p-3 rounded-lg border border-neutral-800">
                    <div className="text-[10px] text-neutral-400 uppercase">Traffic Potential (APT)</div>
                    <div className="text-sm font-bold text-white">{analysisResults.metrics?.apt ? Number(analysisResults.metrics.apt).toLocaleString() : 'N/A'}</div>
                  </div>
                  <div className="bg-black p-3 rounded-lg border border-neutral-800">
                    <div className="text-[10px] text-neutral-400 uppercase">Yearly Projection</div>
                    <div className="text-sm font-bold text-yellow-400">{analysisResults.metrics?.yearlyRevenue ? formatCurrency(Number(analysisResults.metrics.yearlyRevenue), selectedCurrency) : 'N/A'}</div>
                  </div>
                  <div className="bg-black p-3 rounded-lg border border-neutral-800">
                    <div className="text-[10px] text-neutral-400 uppercase">Road Density (PDR)</div>
                    <div className="text-sm font-bold text-white">{analysisResults.metrics?.pdr || 'N/A'}</div>
                  </div>
                  <div className="bg-black p-3 rounded-lg border border-neutral-800">
                    <div className="text-[10px] text-neutral-400 uppercase">Analysis Zone (Catchment Area)</div>
                    <div className="text-sm font-bold text-white">{analysisResults.locationData?.areaSquareKm?.toFixed(4) || 'N/A'} km²</div>
                  </div>
                </div>
              </div>

              {/* Area Distribution Visualization */}
              <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                <h4 className="font-bold text-white mb-4 text-sm flex items-center uppercase tracking-widest">
                  <MapPin className="h-4 w-4 mr-2 text-yellow-400" />
                  Land Use Distribution
                </h4>
                <div className="flex h-4 w-full rounded-full overflow-hidden bg-neutral-800 mb-4">
                  <div 
                    style={{ width: `${analysisResults.areaDistribution?.residential || 0}%` }} 
                    className="bg-yellow-400 h-full"
                    title="Residential"
                  />
                  <div 
                    style={{ width: `${analysisResults.areaDistribution?.road || 0}%` }} 
                    className="bg-neutral-600 h-full"
                    title="Roads"
                  />
                  <div 
                    style={{ width: `${analysisResults.areaDistribution?.openSpace || 0}%` }} 
                    className="bg-neutral-800 h-full"
                    title="Open Space"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
                    <span className="text-neutral-300">Residential: <strong>{analysisResults.areaDistribution?.residential || 0}%</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-neutral-600 rounded-sm"></div>
                    <span className="text-neutral-300">Roads: <strong>{analysisResults.areaDistribution?.road || 0}%</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-neutral-800 rounded-sm"></div>
                    <span className="text-neutral-300">Open Space: <strong>{analysisResults.areaDistribution?.openSpace || 0}%</strong></span>
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              {analysisResults.areaDistribution?.reasoning && (
                <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                  <h4 className="font-bold text-white mb-4 text-sm flex items-center uppercase tracking-widest">
                    <Brain className="h-4 w-4 mr-2 text-yellow-400" />
                    AI Analysis Reasoning
                  </h4>
                  <p className="text-sm text-gray-300 leading-relaxed italic border-l-2 border-yellow-600 pl-4 py-1">
                    "{analysisResults.areaDistribution.reasoning}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ResultsPanel;
