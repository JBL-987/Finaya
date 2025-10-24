import {
  Building,
  Route,
  Trees,
  PieChart,
  Info,
  MapPin
} from 'lucide-react';

const AreaDistributionChart = ({ 
  areaDistribution, 
  locationData, 
  imageMetadata 
}) => {
  if (!areaDistribution) return null;

  const { residential, road, open_space } = areaDistribution;

  // Color scheme for different area types
  const areaTypes = [
    {
      key: 'residential',
      label: 'Residential/Buildings',
      percentage: residential,
      color: '#8B4513', // Brown
      icon: Building,
      description: 'Buildings, houses, and commercial structures'
    },
    {
      key: 'road',
      label: 'Roads',
      percentage: road,
      color: '#FFD700', // Yellow/Gold
      icon: Route,
      description: 'Main roads, streets, and pathways'
    },
    {
      key: 'open_space',
      label: 'Open Space',
      percentage: open_space,
      color: '#32CD32', // Green
      icon: Trees,
      description: 'Parks, water bodies, and vacant areas'
    }
  ];

  // Calculate actual areas if location data is available
  const calculateActualArea = (percentage) => {
    if (!locationData?.areaSquareKm) return null;
    return (percentage / 100) * locationData.areaSquareKm;
  };

  return (
    <div className="bg-dark-surface rounded-xl border border-dark-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center text-white">
          <PieChart className="w-5 h-5 mr-2 text-blue-400" />
          Area Distribution Analysis
        </h3>
        {locationData && (
          <div className="text-sm text-dark-text-secondary">
            Total Area: {locationData.areaSquareKm?.toFixed(4)} km²
          </div>
        )}
      </div>

      {/* Visual Chart */}
      <div className="mb-6">
        <div className="relative h-8 bg-dark-bg rounded-lg overflow-hidden border border-dark-border">
          <div
            className="absolute left-0 top-0 h-full transition-all duration-1000"
            style={{
              width: `${residential}%`,
              backgroundColor: '#8B4513'
            }}
          />
          <div
            className="absolute top-0 h-full transition-all duration-1000"
            style={{
              left: `${residential}%`,
              width: `${road}%`,
              backgroundColor: '#FFD700'
            }}
          />
          <div
            className="absolute top-0 h-full transition-all duration-1000"
            style={{
              left: `${residential + road}%`,
              width: `${open_space}%`,
              backgroundColor: '#32CD32'
            }}
          />
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="space-y-4">
        {areaTypes.map((area) => {
          const Icon = area.icon;
          const actualArea = calculateActualArea(area.percentage);
          
          return (
            <div
              key={area.key}
              className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-dark-border hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: area.color }}
                />
                <Icon className="w-5 h-5 text-gray-400" />
                <div>
                  <h4 className="font-medium text-white">{area.label}</h4>
                  <p className="text-xs text-dark-text-secondary">
                    {area.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-white">
                  {area.percentage.toFixed(1)}%
                </div>
                {actualArea && (
                  <div className="text-xs text-dark-text-secondary">
                    {actualArea.toFixed(4)} km²
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Metadata Information */}
      {imageMetadata && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-800/30">
          <h4 className="font-medium text-white mb-3 flex items-center">
            <Info className="w-4 h-4 mr-2 text-blue-400" />
            Analysis Details
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-dark-text-secondary">Image Size:</span>
              <div className="font-medium text-white">
                {imageMetadata.width} × {imageMetadata.height} px
              </div>
            </div>
            <div>
              <span className="text-dark-text-secondary">Map Scale:</span>
              <div className="font-medium text-white">
                {imageMetadata.scale?.toFixed(3)} m/px
              </div>
            </div>
            <div>
              <span className="text-dark-text-secondary">Zoom Level:</span>
              <div className="font-medium text-white">
                {imageMetadata.zoomLevel}
              </div>
            </div>
            <div>
              <span className="text-dark-text-secondary">Analysis Time:</span>
              <div className="font-medium text-white">
                {new Date(imageMetadata.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Color Legend */}
      <div className="mt-4 p-3 bg-dark-bg rounded-lg border border-dark-border">
        <h5 className="text-sm font-medium text-white mb-2">Color Legend (Leaflet Map)</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span className="text-dark-text-secondary">Yellow: Main Roads</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-white rounded border"></div>
            <span className="text-dark-text-secondary">White: Secondary Roads</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-800 rounded"></div>
            <span className="text-dark-text-secondary">Brown: Buildings</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span className="text-dark-text-secondary">Gray: Open Spaces</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-dark-text-secondary">Green: Vegetation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-dark-text-secondary">Blue: Water Bodies</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaDistributionChart;
