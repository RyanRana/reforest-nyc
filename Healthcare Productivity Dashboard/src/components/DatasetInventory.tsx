import React, { useState } from 'react';
import { Database, FileText, Folder, HardDrive, Search } from 'lucide-react';

interface Dataset {
  name: string;
  path: string;
  format: string;
  size?: string;
  rows?: string;
  description: string;
  category: 'raw' | 'processed' | 'external' | 'models' | 'compliance';
}

export function DatasetInventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const datasets: Dataset[] = [
    // Raw Data
    {
      name: 'street_trees_2015.csv',
      path: 'data/cache/',
      format: 'CSV',
      size: '210.15 MB',
      rows: '683,789',
      description: 'Complete 2015 NYC street tree census with lat/lon, DBH, health, species',
      category: 'raw'
    },
    {
      name: 'heat_vulnerability.csv',
      path: 'data/cache/',
      format: 'CSV',
      description: 'NYC DOH Heat Vulnerability Index by ZIP (poverty, age, AC access, temp)',
      category: 'raw'
    },
    {
      name: 'air_quality.csv',
      path: 'data/cache/',
      format: 'CSV',
      description: 'NYC Community Air Survey (PM2.5, NO2) by Community District',
      category: 'raw'
    },
    {
      name: 'baseline_temperature_central_park.csv',
      path: 'data/cache/',
      format: 'CSV',
      rows: '154 years',
      description: 'NOAA Central Park station (USW00094728) - December avg temps (1870-2024)',
      category: 'raw'
    },
    {
      name: 'block_planting.csv',
      path: 'data/cache/',
      format: 'CSV',
      size: '4.00 MB',
      rows: '114,944',
      description: 'Tree planting records by block from NYC Parks',
      category: 'raw'
    },
    {
      name: 'block_pruning.csv',
      path: 'data/cache/',
      format: 'CSV',
      size: '4.36 MB',
      rows: '83,200',
      description: 'Tree pruning maintenance records',
      category: 'raw'
    },
    {
      name: 'fuel_oil_data.csv',
      path: 'data/cache/',
      format: 'CSV',
      description: 'Fuel oil consumption by ZIP (pollution proxy)',
      category: 'raw'
    },
    {
      name: 'cooling_sites.csv',
      path: 'data/cache/',
      format: 'CSV',
      description: 'NYC cooling center locations (lat/lon)',
      category: 'raw'
    },
    {
      name: 'indoor_environmental.csv',
      path: 'data/cache/',
      format: 'CSV',
      description: 'Indoor environmental complaints by ZIP',
      category: 'raw'
    },
    {
      name: 'hazard_mitigation.csv',
      path: 'data/cache/',
      format: 'CSV',
      description: 'Climate hazard mitigation data',
      category: 'raw'
    },
    {
      name: 'oer_cleanup_sites.csv',
      path: 'data/cache/',
      format: 'CSV',
      description: 'Oil spill cleanup sites (exclusion zones)',
      category: 'raw'
    },
    {
      name: 'tree_contract_work.csv',
      path: 'data/cache/',
      format: 'CSV',
      description: 'NYC Parks tree maintenance contracts',
      category: 'raw'
    },
    {
      name: 'million_trees_nyc.csv',
      path: 'data/cache/',
      format: 'CSV',
      description: 'MillionTreesNYC initiative data',
      category: 'raw'
    },
    {
      name: 'forest_restoration.csv',
      path: 'data/cache/',
      format: 'CSV',
      description: 'Forest restoration projects',
      category: 'raw'
    },
    {
      name: 'sea_level_rise_maps.csv',
      path: 'data/cache/',
      format: 'CSV',
      description: 'Sea level rise projections',
      category: 'raw'
    },

    // Processed Data
    {
      name: 'heat_vulnerability_processed.parquet',
      path: 'data/processed/',
      format: 'Parquet',
      description: 'Normalized heat vulnerability scores with interaction terms',
      category: 'processed'
    },
    {
      name: 'air_quality_processed.parquet',
      path: 'data/processed/',
      format: 'Parquet',
      description: 'Air quality scores interpolated to ZIP level',
      category: 'processed'
    },
    {
      name: 'fuel_oil_processed.parquet',
      path: 'data/processed/',
      format: 'Parquet',
      description: 'Log-transformed fuel oil consumption (pollution proxy)',
      category: 'processed'
    },
    {
      name: 'cooling_sites_processed.parquet',
      path: 'data/processed/',
      format: 'Parquet',
      description: 'Distance to nearest cooling center (normalized)',
      category: 'processed'
    },
    {
      name: 'indoor_environmental_processed.parquet',
      path: 'data/processed/',
      format: 'Parquet',
      description: 'Processed indoor environmental complaint data',
      category: 'processed'
    },
    {
      name: 'hazard_mitigation_processed.parquet',
      path: 'data/processed/',
      format: 'Parquet',
      description: 'Processed hazard mitigation metrics',
      category: 'processed'
    },
    {
      name: 'oer_cleanup_sites_processed.parquet',
      path: 'data/processed/',
      format: 'Parquet',
      description: 'Processed cleanup site data',
      category: 'processed'
    },
    {
      name: 'available_tree_planting_coordinates.json',
      path: 'data/processed/',
      format: 'GeoJSON',
      rows: '~125,000',
      description: 'Legal tree planting locations from compliance algorithm',
      category: 'processed'
    },

    // External Data
    {
      name: 'tl_2010_36_zcta510.shp',
      path: 'data/external/nyc_zip_boundaries/',
      format: 'Shapefile',
      description: 'ZIP code boundaries (TIGER/Line 2010)',
      category: 'external'
    },
    {
      name: 'nyc_building_footprints.csv',
      path: 'data/external/',
      format: 'CSV',
      description: 'Building footprints for clearance calculations',
      category: 'external'
    },
    {
      name: 'nyc_parks_properties.csv',
      path: 'data/external/',
      format: 'CSV',
      description: 'Parks boundaries (exclude from street tree planting)',
      category: 'external'
    },
    {
      name: 'nyc_pseudo_lots.csv',
      path: 'data/external/',
      format: 'CSV',
      description: 'Street segment geometry for spacing calculations',
      category: 'external'
    },
    {
      name: 'nyc_population_community_districts.csv',
      path: 'data/external/',
      format: 'CSV',
      description: 'Population by Community District',
      category: 'external'
    },

    // Compliance Data
    {
      name: 'Street_Sign_Work_Orders_20260116.csv',
      path: 'Compliance data merged/',
      format: 'CSV',
      description: 'Street sign locations (5ft clearance required)',
      category: 'compliance'
    },
    {
      name: 'Bus_Stop_Shelter_20260116.csv',
      path: 'Compliance data merged/',
      format: 'CSV',
      description: 'Bus stop locations (5ft clearance required)',
      category: 'compliance'
    },

    // Models
    {
      name: 'impact_model.pkl',
      path: 'data/models/',
      format: 'Pickle',
      description: 'Random Forest for impact prediction (R² = 0.9329)',
      category: 'models'
    },
    {
      name: 'heat_impact_ml_model.pkl',
      path: 'data/models/',
      format: 'Pickle',
      description: 'Temperature/CO2 ML model (MAE = 0.0080°F)',
      category: 'models'
    },
    {
      name: 'tree_growth_ml_model.pkl',
      path: 'data/models/',
      format: 'Pickle',
      description: 'Tree growth/survival ML model (R² = 0.891)',
      category: 'models'
    },
    {
      name: 'h3_features.json',
      path: 'data/models/',
      format: 'JSON',
      rows: '8,000 cells',
      description: 'H3 cell features (resolution 9, ~1km²)',
      category: 'models'
    },
    {
      name: 'zip_features.json',
      path: 'data/models/',
      format: 'JSON',
      rows: '1,794 ZIPs',
      description: 'ZIP code aggregated features',
      category: 'models'
    },
    {
      name: 'baseline_temperature_trend.json',
      path: 'data/models/',
      format: 'JSON',
      description: 'Central Park warming rate (0.0538°F/year)',
      category: 'models'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Datasets', color: 'bg-gray-600', count: datasets.length },
    { id: 'raw', label: 'Raw Data', color: 'bg-blue-600', count: datasets.filter(d => d.category === 'raw').length },
    { id: 'processed', label: 'Processed', color: 'bg-green-600', count: datasets.filter(d => d.category === 'processed').length },
    { id: 'external', label: 'External', color: 'bg-purple-600', count: datasets.filter(d => d.category === 'external').length },
    { id: 'compliance', label: 'Compliance', color: 'bg-orange-600', count: datasets.filter(d => d.category === 'compliance').length },
    { id: 'models', label: 'Models', color: 'bg-pink-600', count: datasets.filter(d => d.category === 'models').length }
  ];

  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dataset.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || dataset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.color || 'bg-gray-600';
  };

  return (
    <div className="glass-card p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold gradient-text mb-2">Complete Dataset Inventory</h2>
        <p className="text-[#a7c4a0] italic">25+ datasets powering the NYC Climate Resilience Platform</p>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#a7c4a0] w-5 h-5" />
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#14532d]/30 border border-[#2d4a3d] rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#a7c4a0] focus:outline-none focus:border-[#22c55e]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? `${cat.color} text-white shadow-lg shadow-[#22c55e]/20`
                  : 'bg-[#14532d]/30 text-[#a7c4a0] hover:text-white border border-[#2d4a3d]'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Dataset List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {filteredDatasets.map((dataset, i) => (
          <div
            key={i}
            className="bg-[#14532d]/30 border border-[#2d4a3d] rounded-lg p-4 hover:border-[#22c55e] transition-all backdrop-blur-lg"
          >
            <div className="flex items-start gap-3">
              <div className={`${getCategoryColor(dataset.category)} p-2 rounded`}>
                {dataset.category === 'models' ? (
                  <HardDrive className="w-5 h-5 text-white" />
                ) : dataset.format === 'Shapefile' ? (
                  <Folder className="w-5 h-5 text-white" />
                ) : (
                  <FileText className="w-5 h-5 text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-mono text-sm font-semibold text-white break-all">
                    {dataset.name}
                  </h3>
                  <span className="text-xs bg-[#2d4a3d] px-2 py-0.5 rounded text-[#a7c4a0] whitespace-nowrap">
                    {dataset.format}
                  </span>
                </div>

                <p className="text-xs text-[#a7c4a0] mt-0.5 font-mono">{dataset.path}</p>
                <p className="text-sm text-[#e8f5e9] mt-2">{dataset.description}</p>

                {(dataset.size || dataset.rows) && (
                  <div className="flex gap-4 mt-2 text-xs text-[#a7c4a0]">
                    {dataset.size && (
                      <span className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        {dataset.size}
                      </span>
                    )}
                    {dataset.rows && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {dataset.rows} rows
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDatasets.length === 0 && (
        <div className="text-center py-12 text-[#a7c4a0]">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No datasets found matching your search.</p>
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 pt-6 border-t border-[#2d4a3d]">
        <h4 className="text-sm font-semibold text-[#a7c4a0] mb-3">Storage Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d]">
            <div className="text-[#22c55e] font-semibold">15 Raw Datasets</div>
            <div className="text-[#a7c4a0] text-xs">data/cache/ (~220 MB)</div>
          </div>
          <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d]">
            <div className="text-[#22c55e] font-semibold">8 Processed Files</div>
            <div className="text-[#a7c4a0] text-xs">Parquet + GeoJSON</div>
          </div>
          <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d]">
            <div className="text-[#22c55e] font-semibold">5 External Sources</div>
            <div className="text-[#a7c4a0] text-xs">Shapefiles + CSVs</div>
          </div>
          <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d]">
            <div className="text-[#22c55e] font-semibold">6 ML Models</div>
            <div className="text-[#a7c4a0] text-xs">Pickle + JSON features</div>
          </div>
        </div>
      </div>
    </div>
  );
}