import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ZipFeature {
  zipcode: string;
  heat_score?: number;
  air_quality_score: number;
  tree_density: number;
  tree_gap: number;
  cooling_site_distance: number;
  total_fuel_oil_gallons: number;
  ej_score: number;
  pollution_proxy?: number;
  building_density: number;
  parks_coverage: number;
  flood_risk: number;
  population_density: number;
  planting_history: number;
  priority_final: number;
  tree_count: number;
  heat_vulnerability_index: number;
  indoor_complaints: number;
}

interface ZipData {
  zipcode: string;
  impact_per_dollar: number;
  recommended_tree_count: number;
  projected_temp_reduction_F: number;
  projected_pm25_reduction_lbs_per_year: number;
  projected_co2_reduction_kg_per_year?: number;
  current_co2_reduction_kg_per_year?: number;
  priority_final: number;
  ej_score: number;
  features: ZipFeature;
}

export class ZipService {
  private featuresCache: Map<string, ZipFeature> = new Map();
  private modelPath: string;
  private featuresPath: string;
  private baseDir: string;

  constructor() {
    // Resolve base directory - handle both dev (ts-node) and production (compiled) paths
    // When compiled, __dirname is backend/dist/services
    // We need to go up to project root (urban futures)
    const isDev = __dirname.includes('src');
    if (isDev) {
      this.baseDir = path.resolve(__dirname, '../../..');
    } else {
      // In production: backend/dist/services -> backend/dist -> backend -> project root
      this.baseDir = path.resolve(__dirname, '../../..');
    }
    this.modelPath = path.join(this.baseDir, 'data/models/impact_model.bin');
    this.featuresPath = path.join(this.baseDir, 'data/models/zip_features.parquet');
    const jsonPath = path.join(this.baseDir, 'data/models/zip_features.json');
    
    // Try loading from JSON first (faster, no Python dependency)
    if (fs.existsSync(jsonPath)) {
      this.loadFeaturesFromJSON(jsonPath);
    } else {
      // Fallback to Python/Parquet
      this.loadFeaturesSync();
    }
  }

  private loadFeaturesFromJSON(jsonPath: string) {
    try {
      const data = fs.readFileSync(jsonPath, 'utf-8');
      const features: ZipFeature[] = JSON.parse(data);
      
      for (const feature of features) {
        this.featuresCache.set(feature.zipcode, feature);
      }
      
      console.log(`✅ Loaded ${this.featuresCache.size} ZIP codes from JSON`);
    } catch (error: any) {
      console.error('❌ Error loading features from JSON:', error.message);
      // Fallback to Python method
      this.loadFeaturesSync();
    }
  }

