import React, { useState } from 'react';
import { Cloud, Database, FileText, Map, Activity, Building2, Bus, SignpostBig } from 'lucide-react';

interface APISource {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  datasets: {
    name: string;
    format: string;
    size?: string;
    rows?: string;
  }[];
  endpoint?: string;
  updateFrequency: string;
}

export function APIIntegrationDiagram() {
  const [selectedAPI, setSelectedAPI] = useState<string | null>(null);

  const externalAPIs: APISource[] = [
    {
      id: 'nyc-open-data',
      name: 'NYC Open Data',
      provider: 'data.cityofnewyork.us',
      description: 'Primary source for tree census & city data',
      icon: <Database className="w-5 h-5" />,
      color: 'bg-blue-600',
      endpoint: 'https://data.cityofnewyork.us/resource/',
      updateFrequency: 'Daily',
      datasets: [
        { name: '2015 Street Tree Census', format: 'CSV', size: '210.15 MB', rows: '683,789' },
        { name: 'Building Footprints', format: 'CSV' },
        { name: 'Parks Properties', format: 'CSV' },
        { name: 'Bus Stop Shelters', format: 'CSV' },
        { name: 'Street Sign Work Orders', format: 'CSV' }
      ]
    },
    {
      id: 'nyc-doh',
      name: 'NYC Dept of Health',
      provider: 'NYC DOH',
      description: 'Heat Vulnerability Index & health data',
      icon: <Activity className="w-5 h-5" />,
      color: 'bg-red-600',
      updateFrequency: 'Quarterly',
      datasets: [
        { name: 'Heat Vulnerability Index', format: 'CSV' },
        { name: 'Community Air Survey', format: 'CSV' },
        { name: 'Indoor Environmental Complaints', format: 'CSV' }
      ]
    },
    {
      id: 'noaa',
      name: 'NOAA Weather',
      provider: 'National Oceanic & Atmospheric Admin',
      description: 'Central Park temperature baseline (1870-2024)',
      icon: <Cloud className="w-5 h-5" />,
      color: 'bg-cyan-600',
      endpoint: 'https://www.ncdc.noaa.gov/cdo-web/',
      updateFrequency: 'Monthly',
      datasets: [
        { name: 'Station USW00094728', format: 'CSV', rows: '154 years' },
        { name: 'December Avg Temp', format: 'Time series' }
      ]
    },
    {
      id: 'nyc-planning',
      name: 'NYC City Planning',
      provider: 'Dept of City Planning',
      description: 'Spatial boundaries & demographics',
      icon: <Map className="w-5 h-5" />,
      color: 'bg-purple-600',
      updateFrequency: 'Annually',
      datasets: [
        { name: 'Pseudo-Lots (Street Segments)', format: 'CSV' },
        { name: 'Population by Community District', format: 'CSV' },
        { name: 'ZIP Boundaries (TIGER/Line)', format: 'Shapefile' }
      ]
    },
    {
      id: 'nyc-parks',
      name: 'NYC Parks Dept',
      provider: 'Parks & Recreation',
      description: 'Tree maintenance & planting records',
      icon: <Building2 className="w-5 h-5" />,
      color: 'bg-green-600',
      updateFrequency: 'Weekly',
      datasets: [
        { name: 'Block Planting', format: 'CSV', size: '4.00 MB', rows: '114,944' },
        { name: 'Block Pruning', format: 'CSV', size: '4.36 MB', rows: '83,200' },
        { name: 'Tree Contract Work', format: 'CSV' },
        { name: 'MillionTreesNYC', format: 'CSV' }
      ]
    },
    {
      id: 'ny-state-ej',
      name: 'NY State EJ Screen',
      provider: 'NY Dept of Environmental Conservation',
      description: 'Environmental justice scores',
      icon: <SignpostBig className="w-5 h-5" />,
      color: 'bg-orange-600',
      updateFrequency: 'Annually',
      datasets: [
        { name: 'EJ Score by Census Tract', format: 'CSV' },
        { name: 'Poverty Rate', format: 'CSV' },
        { name: 'Minority Percentage', format: 'CSV' }
      ]
    }
  ];

  const internalAPIs: APISource[] = [
    {
      id: 'h3-service',
      name: 'H3 Spatial Service',
      provider: 'Internal',
      description: 'Hexagonal spatial indexing',
      icon: <Map className="w-5 h-5" />,
      color: 'bg-indigo-600',
      updateFrequency: 'Real-time',
      datasets: [
        { name: 'H3 Features (8,000 cells)', format: 'JSON' },
        { name: 'Resolution 9 (~1km²)', format: 'GeoJSON' }
      ]
    },
    {
      id: 'ml-prediction',
      name: 'ML Prediction API',
      provider: 'Python Server (Port 3002)',
      description: 'Random Forest & Gradient Boosting models',
      icon: <Activity className="w-5 h-5" />,
      color: 'bg-pink-600',
      endpoint: 'http://localhost:3002/predict',
      updateFrequency: 'On-demand',
      datasets: [
        { name: 'heat_impact_ml_model.pkl', format: 'Pickle' },
        { name: 'tree_growth_ml_model.pkl', format: 'Pickle' },
        { name: 'impact_model.pkl', format: 'Pickle' }
      ]
    },
    {
      id: 'gpu-nlp',
      name: 'GPU NLP Service',
      provider: 'NVIDIA CUDA',
      description: 'Review sentiment & bias detection',
      icon: <Cloud className="w-5 h-5" />,
      color: 'bg-yellow-600',
      updateFrequency: 'Real-time',
      datasets: [
        { name: 'Bias Detection Model', format: 'ONNX' },
        { name: 'Environmental Keywords', format: 'JSON' }
      ]
    }
  ];

  const renderAPICard = (api: APISource, isExternal: boolean) => {
    const isSelected = selectedAPI === api.id;
    
    return (
      <div
        key={api.id}
        className={`cursor-pointer transition-all duration-300 ${
          isSelected ? 'scale-105' : 'hover:scale-102'
        }`}
        onClick={() => setSelectedAPI(isSelected ? null : api.id)}
      >
        <div className={`${api.color} backdrop-blur-lg rounded-lg p-4 shadow-lg border-2 ${
          isSelected ? 'border-[#22c55e] shadow-[#22c55e]/30' : 'border-transparent'
        }`}>
          <div className="flex items-start gap-3 mb-2">
            {api.icon}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-white">{api.name}</h3>
              <p className="text-xs text-gray-200 opacity-90">{api.provider}</p>
              <p className="text-xs text-gray-100 mt-1">{api.description}</p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="bg-white/20 px-2 py-0.5 rounded text-white">
              {api.updateFrequency}
            </span>
            <span className="text-gray-200">
              {api.datasets.length} dataset{api.datasets.length > 1 ? 's' : ''}
            </span>
          </div>
          
          {isSelected && (
            <div className="mt-3 pt-3 border-t border-white/20">
              {api.endpoint && (
                <div className="mb-2">
                  <div className="text-xs font-semibold text-[#22c55e] mb-1">Endpoint:</div>
                  <div className="text-xs text-gray-100 font-mono break-all bg-black/20 p-1 rounded">
                    {api.endpoint}
                  </div>
                </div>
              )}
              <div className="text-xs font-semibold text-[#22c55e] mb-2">Datasets:</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {api.datasets.map((dataset, i) => (
                  <div key={i} className="text-xs text-gray-100 bg-black/20 p-2 rounded">
                    <div className="font-semibold">{dataset.name}</div>
                    <div className="text-gray-300 flex gap-2 mt-0.5">
                      <span>Format: {dataset.format}</span>
                      {dataset.size && <span>• {dataset.size}</span>}
                      {dataset.rows && <span>• {dataset.rows} rows</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold gradient-text mb-2">API Integration & Data Sources</h2>
        <p className="text-[#a7c4a0] italic">Click any API to view datasets and endpoints</p>
      </div>

      <div className="space-y-8">
        {/* External APIs */}
        <div>
          <h3 className="text-lg font-semibold text-[#22c55e] mb-4 flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            External Data Sources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {externalAPIs.map(api => renderAPICard(api, true))}
          </div>
        </div>

        {/* Integration Flow */}
        <div className="bg-[#14532d]/30 p-4 rounded border border-[#2d4a3d] backdrop-blur-lg">
          <h4 className="text-sm font-semibold text-[#22c55e] mb-3">Data Integration Pipeline</h4>
          <div className="flex items-center gap-2 text-xs text-gray-300 overflow-x-auto pb-2">
            <div className="bg-gradient-to-r from-[#15803d] to-[#16a34a] px-3 py-1 rounded whitespace-nowrap text-white">External API</div>
            <div className="text-[#22c55e]">→</div>
            <div className="bg-gradient-to-r from-[#15803d] to-[#16a34a] px-3 py-1 rounded whitespace-nowrap text-white">CSV/JSON Download</div>
            <div className="text-[#22c55e]">→</div>
            <div className="bg-gradient-to-r from-[#15803d] to-[#16a34a] px-3 py-1 rounded whitespace-nowrap text-white">Pandas Processing</div>
            <div className="text-[#22c55e]">→</div>
            <div className="bg-gradient-to-r from-[#15803d] to-[#16a34a] px-3 py-1 rounded whitespace-nowrap text-white">Parquet Storage</div>
            <div className="text-[#22c55e]">→</div>
            <div className="bg-gradient-to-r from-[#15803d] to-[#16a34a] px-3 py-1 rounded whitespace-nowrap text-white">ML Training</div>
            <div className="text-[#22c55e]">→</div>
            <div className="bg-gradient-to-r from-[#15803d] to-[#16a34a] px-3 py-1 rounded whitespace-nowrap text-white">API Response</div>
          </div>
        </div>

        {/* Internal APIs */}
        <div>
          <h3 className="text-lg font-semibold text-[#16a34a] mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Internal Services
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {internalAPIs.map(api => renderAPICard(api, false))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 pt-6 border-t border-[#2d4a3d]">
        <h4 className="text-sm font-semibold text-[#a7c4a0] mb-3">Integration Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d]">
            <div className="text-[#22c55e] font-semibold mb-1">6 External APIs</div>
            <div className="text-[#a7c4a0] text-xs">NYC Open Data, NOAA, DOH, Parks, Planning, EJ</div>
          </div>
          <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d]">
            <div className="text-[#22c55e] font-semibold mb-1">3 Internal Services</div>
            <div className="text-[#a7c4a0] text-xs">H3 Spatial, ML Prediction, GPU NLP</div>
          </div>
          <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d]">
            <div className="text-[#22c55e] font-semibold mb-1">25+ Datasets</div>
            <div className="text-[#a7c4a0] text-xs">CSV, Parquet, Shapefiles, Pickle models</div>
          </div>
          <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d]">
            <div className="text-[#22c55e] font-semibold mb-1">683,789 Trees</div>
            <div className="text-[#a7c4a0] text-xs">From 2015 Street Tree Census (210 MB)</div>
          </div>
        </div>
      </div>
    </div>
  );
}