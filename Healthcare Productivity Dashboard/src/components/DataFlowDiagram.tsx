import React, { useState } from 'react';
import { Database, Brain, Map, TrendingUp, Leaf, CloudRain, Wind, Thermometer } from 'lucide-react';

interface FlowNode {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  details: string[];
}

export function DataFlowDiagram() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const dataInputs: FlowNode[] = [
    {
      id: 'hvi',
      label: 'Heat Vulnerability Index',
      description: 'NYC DOH by ZIP code',
      icon: <Thermometer className="w-5 h-5" />,
      color: 'bg-red-600',
      details: [
        'Variables: Poverty rate, age >65, AC access, surface temp',
        'Range: 0-1 (normalized)',
        'File: heat_vulnerability_processed.parquet',
        '1,794 ZIP codes covered'
      ]
    },
    {
      id: 'air',
      label: 'Air Quality Score',
      description: 'PM2.5 + NO2 by Community District',
      icon: <Wind className="w-5 h-5" />,
      color: 'bg-purple-600',
      details: [
        'Pollutants: PM2.5, NO2 (annual averages)',
        'Formula: PM2.5_conc + NO2_conc',
        'File: air_quality_processed.parquet',
        'Interpolated to ZIP level'
      ]
    },
    {
      id: 'trees',
      label: '2015 Tree Census',
      description: '683,789 street trees',
      icon: <Leaf className="w-5 h-5" />,
      color: 'bg-green-600',
      details: [
        'Columns: tree_id, lat/lon, DBH, health, species',
        'Size: 210.15 MB, 683,789 rows',
        'File: street_trees_2015.csv',
        'Aggregated to H3 resolution 9'
      ]
    },
    {
      id: 'temp',
      label: 'Temperature Baseline',
      description: 'Central Park NOAA (1870-2024)',
      icon: <CloudRain className="w-5 h-5" />,
      color: 'bg-blue-600',
      details: [
        'Station: USW00094728',
        'Warming rate: 0.0538°F/year (recent trend)',
        'File: baseline_temperature_central_park.csv',
        '154 years of data'
      ]
    }
  ];

  const models: FlowNode[] = [
    {
      id: 'model1',
      label: 'Model 1: Spatial Correlation',
      description: 'Priority scoring with ML',
      icon: <Map className="w-5 h-5" />,
      color: 'bg-emerald-600',
      details: [
        'Random Forest: 150 trees, max_depth=15',
        'Target: impact_per_dollar',
        'R²: 0.9329 (test set)',
        'Top feature: tree_gap_x_ej (76.77%)',
        'Output: Priority scores for 8,000 H3 cells'
      ]
    },
    {
      id: 'model2',
      label: 'Model 2: 30-Year Forecasts',
      description: 'Tree growth & temperature prediction',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-cyan-600',
      details: [
        'Growth Model: Random Forest (R² = 0.891)',
        'Survival Model: Gradient Boosting',
        'Temperature: i-Tree physics-based methodology',
        'CO2: Scales with DBH^1.5',
        'Output: Yearly projections (1-30 years)'
      ]
    },
    {
      id: 'model3',
      label: 'Model 3: Planting Locator',
      description: 'Algorithmic compliance checking',
      icon: <Database className="w-5 h-5" />,
      color: 'bg-indigo-600',
      details: [
        'Spacing: 25ft min, 50ft max between trees',
        'Corner clearance: 30ft from intersections',
        'Sign/bus stop: 5ft clearance',
        'Building: 10ft clearance',
        'Output: ~125,000 legal planting locations'
      ]
    }
  ];

  const outputs: FlowNode[] = [
    {
      id: 'scores',
      label: 'Environmental Scores',
      description: 'Real estate licensing (Zillow, etc.)',
      icon: <Brain className="w-5 h-5" />,
      color: 'bg-orange-600',
      details: [
        'Formula: 0.6 × science_score + 0.4 × user_score',
        'Scale: 0-100 per H3 cell',
        'Update: Monthly (science), real-time (reviews)',
        'GPU processing for review bias detection'
      ]
    },
    {
      id: 'maps',
      label: 'Interactive Maps',
      description: 'Mapbox GL JS visualization',
      icon: <Map className="w-5 h-5" />,
      color: 'bg-teal-600',
      details: [
        'H3 hexagonal cells (color-coded by priority)',
        'Tree planting opportunity markers',
        'Temperature/pollution heat maps',
        'Community reviews overlay'
      ]
    }
  ];

  const renderNode = (node: FlowNode, index: number, total: number) => {
    const isSelected = selectedNode === node.id;
    
    return (
      <div
        key={node.id}
        className={`relative cursor-pointer transition-all duration-300 ${
          isSelected ? 'scale-105' : 'hover:scale-102'
        }`}
        onClick={() => setSelectedNode(isSelected ? null : node.id)}
      >
        <div className={`${node.color} rounded-lg p-4 shadow-lg border-2 backdrop-blur-lg ${
          isSelected ? 'border-[#22c55e] shadow-[#22c55e]/30' : 'border-transparent'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            {node.icon}
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-white">{node.label}</h3>
              <p className="text-xs text-gray-200 opacity-90">{node.description}</p>
            </div>
          </div>
          
          {isSelected && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <ul className="space-y-1">
                {node.details.map((detail, i) => (
                  <li key={i} className="text-xs text-gray-100 flex items-start gap-2">
                    <span className="text-[#22c55e] mt-0.5">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const Arrow = ({ vertical = false }: { vertical?: boolean }) => (
    <div className={`flex items-center justify-center ${vertical ? 'my-4' : 'mx-4'}`}>
      <div className={`${vertical ? 'h-8 w-0.5' : 'w-8 h-0.5'} bg-gradient-to-${vertical ? 'b' : 'r'} from-[#16a34a] to-[#22c55e]`} />
      <div className={`${vertical ? 'border-l-2 border-t-2' : 'border-r-2 border-b-2'} border-[#22c55e] ${vertical ? 'h-2 w-2 -ml-1 rotate-45' : 'h-2 w-2 -ml-1 -rotate-45'}`} />
    </div>
  );

  return (
    <div className="glass-card p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold gradient-text mb-2">Data Flow Architecture</h2>
        <p className="text-[#a7c4a0] italic">Click any component to view detailed specifications</p>
      </div>

      <div className="space-y-8">
        {/* Data Inputs */}
        <div>
          <h3 className="text-lg font-semibold text-[#22c55e] mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Sources & Inputs
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dataInputs.map((node, i) => renderNode(node, i, dataInputs.length))}
          </div>
        </div>

        <div className="flex justify-center">
          <Arrow vertical />
        </div>

        {/* Processing Models */}
        <div>
          <h3 className="text-lg font-semibold text-[#16a34a] mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Machine Learning & Processing Pipeline
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {models.map((node, i) => renderNode(node, i, models.length))}
          </div>
        </div>

        <div className="flex justify-center">
          <Arrow vertical />
        </div>

        {/* Outputs */}
        <div>
          <h3 className="text-lg font-semibold text-[#15803d] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Outputs & Visualization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outputs.map((node, i) => renderNode(node, i, outputs.length))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-[#2d4a3d]">
        <h4 className="text-sm font-semibold text-[#a7c4a0] mb-3">Data Flow Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d]">
            <div className="text-[#22c55e] font-semibold mb-1">15+ Data Sources</div>
            <div className="text-[#a7c4a0] text-xs">Heat, air quality, trees, temperature, compliance data</div>
          </div>
          <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d]">
            <div className="text-[#22c55e] font-semibold mb-1">3 ML Models</div>
            <div className="text-[#a7c4a0] text-xs">Random Forest, Gradient Boosting, physics-based i-Tree</div>
          </div>
          <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d]">
            <div className="text-[#22c55e] font-semibold mb-1">8,000 H3 Cells</div>
            <div className="text-[#a7c4a0] text-xs">~1km² resolution across all NYC boroughs</div>
          </div>
        </div>
      </div>
    </div>
  );
}