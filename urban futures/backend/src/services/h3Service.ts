import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { cellToLatLng } from 'h3-js';

interface H3Feature {
  h3_cell: string;
  tree_count: number;
  tree_density_per_km2: number;
  avg_dbh: number;
  std_dbh: number;
  min_dbh: number;
  max_dbh: number;
  health_pct: number;
  alive_pct: number;
  cell_area_km2: number;
  heat_vulnerability_index: number;
  air_quality_score: number;
  total_fuel_oil_gallons: number;
  indoor_complaints: number;
  cooling_site_distance: number;
  ej_score: number;
  heat_score: number;
  air_score: number;
  tree_gap: number;
  pollution_proxy: number;
  priority_base: number;
  priority_final: number;
  building_density: number;
  parks_coverage: number;
  flood_risk: number;
  population_density: number;
  planting_history: number;
}

interface H3Data {
  h3_cell: string;
  location_name?: string;
  impact_per_dollar: number;
  recommended_tree_count: number;
  projected_temp_reduction_F: number;
  projected_pm25_reduction_lbs_per_year: number;
  priority_final: number;
  ej_score: number;
  tree_count: number;
  features: H3Feature;
}

export class H3Service {
  private featuresCache: Map<string, H3Feature> = new Map();
  private locationCache: Map<string, string> = new Map(); // Cache for location names (key: "lat,lng")
  private modelPath: string;
  private featuresPath: string;
  private baseDir: string;

  constructor() {
    const isDev = __dirname.includes('src');
    // Both dev (ts-node) and prod (compiled to dist) live three levels below the
    // project root: backend/{src|dist}/services. Climb three directories to land
    // at the repo root so data paths resolve correctly even with spaces.
    this.baseDir = path.resolve(__dirname, '../../..');
    this.modelPath = path.join(this.baseDir, 'data/models/impact_model.bin');
    this.featuresPath = path.join(this.baseDir, 'data/models/h3_features.parquet');

    // Load H3 features
    this.loadFeatures();
  }

  private loadFeatures() {
    try {
      const jsonPath = path.join(this.baseDir, 'data/models/h3_features.json');
      console.log('Looking for H3 features at:', jsonPath);

      if (fs.existsSync(jsonPath)) {
        const data = fs.readFileSync(jsonPath, 'utf-8');
        const features: H3Feature[] = JSON.parse(data);

        for (const feature of features) {
          this.featuresCache.set(feature.h3_cell, feature);
        }

        console.log(`✅ Loaded ${this.featuresCache.size} H3 cells from JSON`);
      } else {
        console.error('❌ H3 features JSON file not found:', jsonPath);
        console.error('Make sure H3 data is generated with: python3 python/data_pipeline/prepare_zip_features.py h3 9');
      }
    } catch (error: any) {
      console.error('❌ Error loading H3 features:', error.message);
    }
  }

  /**
   * Reverse geocode an H3 cell to get a human-readable location name.
   * Uses Nominatim (OpenStreetMap) which is free and doesn't require an API key.
   */
  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    // Round coordinates to ~10m precision to use cache more effectively
    const latRounded = Math.round(lat * 10000) / 10000;
    const lngRounded = Math.round(lng * 10000) / 10000;
    const cacheKey = `${latRounded},${lngRounded}`;
    
    // Check cache first
    if (this.locationCache.has(cacheKey)) {
      return this.locationCache.get(cacheKey)!;
    }
    
