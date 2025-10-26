import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const AreaDistributionChart = ({ areaDistribution, locationData, imageMetadata }) => {
  if (!areaDistribution) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No area distribution data available</p>
      </div>
    );
  }

  // Prepare data for the chart
  const chartData = [
    {
      name: 'Residential',
      value: areaDistribution.residential || 0,
      color: '#10b981' // green
    },
    {
      name: 'Road',
      value: areaDistribution.road || 0,
      color: '#3b82f6' // blue
    },
    {
      name: 'Open Space',
      value: areaDistribution.open_space || 0,
      color: '#8b5cf6' // purple
    }
  ];

  const renderCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-gray-300">{data.value.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-300">
              {entry.value}: {entry.payload.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={renderCustomTooltip} />
            <Legend content={renderCustomLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-800 rounded-lg">
          <div className="text-lg font-bold text-green-400">
            {areaDistribution.residential?.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">Residential</div>
        </div>
        <div className="text-center p-3 bg-gray-800 rounded-lg">
          <div className="text-lg font-bold text-blue-400">
            {areaDistribution.road?.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">Road</div>
        </div>
        <div className="text-center p-3 bg-gray-800 rounded-lg">
          <div className="text-lg font-bold text-purple-400">
            {areaDistribution.open_space?.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">Open Space</div>
        </div>
      </div>

      {/* Location Info */}
      {locationData && (
        <div className="text-sm text-gray-400 text-center">
          Area: {locationData.areaSquareKm?.toFixed(4)} km²
        </div>
      )}
    </div>
  );
};

export default AreaDistributionChart;
