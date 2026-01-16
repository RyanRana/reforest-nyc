import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { execSync } from 'child_process';
import { H3Service } from './h3Service';

interface PredictionRequest {
  h3_cell?: string;
  zipcode?: string;
  years: number;
  tree_count?: number; // Optional: override tree count
}

interface YearlyPrediction {
  year: number;
  tree_count: number;
  avg_dbh_cm: number;
  survival_rate: number;
  co2_sequestration_kg_per_year: number;
  co2_cumulative_kg: number;
  temperature_reduction_f: number;
  pm25_reduction_lbs_per_year: number;
}

interface PredictionResult {
  h3_cell?: string;
  zipcode?: string;
  base_year: number;
  projection_years: number;
  current_state: {
    tree_count: number;
    base_tree_count?: number;
    new_trees_planted?: number;
    avg_dbh_cm: number;
    co2_sequestration_kg_per_year: number;
    temperature_reduction_f: number;
    pm25_reduction_lbs_per_year: number;
  };
  yearly_projections: YearlyPrediction[];
  summary: {
    final_tree_count: number;
    total_co2_sequestered_kg: number;
    total_co2_sequestered_metric_tons: number;
    avg_temperature_reduction_f: number;
    total_pm25_reduced_lbs: number;
  };
}

export class PredictionService {
  private h3Service: H3Service;
  private baseDir: string;
  private predictorPath: string;
  private predictionServerUrl: string;
  private aiPredictionServerUrl: string;

  constructor() {
    this.h3Service = new H3Service();
    const isDev = __dirname.includes('src');
    this.baseDir = path.resolve(__dirname, '../../..');
    this.predictorPath = path.join(this.baseDir, 'data/models/tree_growth_predictor.pkl');
    // Use persistent Python server if available, fallback to direct call
    this.predictionServerUrl = process.env.PREDICTION_SERVER_URL || 'http://localhost:3002';
    this.aiPredictionServerUrl = process.env.AI_PREDICTION_SERVER_URL || 'http://localhost:3003';
  }