    try {
      // Add a small delay to respect rate limits (Nominatim has 1 req/sec limit)
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ReforestNYC/1.0 (urban tree planting analysis)' // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        console.error(`Nominatim API error for lat=${lat}, lng=${lng}: ${response.status}`);
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data: any = await response.json();
      
      // Debug logging (can be removed in production)
      if (!data.address || !data.address.quarter) {
        console.log(`Reverse geocoding for lat=${lat}, lng=${lng}:`, {
          quarter: data.address?.quarter,
          neighbourhood: data.address?.neighbourhood,
          suburb: data.address?.suburb,
          road: data.address?.road,
          display_name: data.display_name?.substring(0, 100)
        });
      }
      
      // Extract readable location from address components
      if (data.address) {
        const addr: any = data.address;
        
        // For NYC, Nominatim uses:
        // - quarter: neighborhood (e.g., "Upper West Side", "East Village") - most specific
        // - suburb: borough (e.g., "Manhattan", "Brooklyn", "The Bronx")
        // - road: street name
        // - neighbourhood: sometimes community board (less useful)
        
        // Build location string with priority order
        let locationParts: string[] = [];
        
        // Most specific: neighborhood/quarter name
        if (addr.quarter) {
          locationParts.push(addr.quarter);
        } else if (addr.neighbourhood && !addr.neighbourhood.includes('Community Board')) {
          locationParts.push(addr.neighbourhood);
        }
        
        // Add street name if we don't have a neighborhood
        if (addr.road && !addr.quarter && !addr.neighbourhood) {
          locationParts.push(addr.road);
        }
        
        // Add borough (suburb in Nominatim terms)
        if (addr.suburb && addr.suburb !== 'City of New York') {
          // Only add if it's different from what we already have
          if (!locationParts.includes(addr.suburb)) {
            locationParts.push(addr.suburb);
          }
        }
        
        // Return the best combination we found
        if (locationParts.length > 0) {
          const result = locationParts.join(', ');
          this.locationCache.set(cacheKey, result);
          return result;
        }
        
        // Fallback: just borough if available
        if (addr.suburb && addr.suburb !== 'City of New York') {
          this.locationCache.set(cacheKey, addr.suburb);
          return addr.suburb;
        }
        
        // Fallback: just road name if available
        if (addr.road) {
          this.locationCache.set(cacheKey, addr.road);
          return addr.road;
        }
      }
      
      // Try display_name as last resort (contains full address string)
      if (data.display_name) {
        const parts = data.display_name.split(',');
        // Look for the most specific non-generic part
        for (const part of parts) {
          const trimmed = part.trim();
          // Skip generic parts
          if (trimmed && 
              !trimmed.includes('City of New York') && 
              !trimmed.includes('New York County') &&
              !trimmed.includes('United States') &&
              !trimmed.includes('Community Board') &&
              !trimmed.match(/^\d{5}$/) && // Skip ZIP codes
              trimmed.length > 3) {
            this.locationCache.set(cacheKey, trimmed);
            return trimmed;
          }
        }
      }
      
      // Final fallback - log what we got for debugging
      console.warn(`Could not extract location name from Nominatim response for lat=${lat}, lng=${lng}. Address:`, JSON.stringify(data.address));
      const fallback = 'NYC';
      this.locationCache.set(cacheKey, fallback);
      return fallback;
    } catch (error) {
      console.error(`Reverse geocoding error for lat=${lat}, lng=${lng}:`, error);
      const fallback = 'NYC';
      this.locationCache.set(cacheKey, fallback);
      return fallback;
    }
  }

  private predictImpact(features: H3Feature): number {
    // Use same prediction logic as ZipService
    try {
      const modelPath = path.join(this.baseDir, 'data/models/impact_model.pkl').replace(/\\/g, '/');
      const scalerPath = path.join(this.baseDir, 'data/models/scaler.pkl').replace(/\\/g, '/');
      const featureNamesPath = path.join(this.baseDir, 'data/models/feature_names.json').replace(/\\/g, '/');
      const baseDirEscaped = this.baseDir.replace(/\\/g, '/').replace(/'/g, "\\'");
      
      const pythonScript = `
import sys
import os
import pickle
import json
import numpy as np
import pandas as pd

try:
    os.chdir(r'${baseDirEscaped}')
    with open(r'${modelPath}', 'rb') as f:
        model = pickle.load(f)
    with open(r'${scalerPath}', 'rb') as f:
        scaler = pickle.load(f)
    with open(r'${featureNamesPath}', 'r') as f:
        feature_names = json.load(f)

    features = json.loads(sys.argv[1])
    feature_dict = {
        'heat_score': features.get('heat_score', 0),
        'air_quality_score': features.get('air_quality_score', 0),
        'tree_density': features.get('tree_density_per_km2', 0),
        'cooling_site_distance': features.get('cooling_site_distance', 100),
        'ej_score': features.get('ej_score', 0),
        'pollution_proxy': features.get('pollution_proxy', 0),
        'total_fuel_oil_gallons': features.get('total_fuel_oil_gallons', 0),
    }

    df = pd.DataFrame([feature_dict])

    cooling_dist = df['cooling_site_distance'].replace([np.inf, -np.inf], np.nan)
    df['cooling_site_distance_norm'] = 1 / (1 + cooling_dist.fillna(100) / 10)
    df['fuel_oil_log'] = np.log1p(df['total_fuel_oil_gallons'])

    df['heat_x_ej'] = df['heat_score'] * df['ej_score']
    df['air_x_ej'] = df['air_quality_score'] * df['ej_score']
    df['heat_x_air'] = df['heat_score'] * df['air_quality_score']
    df['tree_gap_x_ej'] = (1 - df['tree_density']) * df['ej_score']
    df['heat_air_combined'] = (df['heat_score'] + df['air_quality_score']) / 2

    X = df[feature_names].values
    X_scaled = scaler.transform(X)
    prediction = model.predict(X_scaled)[0]

    print(json.dumps({'impact_per_dollar': float(prediction)}))
except Exception as e:
    import sys
    sys.stderr.write("Error: " + str(e) + "\\n")
    sys.exit(1)
`;

      const featuresJson = JSON.stringify({
        heat_score: features.heat_score || 0,
        air_quality_score: features.air_quality_score || 0,
        tree_density_per_km2: features.tree_density_per_km2 || 0,
        cooling_site_distance: features.cooling_site_distance || 100,
        ej_score: features.ej_score || 0,
        pollution_proxy: features.pollution_proxy || 0,
        total_fuel_oil_gallons: features.total_fuel_oil_gallons || 0,
      });

      const output = execSync(`python3 -c "${pythonScript.replace(/\n/g, ' ')}" "${featuresJson}"`, {
        encoding: 'utf-8',
        cwd: this.baseDir,
        maxBuffer: 10 * 1024 * 1024
      });

      const result = JSON.parse(output);
      return Math.max(0, result.impact_per_dollar);
    } catch (error) {
      console.error('Error predicting with RF model, using fallback:', error);
      // Fallback heuristic
      const heat_norm = features.heat_score || 0;
      const air_norm = features.air_quality_score || 0;
      const tree_gap = features.tree_gap || 0;
      const ej_norm = features.ej_score || 0;

      const impact_index = (
        0.3 * heat_norm +
        0.25 * air_norm +
        0.2 * tree_gap
      ) * (1 + 0.4 * ej_norm);

      const cost_per_tree = 500 + ej_norm * 1500;
      return Math.max(0, impact_index / (cost_per_tree / 1000));
    }
  }

  async getH3Data(h3Cell: string): Promise<H3Data | null> {
    const features = this.featuresCache.get(h3Cell);
    if (!features) {
      return null;
    }

    // Convert H3 cell to lat/lng coordinates
    const [lat, lng] = cellToLatLng(h3Cell);
    
    // Get human-readable location name via reverse geocoding
    const locationName = await this.reverseGeocode(lat, lng);

    const impact_per_dollar = this.predictImpact(features);

    // Calculate priority if not available
    let priority_final = features.priority_final;
    if (priority_final === null || priority_final === undefined) {
      // Calculate priority using the same logic as the data pipeline
      const heat_score = features.heat_score || 0;
      const air_score = features.air_quality_score || 0;
      const tree_gap = features.tree_gap || 0;
      const pollution_proxy = features.pollution_proxy || 0;
      const ej_score = features.ej_score || 0;

      const priority_base = (
        0.35 * heat_score +
        0.25 * air_score +
        0.25 * tree_gap +
        0.15 * pollution_proxy
      );

      priority_final = priority_base * (1 + 0.4 * ej_score);
    }

    const recommended_tree_count = Math.max(0, Math.floor(
      priority_final * 100 + (features.tree_gap || 0) * 50
    ));

    const projected_temp_reduction_F = recommended_tree_count * 0.02;
    const projected_pm25_reduction_lbs_per_year = recommended_tree_count * 0.16;

    return {
      h3_cell: h3Cell,
      location_name: locationName,
      impact_per_dollar,
      recommended_tree_count,
      projected_temp_reduction_F,
      projected_pm25_reduction_lbs_per_year,
      priority_final,
      ej_score: features.ej_score,
      tree_count: features.tree_count,
      features
    };
  }

  async getAllH3Cells(): Promise<Array<{ h3_cell: string; priority_final: number }>> {
    const cells = Array.from(this.featuresCache.values()).map(f => ({
      h3_cell: f.h3_cell,
      priority_final: f.priority_final
    }));

    return cells.sort((a, b) => b.priority_final - a.priority_final);
  }

  async getTrees(bbox?: string): Promise<Array<{ lat: number; lon: number }>> {
    // Simplified: return empty array
    // In production, would load from street_trees_2015.csv and filter by bbox
    return [];
  }
}