  private loadFeaturesSync() {
    try {
      // Use Python script file to avoid numpy import issues
      // Script is in backend/scripts, not in dist
      const isDev = __dirname.includes('src');
      const scriptPath = isDev
        ? path.resolve(__dirname, '../../scripts/load_features.py')
        : path.resolve(__dirname, '../../../backend/scripts/load_features.py');
      
      // Change to a safe directory to avoid numpy import issues
      const safeDir = '/tmp';
      const output = execSync(`cd "${safeDir}" && python3 "${scriptPath}" "${this.featuresPath}"`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 30000 // 30 second timeout
      });
      
      const features: ZipFeature[] = JSON.parse(output.trim());
      
      for (const feature of features) {
        this.featuresCache.set(feature.zipcode, feature);
      }
      
      console.log(`✅ Loaded ${this.featuresCache.size} ZIP codes from ${this.featuresPath}`);
    } catch (error: any) {
      console.error('❌ Error loading features:', error.message);
      const isDev = __dirname.includes('src');
      const scriptPath = isDev
        ? path.resolve(__dirname, '../../scripts/load_features.py')
        : path.resolve(__dirname, '../../../backend/scripts/load_features.py');
      console.error('Script path:', scriptPath);
      console.error('Features path:', this.featuresPath);
      // Don't throw - allow server to start even if features fail to load
    }
  }

  private predictImpact(features: ZipFeature): number {
    // Use Python subprocess to call Random Forest model
    // In production, could use ONNX runtime or similar for faster inference
    try {
      const pythonScript = `
import sys
import pickle
import json
import numpy as np
import pandas as pd
from pathlib import Path

base_dir = Path('${this.baseDir}')
model_path = base_dir / 'data/models/impact_model.pkl'
scaler_path = base_dir / 'data/models/scaler.pkl'
feature_names_path = base_dir / 'data/models/feature_names.json'

# Load model and scaler
with open(model_path, 'rb') as f:
    model = pickle.load(f)
with open(scaler_path, 'rb') as f:
    scaler = pickle.load(f)
with open(feature_names_path, 'r') as f:
    feature_names = json.load(f)

# Prepare features from input
features = json.loads(sys.argv[1])
feature_dict = {
    'heat_score': features.get('heat_score', 0),
    'air_quality_score': features.get('air_quality_score', 0),
    'tree_density': features.get('tree_density', 0),
    'cooling_site_distance': features.get('cooling_site_distance', 100),
    'ej_score': features.get('ej_score', 0),
    'pollution_proxy': features.get('pollution_proxy', 0),
    'total_fuel_oil_gallons': features.get('total_fuel_oil_gallons', 0),
}

# Feature engineering (match training pipeline)
df = pd.DataFrame([feature_dict])

# Normalize cooling distance
cooling_dist = df['cooling_site_distance'].replace([np.inf, -np.inf], np.nan)
df['cooling_site_distance_norm'] = 1 / (1 + cooling_dist.fillna(100) / 10)

# Log transform fuel oil
df['fuel_oil_log'] = np.log1p(df['total_fuel_oil_gallons'])

# Interaction terms
df['heat_x_ej'] = df['heat_score'] * df['ej_score']
df['air_x_ej'] = df['air_quality_score'] * df['ej_score']
df['heat_x_air'] = df['heat_score'] * df['air_quality_score']
df['tree_gap_x_ej'] = (1 - df['tree_density']) * df['ej_score']
df['heat_air_combined'] = (df['heat_score'] + df['air_quality_score']) / 2

# Extract features in correct order
X = df[feature_names].values

# Scale and predict
X_scaled = scaler.transform(X)
prediction = model.predict(X_scaled)[0]

print(json.dumps({'impact_per_dollar': float(prediction)}))
`;
      
      const featuresJson = JSON.stringify({
        heat_score: features.heat_score || 0,
        air_quality_score: features.air_quality_score || 0,
        tree_density: features.tree_density || 0,
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
      // Fallback to simple heuristic
      const heat_norm = features.heat_score || 0;
      const air_norm = features.air_quality_score || 0;
      const tree_gap = features.tree_gap || 0; // Use pre-calculated normalized tree gap
      const ej_norm = features.ej_score || 0;

      const impact_index = (
        0.3 * heat_norm +
        0.25 * air_norm +
        0.2 * tree_gap  // Use normalized tree gap instead of 1 - raw_tree_density
      ) * (1 + 0.4 * ej_norm);
      
      const cost_per_tree = 500 + ej_norm * 1500;
      return Math.max(0, impact_index / (cost_per_tree / 1000));
    }
  }

  async getZipData(zipcode: string): Promise<ZipData | null> {
    const features = this.featuresCache.get(zipcode);
    if (!features) {
      return null;
    }
    
    const impact_per_dollar = this.predictImpact(features);
    
    // Estimate recommended tree count (based on priority and tree gap)
    // tree_gap is already normalized (0-1) from data pipeline
    const recommended_tree_count = Math.max(0, Math.floor(
      features.priority_final * 100 + features.tree_gap * 50
    ));
    
    // Projected impacts (based on literature: 2°F per tree, 0.16 lbs PM2.5 per tree/year)
    const projected_temp_reduction_F = recommended_tree_count * 0.02; // Scaled down
    const projected_pm25_reduction_lbs_per_year = recommended_tree_count * 0.16;
    
    // CO2 reduction: average mature tree sequesters ~21.77 kg CO2 per year
    const current_co2_reduction_kg_per_year = features.tree_count * 21.77;
    const projected_co2_reduction_kg_per_year = recommended_tree_count * 21.77;
    
    return {
      zipcode,
      impact_per_dollar,
      recommended_tree_count,
      projected_temp_reduction_F,
      projected_pm25_reduction_lbs_per_year,
      projected_co2_reduction_kg_per_year,
      current_co2_reduction_kg_per_year,
      priority_final: features.priority_final,
      ej_score: features.ej_score,
      features
    };
  }

  async getAllZips(): Promise<Array<{ zipcode: string; priority_final: number }>> {
    const zips = Array.from(this.featuresCache.values()).map(f => ({
      zipcode: f.zipcode,
      priority_final: f.priority_final
    }));
    
    return zips.sort((a, b) => b.priority_final - a.priority_final);
  }

  async getTrees(bbox?: string): Promise<Array<{ lat: number; lon: number }>> {
    // Simplified: return empty array
    // In production, would load from street_trees_2015.csv and filter by bbox
    return [];
  }
}