  /**
   * Predict tree impacts for any number of years forward.
   */
  async predictForward(request: PredictionRequest): Promise<PredictionResult> {
    const { h3_cell, zipcode, years, tree_count } = request;

    if (!h3_cell && !zipcode) {
      throw new Error('Must provide either h3_cell or zipcode');
    }

    if (years < 1 || years > 100) {
      throw new Error('Years must be between 1 and 100');
    }

    // Get current tree data
    let currentTreeCount: number;
    let avgDbh: number;
    let currentFeatures: any;
    let baseTreeCount: number; // Original tree count before adding new trees

    if (h3_cell) {
      const h3Data = await this.h3Service.getH3Data(h3_cell);
      if (!h3Data) {
        throw new Error(`H3 cell ${h3_cell} not found`);
      }
      baseTreeCount = h3Data.tree_count || 0;
      // If tree_count is provided, use it (includes new trees)
      // Otherwise use current tree count
      currentTreeCount = tree_count !== undefined ? tree_count : baseTreeCount;
      avgDbh = h3Data.features?.avg_dbh || 10.0;
      currentFeatures = h3Data.features;
    } else {
      // For ZIP codes, we'd need to load ZIP features
      // For now, use defaults
      baseTreeCount = 0;
      currentTreeCount = tree_count || 0;
      avgDbh = 10.0;
    }

    // Try AI server first (Earth-2 + ML), fallback to regular ML server
    let yearlyPrediction;
    try {
      yearlyPrediction = await this.runAIPrediction({
        tree_count: currentTreeCount,
        base_tree_count: baseTreeCount,
        avg_dbh: avgDbh,
        years: years,
        return_yearly: true
      });
    } catch (error) {
      // Fallback to regular ML prediction server
      console.log("AI server not available, using ML server");
      yearlyPrediction = await this.runPythonPrediction({
        tree_count: currentTreeCount,
        base_tree_count: baseTreeCount,
        avg_dbh: avgDbh,
        years: years,
        return_yearly: true
      });
    }

    // Build yearly projections from ML model predictions
    const yearlyProjections: YearlyPrediction[] = [];
    let cumulativeCo2 = 0;
    let cumulativeTemp = 0;
    let cumulativePm25 = 0;

    if (yearlyPrediction.yearly_predictions && Array.isArray(yearlyPrediction.yearly_predictions)) {
      // Use ML model's yearly predictions
      for (const yearPred of yearlyPrediction.yearly_predictions) {
        cumulativeCo2 += yearPred.co2_annual;
        cumulativeTemp += yearPred.temp_annual;
        cumulativePm25 += yearPred.pm25_annual;

        yearlyProjections.push({
          year: new Date().getFullYear() + yearPred.year,
          tree_count: Math.round(yearPred.tree_count),
          avg_dbh_cm: yearPred.avg_dbh,
          survival_rate: yearPred.survival_rate,
          co2_sequestration_kg_per_year: yearPred.co2_annual,
          co2_cumulative_kg: cumulativeCo2,
          temperature_reduction_f: yearPred.temp_annual,
          pm25_reduction_lbs_per_year: yearPred.pm25_annual
        });
      }
    } else {
      // Fallback: use single prediction and calculate yearly (backward compatible)
      const finalPrediction = await this.runPythonPrediction({
        tree_count: currentTreeCount,
        avg_dbh: avgDbh,
        years: years
      });

      // Use ML-based growth rates (approximate from final prediction)
      const mortalityRate = 0.02;
      const initialTreeCount = currentTreeCount;
      let currentDbh = avgDbh;
      
      // Estimate growth rate from final prediction
      const totalGrowth = (finalPrediction.avg_dbh || avgDbh) - avgDbh;
      const avgGrowthRate = totalGrowth / years;

      for (let year = 1; year <= years; year++) {
        // Use ML-based growth (approximate)
        currentDbh = Math.min(avgDbh + (avgGrowthRate * year), 100);
        
        // Survival from ML model (approximate)
        const survivalRate = finalPrediction.survival_rate ? 
          Math.pow(finalPrediction.survival_rate, year / years) : 
          Math.pow(1 - mortalityRate, year);
        
        const projectedTreeCount = initialTreeCount * survivalRate;

        // Scale impacts based on DBH (same formulas as before)
        const sizeFactor = Math.pow(currentDbh / 20.0, 1.5);
        const co2Annual = 21.77 * sizeFactor * projectedTreeCount;
        const tempAnnual = 0.06 * Math.pow(currentDbh / 20.0, 2) * projectedTreeCount;
        const pm25Annual = 0.18 * sizeFactor * projectedTreeCount;

        cumulativeCo2 += co2Annual;
        cumulativeTemp += tempAnnual;
        cumulativePm25 += pm25Annual;

        yearlyProjections.push({
          year: new Date().getFullYear() + year,
          tree_count: Math.round(projectedTreeCount),
          avg_dbh_cm: currentDbh,
          survival_rate: survivalRate,
          co2_sequestration_kg_per_year: co2Annual,
          co2_cumulative_kg: cumulativeCo2,
          temperature_reduction_f: tempAnnual,
          pm25_reduction_lbs_per_year: pm25Annual
        });
      }
    }

    const finalProjection = yearlyProjections[yearlyProjections.length - 1];

    return {
      h3_cell,
      zipcode,
      base_year: new Date().getFullYear(),
      projection_years: years,
      current_state: {
        tree_count: currentTreeCount,
        base_tree_count: baseTreeCount,
        new_trees_planted: currentTreeCount - baseTreeCount,
        avg_dbh_cm: avgDbh,
        co2_sequestration_kg_per_year: yearlyProjections[0]?.co2_sequestration_kg_per_year || 0,
        temperature_reduction_f: yearlyProjections[0]?.temperature_reduction_f || 0,
        pm25_reduction_lbs_per_year: yearlyProjections[0]?.pm25_reduction_lbs_per_year || 0
      },
      yearly_projections: yearlyProjections,
      summary: {
        final_tree_count: finalProjection.tree_count,
        total_co2_sequestered_kg: cumulativeCo2,
        total_co2_sequestered_metric_tons: cumulativeCo2 / 1000,
        avg_temperature_reduction_f: cumulativeTemp / years,
        total_pm25_reduced_lbs: cumulativePm25
      }
    };
  }

  /**
   * Call the fast prediction server (if running).
   */
  private async callPredictionServer(params: {
    tree_count: number;
    base_tree_count?: number;
    avg_dbh: number;
    years: number;
    return_yearly?: boolean;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.predictionServerUrl}/predict`);
      const postData = JSON.stringify(params);
      
      const options = {
        hostname: url.hostname || 'localhost',
        port: url.port || 3002,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 5000 // 5 second timeout (should be fast, but allow some buffer)
      };
      
      const req = http.request(options, (res: http.IncomingMessage) => {
        let data = '';
        
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`Server returned ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', (e: Error) => {
        reject(e);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(postData);
      req.end();
    });
  }

  /**
   * Run Python prediction model.
   * Uses fast HTTP server (no fallback - user requested no fallback).
   */
  private async runPythonPrediction(params: {
    tree_count: number;
    base_tree_count?: number;
    avg_dbh: number;
    years: number;
    return_yearly?: boolean;
  }): Promise<any> {
    // Use fast HTTP server (model stays loaded in memory)
    const result = await this.callPredictionServer(params);
    return result;
  }

  /**
   * Call the AI prediction server (Earth-2 + ML).
   */
  private async runAIPrediction(params: {
    tree_count: number;
    base_tree_count?: number;
    avg_dbh: number;
    years: number;
    return_yearly?: boolean;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.aiPredictionServerUrl}/predict`);
      const postData = JSON.stringify(params);
      
      const http = require('http');
      const options = {
        hostname: url.hostname || 'localhost',
        port: url.port || 3003,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      };
      
      const req = http.request(options, (res: any) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try { resolve(JSON.parse(data)); }
            catch (e) { reject(new Error(`Failed to parse AI response: ${e}`)); }
          } else {
            reject(new Error(`AI server error: ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', (e: Error) => reject(e));
      req.on('timeout', () => { req.destroy(); reject(new Error('AI request timeout')); });
      req.write(postData);
      req.end();
    });
  }
}
